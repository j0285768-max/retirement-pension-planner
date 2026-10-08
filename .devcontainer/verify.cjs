'use strict';
const {spawnSync}=require('node:child_process'),path=require('node:path');
const root=path.resolve(__dirname,'..');
for(const args of [['--test','pension-engine.test.js','server.test.js'],['build.js']]){
  const result=spawnSync(process.execPath,args,{cwd:root,stdio:'inherit',windowsHide:true});
  if(result.error)throw result.error;
  if(result.status!==0)process.exit(result.status||1);
}
console.log('Cloud workspace checks passed.');
