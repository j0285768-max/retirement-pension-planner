'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..'),port=Number(process.env.PORT||8765);
function probe(){return new Promise(resolve=>{
  const request=http.get({hostname:'127.0.0.1',port,path:'/',timeout:1500},response=>{
    let body='';response.setEncoding('utf8');response.on('data',chunk=>body+=chunk);
    response.on('end',()=>resolve(response.statusCode===200&&body.includes('연금 나침반')));
    response.on('error',()=>resolve(false));
  });request.on('timeout',()=>request.destroy());request.on('error',()=>resolve(false));
});}
(async()=>{
  if(await probe()){console.log('Pension preview is already running on port '+port);return;}
  const output=fs.openSync(path.join(__dirname,'preview.log'),'a');
  const child=spawn(process.execPath,[path.join(root,'server.js')],{cwd:root,detached:true,windowsHide:true,stdio:['ignore',output,output],env:process.env});
  fs.closeSync(output);child.on('error',err=>{console.error(err.message);process.exitCode=1;});child.unref();
  for(let attempt=0;attempt<20;attempt++){
    if(await probe()){console.log('Pension preview is ready on port '+port+'. Open the forwarded port in Codespaces.');return;}
    await new Promise(resolve=>setTimeout(resolve,250));
  }
  console.error('Preview did not become ready. Check .devcontainer/preview.log, or run npm run dev.');process.exitCode=1;
})().catch(err=>{console.error(err.message);process.exitCode=1;});
