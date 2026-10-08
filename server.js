'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const files={'/':'index.html','/index.html':'index.html','/style.css':'style.css','/app.js':'app.js','/pension-engine.js':'pension-engine.js'},types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8'};
http.createServer((req,res)=>{const name=files[req.url.split('?')[0]];if(!name){res.writeHead(404);return res.end('Not found');}fs.readFile(path.join(__dirname,name),(err,data)=>{if(err){res.writeHead(500);return res.end('Read error');}res.writeHead(200,{'Content-Type':types[path.extname(name)],'Cache-Control':'no-store'});res.end(data);});}).listen(8765,'127.0.0.1',()=>console.log('Pension planner: http://127.0.0.1:8765'));
