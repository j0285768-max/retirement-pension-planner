(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.Pension=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION=1;
const defaults=()=>({version:VERSION,profile:{birth:1966,birthMonth:1,baseYear:2026,endAge:95,inflation:2,living:2500000,otherIncome:0,deductions:1500000,taxCredit:70000,privateTax:'auto',health:'regional',healthOther:0,healthOtherWeight:100,propertyPremium:0,propertyTaxBase:0,dependentOtherOK:true,salaryPremium:0,healthRate:7.19,careRate:.9448,minHealth:20160,maxHealth:4591740,privateLimit:15000000,dependentLimit:20000000,employeeLimit:20000000,publicWeight:50},national:{enabled:true,monthly:1200000,shift:0,taxable:100,increase:2,insuredMonths:300,workIncome:0,aValue:3193511,manualReduction:0,topupMonths:0,topupCostPerMonth:285000,topupGain:0,topupSaving:0,family:0},accounts:[{id:'retirement',name:'퇴직연금 · IRP',type:'account',startYear:2026,startMonth:1,years:25,rate:3,mode:'period',monthly:1500000,excluded:0,retired:300000000,taxed:0,retirementTax:15000000,eligible:true,limitYear:1,actualYear:1,life:false,healthWeight:0,insuranceTax:0},{id:'saving',name:'연금저축',type:'account',startYear:2026,startMonth:1,years:25,rate:3,mode:'period',monthly:600000,excluded:10000000,retired:0,taxed:90000000,retirementTax:0,eligible:true,limitYear:1,actualYear:1,life:false,healthWeight:0,insuranceTax:0},{id:'personal',name:'개인연금보험',type:'insurance',startYear:2030,startMonth:1,years:25,rate:2,mode:'fixed',monthly:300000,excluded:0,retired:0,taxed:0,retirementTax:0,eligible:true,limitYear:1,actualYear:1,life:false,healthWeight:0,insuranceTax:0}]});
const sum=a=>a.reduce((x,y)=>x+y,0),clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
function normalAge(y){return y<=1952?60:y<=1956?61:y<=1960?62:y<=1964?63:y<=1968?64:65;}
function pmt(p,r,n){if(n<=0)return 0;if(Math.abs(r)<1e-12)return p/n;return p*r/(1-Math.pow(1+r,-n));}
function pensionDeduction(x){return Math.min(9000000,x<=3500000?x:x<=7000000?3500000+(x-3500000)*.4:x<=14000000?4900000+(x-7000000)*.2:6300000+(x-14000000)*.1);}
function incomeTax(x){const brackets=[[14000000,.06,0],[50000000,.15,1260000],[88000000,.24,5760000],[150000000,.35,15440000],[300000000,.38,19940000],[500000000,.40,25940000],[1000000000,.42,35940000],[Infinity,.45,65940000]];const b=brackets.find(b=>x<=b[0]);return Math.max(0,x*b[1]-b[2]);}
function generalTax(pension,other,p){return Math.max(0,incomeTax(Math.max(0,pension-pensionDeduction(pension)+other-p.deductions))-p.taxCredit)*1.1;}
function ageRate(age,life){return life?.033:age<70?.055:age<80?.044:.033;}
function dateIndex(y,m){return y*12+m-1;}
function fromIndex(t){return {year:Math.floor(t/12),month:t%12+1};}
function validate(s){const errors=[];const num=(v,name,min,max)=>{if(!Number.isFinite(v)||v<min||v>max)errors.push(name+'의 범위를 확인하세요 ('+min+' ~ '+max+').');};const p=s.profile,n=s.national;
if(!p||!n||!Array.isArray(s.accounts))return ['입력 파일 구조가 올바르지 않습니다.'];
num(p.birth,'출생연도',1900,2100);num(p.birthMonth,'출생월',1,12);num(p.baseYear,'계산 시작연도',2026,2150);num(p.endAge,'종료 나이',55,120);if(p.birth+p.endAge<p.baseYear)errors.push('종료 나이가 계산 시작연도보다 앞섭니다.');
num(p.inflation,'물가상승률',-20,30);for(const k of ['living','otherIncome','deductions','taxCredit','healthOther','propertyPremium','propertyTaxBase','salaryPremium','minHealth','maxHealth','privateLimit','dependentLimit','employeeLimit'])num(p[k],k,0,1e12);
for(const k of ['healthRate','careRate','publicWeight','healthOtherWeight'])num(p[k],k,0,100);if(p.healthRate<=0)errors.push('건강보험료율은 0보다 커야 합니다.');if(p.minHealth>p.maxHealth)errors.push('건강보험 하한은 상한 이하로 입력하세요.');
if(!['regional','employee','dependent'].includes(p.health)||!['auto','separate','general'].includes(p.privateTax))errors.push('과세/건강보험 선택값이 올바르지 않습니다.');
for(const k of ['monthly','workIncome','aValue','manualReduction','topupCostPerMonth','topupGain','topupSaving','family'])num(n[k],k,0,1e10);num(n.shift,'조기/연기 개월',-60,60);num(n.topupMonths,'추납 개월',0,119);num(n.insuredMonths,'국민연금 가입개월',0,1000);num(n.taxable,'국민연금 과세비율',0,100);num(n.increase,'국민연금 인상률',-20,30);
if(n.enabled&&n.insuredMonths+n.topupMonths<120)errors.push('국민연금 가입기간이 추납 후에도 120개월 미만입니다. 공단 수급권을 먼저 확인하세요.');if(n.enabled&&n.shift<0&&n.workIncome>n.aValue)errors.push('소득 있는 업무 기준(A값)을 초과하여 조기연금 수급을 계산할 수 없습니다.');if(n.family>n.monthly)errors.push('부양가족연금액은 기준 월 연금액 이하로 입력하세요.');if(n.topupSaving>n.topupMonths*n.topupCostPerMonth)errors.push('추납 절세액은 추납 납부액 이하로 입력하세요.');
if(s.accounts.length>30)errors.push('연금은 30개까지 입력하세요.');const ids=new Set();for(const a of s.accounts){if(ids.has(a.id))errors.push('연금 식별자가 중복되었습니다.');ids.add(a.id);if(!['account','insurance'].includes(a.type)||!['period','fixed'].includes(a.mode))errors.push('연금 종류/방식이 올바르지 않습니다.');num(a.startYear,'개시연도',p.baseYear,2200);num(a.startMonth,'개시월',1,12);num(a.years,'수령기간',1,70);num(a.rate,'연 수익률',-50,50);for(const k of ['excluded','retired','taxed','monthly','retirementTax'])num(a[k],a.name+' '+k,0,1e12);for(const k of ['limitYear','actualYear'])num(a[k],a.name+' '+k,1,100);for(const k of ['healthWeight','insuranceTax'])num(a[k],a.name+' '+k,0,100);if(a.retired===0&&a.retirementTax>0)errors.push(a.name+': 퇴직금 원금 없이 퇴직소득세를 입력할 수 없습니다.');if(a.retirementTax>a.retired)errors.push(a.name+': 퇴직소득세가 퇴직금 원금을 초과합니다.');}
for(const [v,label] of [[p.birth,'출생연도'],[p.birthMonth,'출생월'],[p.baseYear,'시작연도'],[p.endAge,'종료 나이'],[n.shift,'조기/연기 개월'],[n.topupMonths,'추납 개월'],[n.insuredMonths,'가입개월']])if(!Number.isInteger(v))errors.push(label+'는 정수로 입력하세요.');for(const a of s.accounts)for(const k of ['startYear','startMonth','years','limitYear','actualYear'])if(!Number.isInteger(a[k]))errors.push(a.name+' '+k+'는 정수로 입력하세요.');return errors;
}
function health(publicGross,privateAssessed,p){const raw=publicGross+privateAssessed+p.healthOther,assessed=publicGross*p.publicWeight/100+privateAssessed+p.healthOther*p.healthOtherWeight/100;
const dependentOK=raw<=p.dependentLimit&&p.propertyTaxBase<=900000000&&(p.propertyTaxBase<=540000000||raw<=10000000)&&p.dependentOtherOK;
const regional=clamp(Math.max(p.minHealth,assessed/12*p.healthRate/100)+p.propertyPremium,p.minHealth,p.maxHealth);
let basic=regional,status='지역가입 추정';if(p.health==='employee'){const ratio=raw>0?Math.max(0,raw-p.employeeLimit)/raw:0;basic=p.salaryPremium+Math.min(p.maxHealth,assessed*ratio/12*p.healthRate/100);status='직장가입 · 보수 외 추가';}else if(p.health==='dependent'){basic=dependentOK?0:regional;status=dependentOK?'소득·재산 기준 충족 (다른 요건 확인 필요)':'피부양자 기준 초과 → 지역가입 추정';}
return {annual:basic*(1+p.careRate/p.healthRate)*12,basic,care:basic*p.careRate/p.healthRate,assessed,raw,dependentOK,status};}
function simulate(s){const errors=validate(s);if(errors.length)return {errors};const p=s.profile,n=s.national,base=dateIndex(p.baseYear,1),end=dateIndex(p.birth+p.endAge,p.birthMonth);
const nNormal=dateIndex(p.birth+normalAge(p.birth),p.birthMonth)+1,nStart=nNormal+n.shift;
const states=s.accounts.map(a=>({a,excluded:a.excluded,retired:a.retired,taxed:a.taxed,payment:null,received:0,first:dateIndex(a.startYear,a.startMonth),end:dateIndex(a.startYear,a.startMonth)+a.years*12,depleted:null,total:0,tax:0}));
const rows=[],warnings=new Set();if(n.enabled&&nStart<base)warnings.add('국민연금 개시가 계산 시작 이전입니다. 기준 월액은 정상 개시 시점 금액으로 입력하며 과거 수령분은 합계에서 제외합니다.');if(n.topupMonths>0&&n.topupGain===0)warnings.add('추납 후 월 증가액이 0원입니다. 공단에서 확인한 추납 전·후 예상액의 차이를 입력해야 효과가 계산됩니다.');if(p.privateTax==='general')warnings.add('종합과세는 모든 적격 사적연금에 적용합니다. 세액은 입력한 소득금액·공제·세액공제만 반영한 추정입니다.');
let totalTax=0,totalHealth=0,totalGross=0,totalReal=0;
for(let year=p.baseYear;dateIndex(year,1)<end;year++){
let ng=0,publicTaxable=0,insuranceTax=0,retTax=0,nonTax=0,priv=0,privWH=0,privateHealth=0,accountGross=0,otherWithdraw=0;const details=states.map(st=>({id:st.a.id,name:st.a.name,gross:0,tax:0,private:0,withheld:0,nonPension:0,limit:Infinity,remaining:0,payment:0}));
const used=states.map(()=>0),activeYear=states.map(st=>year-st.a.startYear+st.a.limitYear);
states.forEach((st,i)=>{const a=st.a,ly=activeYear[i];details[i].limit=ly<11&&ly>=1?(st.excluded+st.retired+st.taxed)/(11-ly)*1.2:Infinity;});
for(let month=1;month<=12;month++){
const t=dateIndex(year,month);if(t>=end)break;const age=Math.floor((t-dateIndex(p.birth,p.birthMonth))/12);
if(n.enabled&&t>=nStart){const factor=n.shift<0?1+n.shift*.005:1+n.shift*.006;const elapsed=Math.floor((t-nNormal)/12),index=Math.pow(1+n.increase/100,elapsed);
const adjusted=Math.max(0,(n.monthly-n.family+(n.topupMonths>0?n.topupGain:0))*factor+n.family-n.manualReduction)*index;ng+=adjusted;publicTaxable+=adjusted*n.taxable/100;}
states.forEach((st,i)=>{const a=st.a,d=details[i],r=Math.pow(1+a.rate/100,1/12)-1;
if(a.type==='insurance'){if(t>=st.first&&t<st.end){d.gross+=a.monthly;d.payment=a.monthly;const tx=a.monthly*a.insuranceTax/100;d.tax+=tx;insuranceTax+=tx;privateHealth+=a.monthly*a.healthWeight/100;accountGross+=a.monthly;st.total+=a.monthly;st.tax+=tx;}return;}
let balance=st.excluded+st.retired+st.taxed;const growth=balance*r;if(growth>=0)st.taxed+=growth;else{const multiplier=1+r;st.excluded*=multiplier;st.retired*=multiplier;st.taxed*=multiplier;}balance=st.excluded+st.retired+st.taxed;
if(t<st.first||t>=st.end)return;
if(st.payment===null){st.payment=a.mode==='period'?pmt(balance/(1+r),r,a.years*12):a.monthly;const ly=activeYear[i];if(month!==1&&ly<11)d.limit=(balance/(1+r))/(11-ly)*1.2;}
d.payment=st.payment;let payout=Math.min(st.payment,balance);if(balance<.001)payout=0;d.gross+=payout;accountGross+=payout;st.total+=payout;privateHealth+=payout*a.healthWeight/100;
let remaining=payout;const ex=Math.min(remaining,st.excluded);st.excluded-=ex;remaining-=ex;
const rt=Math.min(remaining,st.retired);st.retired-=rt;remaining-=rt;const taxable=Math.min(remaining,st.taxed);st.taxed-=taxable;
const eligible=age>=55&&a.eligible,space=eligible?Math.max(0,d.limit-used[i]):0;const rtPension=Math.min(rt,space);used[i]+=rtPension;const txPension=Math.min(taxable,eligible?Math.max(0,d.limit-used[i]):0);used[i]+=txPension;
const actual=year-a.startYear+a.actualYear,discount=actual<=10?.7:actual<=20?.6:.5;
const rtAmount=a.retired>0?a.retirementTax/a.retired*(rtPension*discount+(rt-rtPension)):0,otherTax=(taxable-txPension)*.165,wh=txPension*ageRate(age,a.life);
retTax+=rtAmount;nonTax+=otherTax;priv+=txPension;privWH+=wh;d.private+=txPension;d.withheld+=wh;d.nonPension+=rt-rtPension+taxable-txPension;d.tax+=rtAmount+otherTax;st.tax+=rtAmount+otherTax;
if(d.nonPension>.01)warnings.add(a.name+': 연금 요건 미충족 또는 수령한도 초과분에 연금외수령 세율을 적용했습니다.');
if(st.excluded+st.retired+st.taxed<.01&&st.depleted===null)st.depleted=fromIndex(t);
});}
const generalPublic=generalTax(publicTaxable,p.otherIncome,p),baseline=generalTax(0,p.otherIncome,p),separate=priv>p.privateLimit?priv*.165:privWH,combined=generalTax(publicTaxable+priv,p.otherIncome,p);
let choice=p.privateTax==='auto'?(combined-generalPublic<separate?'general':'separate'):p.privateTax;let privateFinal=choice==='general'?Math.max(0,combined-generalPublic):separate;
const incrementalPublic=Math.max(0,generalPublic-baseline),pensionTax=retTax+nonTax+insuranceTax+incrementalPublic+privateFinal;
details.forEach((d,i)=>{const allocated=priv>0?privateFinal*d.private/priv:0;d.tax+=allocated;states[i].tax+=allocated;d.remaining=states[i].excluded+states[i].retired+states[i].taxed;});
const months=Math.min(12,end-dateIndex(year,1)),h=health(ng*12/months,privateHealth*12/months,p),h0=health(0,0,p),healthAnnual=h.annual*months/12,gross=ng+accountGross,net=gross-pensionTax-healthAnnual;
let filing='연금만 기준: 별도 신고 불필요 가능 (공적연금 연말정산 완료 전제)';if(priv>p.privateLimit)filing='다음 해 5월 신고 필요 · '+(choice==='general'?'종합과세':'16.5% 분리과세 선택');else if(choice==='general'&&priv>0)filing='다음 해 5월 신고 필요 · 사적연금 종합과세 선택';else if(p.otherIncome>0)filing='다른 소득과 합산 신고 여부 확인 필요';
const real=net/Math.pow(1+p.inflation/100,year-p.baseYear),living=p.living*months*Math.pow(1+p.inflation/100,year-p.baseYear),row={year,age:year-p.birth,months,gross,national:ng,publicTaxable,privateTaxable:priv,tax:pensionTax,publicTax:incrementalPublic,health:healthAnnual,healthAdded:(h.annual-h0.annual)*months/12,healthBase:h.basic,care:h.care,healthStatus:h.status,net,real,living,gap:net-living,balance:sum(details.map(d=>d.remaining)),choice,filing,withholding:privWH,privateFinal,settlement:privateFinal-privWH,details};rows.push(row);totalTax+=pensionTax;totalHealth+=healthAnnual;totalGross+=gross;totalReal+=real;
}
const topupCost=n.enabled?n.topupMonths*n.topupCostPerMonth-n.topupSaving:0;return {errors:[],rows,warnings:[...warnings],accounts:states.map(st=>({id:st.a.id,name:st.a.name,monthly:st.a.type==='insurance'?st.a.monthly:st.payment||0,total:st.total,tax:st.tax,remaining:st.excluded+st.retired+st.taxed,depleted:st.depleted,end:fromIndex(st.end)})),totalGross,totalTax,totalHealth,totalNet:totalGross-totalTax-totalHealth,topupCost,totalAfterTopup:totalGross-totalTax-totalHealth-topupCost,totalReal,normalAge:normalAge(p.birth),nationalStart:fromIndex(nStart)};
}
function nationalCompare(s){const scenarios=[-60,0,60].map(shift=>{const c=JSON.parse(JSON.stringify(s));c.national.shift=shift;return {shift,result:simulate(c)};});const baseline=scenarios[1].result;
const breakEven=r=>{if(r.errors.length||baseline.errors.length)return null;let diff=-r.topupCost+baseline.topupCost,initialSign=0;for(let i=0;i<r.rows.length;i++){diff+=r.rows[i].net-baseline.rows[i].net;const sign=diff>.01?1:diff<-.01?-1:0;if(!initialSign&&sign)initialSign=sign;else if(initialSign&&sign&&sign!==initialSign)return r.rows[i].year;}return null;};
const no=JSON.parse(JSON.stringify(s));no.national.topupMonths=0;no.national.topupGain=0;no.national.topupSaving=0;const without=simulate(no),withTop=simulate(s);let gain=0,payback=null;if(!without.errors.length&&!withTop.errors.length){for(let i=0;i<withTop.rows.length;i++){gain+=withTop.rows[i].net-without.rows[i].net;if(payback===null&&gain>=withTop.topupCost&&withTop.topupCost>0)payback=withTop.rows[i].year;}}
return {scenarios:scenarios.map(x=>({...x,breakEven:breakEven(x.result)})),topup:{cost:withTop.topupCost||0,netGain:gain-(withTop.topupCost||0),payback}};
}
return {VERSION,defaults,pmt,normalAge,pensionDeduction,incomeTax,generalTax,ageRate,validate,simulate,health,nationalCompare};
});

