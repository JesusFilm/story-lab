import { generate, resolveConfig, rasterize, verify } from '../src/index.mjs';
self.onmessage = ({data}) => {
  const {id,type,config}=data;
  try {
    if(type==='generate'){
      const result=generate(config,progress=>self.postMessage({id,type:'progress',...progress}));
      self.postMessage({id,type:'result',result},[result.raster.pixels.buffer]);
    } else if(type==='edit'){
      const maze={...data.maze,config:resolveConfig(config)},raster=rasterize(maze),report=verify(maze,raster);
      const result={maze,raster,report,passed:report.passed,attempts:data.maze.attempt+1};
      self.postMessage({id,type:'result',result},[raster.pixels.buffer]);
    } else if(type==='stress'){
      const results=[];
      for(let i=0;i<30;i++){
        const seed=`${config.seed}/stress-${i+1}`,r=generate({...config,seed});
        results.push({seed,passed:r.passed,attempts:r.attempts,failures:r.report.checks.filter(c=>!c.pass).map(c=>c.label)});
        self.postMessage({id,type:'stress-progress',done:i+1,passed:results.filter(r=>r.passed).length});
      }
      self.postMessage({id,type:'stress-result',results});
    } else throw new Error('Unknown worker operation.');
  }catch(error){self.postMessage({id,type:'error',message:error.message});}
};
