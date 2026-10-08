'use strict';
const fs=require('node:fs');
let html=fs.readFileSync('index.html','utf8').replace('<link rel="stylesheet" href="style.css">',()=>'<style>'+fs.readFileSync('style.css','utf8')+'</style>');
for(const name of ['pension-engine.js','app.js'])html=html.replace('<script src="'+name+'"></script>',()=>'<script>'+fs.readFileSync(name,'utf8').replace(/<\/script/gi,'<\\/script')+'</script>');
const vm=require('node:vm'),scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
if(scripts.length!==2||html.includes('<script src='))throw Error('Standalone packaging failed');
for(const script of scripts)new vm.Script(script[1]);
fs.writeFileSync('연금계산기.html',html,'utf8');console.log('Created standalone pension calculator; bundled script syntax verified');
