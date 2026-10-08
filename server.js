'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const files={'/':'index.html','/index.html':'index.html','/style.css':'style.css','/app.js':'app.js','/pension-engine.js':'pension-engine.js'};
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8'};
function createServer(){return http.createServer((req,res)=>{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{Allow:'GET, HEAD'});return res.end('Method not allowed');}
  const route=req.url.split('?')[0];
  if(!Object.hasOwn(files,route)){res.writeHead(404);return res.end('Not found');}
  const name=files[route];
  fs.readFile(path.join(__dirname,name),(err,data)=>{
    if(err){res.writeHead(500);return res.end('Read error');}
    res.writeHead(200,{'Content-Type':types[path.extname(name)],'Cache-Control':'no-store'});
    res.end(req.method==='HEAD'?undefined:data);
  });
});}
if(require.main===module){
  const port=Number(process.env.PORT||8765),host=process.env.HOST||'127.0.0.1';
  if(!Number.isInteger(port)||port<0||port>65535)throw Error('PORT must be an integer from 0 to 65535');
  const server=createServer();
  server.on('error',err=>{console.error('Preview could not start:',err.message);process.exitCode=1;});
  server.listen(port,host,()=>console.log('Pension planner: http://'+(host==='0.0.0.0'?'localhost':host)+':'+server.address().port));
}
module.exports={createServer};
