import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,extname,sep} from 'node:path';
import {spawn} from 'node:child_process';
const root=fileURLToPath(new URL('../',import.meta.url)),port=Number(process.env.MAZE_PORT??4318);
const mime={'.html':'text/html','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.md':'text/plain'};
const server=createServer(async(req,res)=>{try{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
  if(req.url==='/health'){res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({app:'maze-foundry',version:'0.1.0'}));return;}
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname),path=resolve(root,'.'+pathname+(pathname.endsWith('/')?'index.html':''));
  if(!path.startsWith(root.endsWith(sep)?root:root+sep)){res.writeHead(403);res.end();return;}
  if(!(await stat(path)).isFile())throw new Error('Missing');
  const data=await readFile(path);res.writeHead(200,{'Content-Type':mime[extname(path)]??'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:data);
}catch{res.writeHead(404);res.end('Not found');}});
const url=`http://127.0.0.1:${port}`;
function openBrowser(){if(!process.argv.includes('--open'))return;const child=spawn(process.platform==='darwin'?'open':'xdg-open',[url],{stdio:'ignore'});child.on('error',()=>console.log(`Open ${url} in your browser.`));}
server.on('error',async error=>{
  if(error.code==='EADDRINUSE'){try{const response=await fetch(`${url}/health`);if((await response.json()).app==='maze-foundry'){console.log(`Maze Foundry is already running: ${url}`);openBrowser();return;}}catch{}
    console.error(`Port ${port} is already occupied. Set MAZE_PORT to another port.`);
  }else console.error(error.message);process.exitCode=1;
});
server.listen(port,'127.0.0.1',()=>{console.log(`Maze Foundry: ${url}\nPress Ctrl+C to stop the local server.`);openBrowser();});
