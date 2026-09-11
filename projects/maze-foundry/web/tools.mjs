export function registerMazeTools(context,actions){
  if(!context?.registerTool)return;
  const lifecycle=new AbortController();
  const register=tool=>{try{Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{/* Optional browser API. Core app works without it. */}};
  register({name:'generate_maze',title:'Generate and verify maze',description:'Replace the local inspector maze using the supplied configuration, then return verification results. Missing settings use defaults. Failed mazes remain visible for inspection.',inputSchema:{type:'object',properties:{config:{type:'object'}},required:['config'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},async execute(input){if(!input||Object.keys(input).some(k=>k!=='config')||!input.config||typeof input.config!=='object'||Array.isArray(input.config))throw new Error('Provide a config object.');return actions.generate(input.config);}});
  register({name:'read_maze_report',title:'Read current maze report',description:'Read the displayed maze verification status and whether settings changed since generation.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:false},execute(input){if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).length)throw new Error('No parameters are accepted.');return actions.read();}});
  if(typeof window!=='undefined')window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
  return ()=>lifecycle.abort();
}
