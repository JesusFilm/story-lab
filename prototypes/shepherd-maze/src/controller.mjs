// Discrete commands over the canonical maze graph. No held-key steering.
export const RADIUS = .43;
export const WALK_SPEED = 3.8;
export const RUN_SPEED = 8;
export const SPEED = WALK_SPEED; // Compatibility for checks measuring the choice window.
export const WALK_START_SECONDS = .8;
const ACCELERATION = 3.5, BRAKING = 8;
export const FOOTPRINT_SPACING = .6, FOOTPRINT_LIFETIME = 60;
export const FOOTPRINT_CAPACITY = Math.ceil(RUN_SPEED / FOOTPRINT_SPACING * FOOTPRINT_LIFETIME) + 16;
export const WARNING_SECONDS = 2;
export const nodeWorld = ([x,z],map) => ({x:x*(map?.node_pitch_m??8)+(map?.node_origin_m?.[0]??6),z:z*(map?.node_pitch_m??8)+(map?.node_origin_m?.[1]??6)});
export const angleDelta = (a,b) => Math.atan2(Math.sin(b-a),Math.cos(b-a));
const id = n => Array.isArray(n)?n.join(','):n;
const same = (a,b) => id(a)===id(b);
const headingTo = (a,b) => Math.atan2(b.x-a.x,b.z-a.z);

export function canOccupy(map,x,z,radius=RADIUS) {
  const tile=map.tile_m,grid=map.walkability_grid;
  for(let row=Math.floor((z-radius)/tile);row<=Math.floor((z+radius)/tile);row++)
    for(let col=Math.floor((x-radius)/tile);col<=Math.floor((x+radius)/tile);col++) {
      if(grid[row]?.[col]===1)continue;
      const nx=Math.max(col*tile,Math.min(x,(col+1)*tile));
      const nz=Math.max(row*tile,Math.min(z,(row+1)*tile));
      if((nx-x)**2+(nz-z)**2<radius**2-1e-10)return false;
    }
  return true;
}

export class Footprints {
  constructor(){this.reset();}
  reset(){this.items=[];this.clock=0;this.spacing=FOOTPRINT_SPACING;this.remainder=0;this.count=0;}
  age(dt){this.clock+=dt;this.items=this.items.filter(p=>this.opacity(p)>0);}
  opacity(p){return Math.max(0,1-(this.clock-p.born)/FOOTPRINT_LIFETIME);}
  walk(a,b,heading){
    const length=Math.hypot(b.x-a.x,b.z-a.z);if(length<1e-8)return;
    let along=this.spacing-this.remainder;
    for(;along<=length+1e-8;along+=this.spacing){
      const side=(this.count++%2?1:-1)*.15,t=along/length;
      this.items.push({x:a.x+(b.x-a.x)*t+Math.cos(heading)*side,
        z:a.z+(b.z-a.z)*t-Math.sin(heading)*side,heading,born:this.clock});
    }
    this.remainder=(this.remainder+length)%this.spacing;
  }
}

export class Controller {
  constructor(map){
    this.map=map;this.adj=new Map(map.nodes.map(n=>[n.id,[]]));
    for(const [a,b]of map.edges){this.adj.get(id(a)).push(id(b));this.adj.get(id(b)).push(id(a));}
    this.points=new Map(map.nodes.map(n=>[n.id,nodeWorld(n.xy,map)]));
    // BFS gives actual shortest routes from every node, including off the saved example paths.
    this.goal=id(map.end);this.goalDistance=new Map([[this.goal,0]]);const queue=[this.goal];
    for(let i=0;i<queue.length;i++)for(const n of this.adj.get(queue[i]))if(!this.goalDistance.has(n)){
      this.goalDistance.set(n,this.goalDistance.get(queue[i])+1);queue.push(n);
    }
    this.serial=0;this.trail=new Footprints();this.reset();
  }
  reset(){
    this.at=id(this.map.start);this.previous=null;this.edge=null;this.resumeTo=null;
    Object.assign(this,this.points.get(this.at));this.heading=headingTo(this,this.points.get(this.adj.get(this.at)[0]));
    this.phase='stopped';this.decision=null;this.turn=null;this.distance=0;this.elapsed=0;this.arrived=false;
    this.restartPace();
    this.trail.reset();this.serial++; // Never recycle IDs across restarts.
  }
  begin(){if(this.phase==='stopped')return this.command('forward');return false;}
  restartPace(){this.travelSpeed=WALK_SPEED;this.movingSinceResume=0;}
  get speed(){return this.phase==='walking'?this.travelSpeed:0;}
  get gait(){return this.phase!=='walking'?'idle':this.travelSpeed>WALK_SPEED+.3?'run':'walk';}
  distanceToSlowPoint(){
    if(!this.edge)return 0;
    let distance=this.edge.length-this.edge.progress,from=this.edge.from,at=this.edge.to;
    const seen=new Set();
    while(!seen.has(at)){
      seen.add(at);const onward=this.onward(at,from);
      if(at===this.goal||onward.length!==1)return distance;
      const next=onward[0],a=this.points.get(at),b=this.points.get(next);
      distance+=Math.hypot(b.x-a.x,b.z-a.z);from=at;at=next;
    }
    return Infinity;
  }
  onward(at,from){return this.adj.get(at).filter(n=>n!==from);}
  options(at,from,heading){return this.onward(at,from).map(next=>{
    const h=headingTo(this.points.get(at),this.points.get(next)),delta=angleDelta(heading,h);
    return {action:Math.abs(delta)<.1?'forward':delta>0?'left':'right',next};
  }).sort((a,b)=>['left','forward','right'].indexOf(a.action)-['left','forward','right'].indexOf(b.action));}
  makeDecision(at,from,heading){
    const options=this.options(at,from,heading);
    if(at===this.goal||options.length<2)return null;
    return {id:++this.serial,at,options,selected:null};
  }
  rotateTo(target,after){
    const delta=angleDelta(this.heading,target);
    if(Math.abs(delta)<.001){this.heading=target;this.phase=after;this.turn=null;return;}
    this.turn={start:this.heading,delta,elapsed:0,duration:Math.abs(delta)>2?.75:.4,after};this.phase='turning';
  }
  depart(next){
    const a=this.points.get(this.at),b=this.points.get(next);
    this.edge={from:this.at,to:next,progress:0,length:Math.hypot(b.x-a.x,b.z-a.z)};
    this.resumeTo=null;this.decision=null;
    this.rotateTo(headingTo(a,b),'walking');
  }
  command(action,decisionId=this.decision?.id){
    if(this.arrived||this.phase==='turning')return false;
    if(decisionId!==undefined&&decisionId!==this.decision?.id)return false;
    if(action==='back')return this.turnBack();
    if(this.decision){
      if(decisionId!==this.decision.id)return false;
      const option=this.decision.options.find(o=>o.action===action);if(!option)return false;
      this.decision.selected=option.next;
      if(this.phase==='waiting'){this.restartPace();this.depart(option.next);}
      return true;
    }
    if(action==='forward'&&this.phase==='stopped'){
      this.restartPace();
      if(this.edge){this.phase='walking';return true;}
      this.depart(this.resumeTo||this.adj.get(this.at)[0]);return true;
    }
    return false;
  }
  turnBack(){
    if(this.edge&&this.edge.progress>1e-6){
      const e=this.edge;this.edge={from:e.to,to:e.from,length:e.length,progress:e.length-e.progress};
      this.at=this.edge.from;this.previous=null;this.decision=null;
      this.rotateTo(headingTo(this.points.get(this.edge.from),this.points.get(this.edge.to)),'stopped');return true;
    }
    if(!this.previous)return false;
    if(this.edge)this.at=this.edge.from;
    this.edge=null;this.decision=null;this.resumeTo=this.previous;
    this.rotateTo(headingTo(this,this.points.get(this.resumeTo)),'stopped');return true;
  }
  arrive(){
    const e=this.edge;this.at=e.to;this.previous=e.from;this.edge=null;Object.assign(this,this.points.get(this.at));
    if(this.at===this.goal){this.arrived=true;this.phase='arrived';this.decision=null;return;}
    const options=this.onward(this.at,this.previous);
    if(!options.length){this.phase='deadend';this.decision=null;return;}
    if(options.length===1){this.depart(options[0]);return;}
    if(!this.decision)this.decision=this.makeDecision(this.at,this.previous,this.heading);
    if(this.decision.selected)this.depart(this.decision.selected);else this.phase='waiting';
  }
  step(dt){
    dt=Math.min(Math.max(dt,0),.05);if(this.arrived)return;
    this.elapsed+=dt;this.trail.age(dt);
    if(this.phase==='turning'){
      const t=this.turn;t.elapsed+=dt;const f=Math.min(1,t.elapsed/t.duration),smooth=f*f*(3-2*f);
      this.heading=t.start+t.delta*smooth;
      if(f===1){this.phase=t.after;this.turn=null;}return;
    }
    if(this.phase!=='walking')return;
    const e=this.edge,a=this.points.get(e.from),b=this.points.get(e.to),old={x:this.x,z:this.z};
    this.movingSinceResume+=dt;
    const target=this.movingSinceResume<=WALK_START_SECONDS?WALK_SPEED:RUN_SPEED;
    // Brake across edge boundaries, with one maximum-frame margin, so the
    // character is already walking when the unchanged two-second prompt appears.
    const brakingDistance=Math.max(0,this.distanceToSlowPoint()-WALK_SPEED*WARNING_SECONDS-RUN_SPEED*.05);
    const safeSpeed=Math.sqrt(WALK_SPEED**2+2*BRAKING*brakingDistance);
    this.travelSpeed=Math.min(target,this.travelSpeed+ACCELERATION*dt,safeSpeed);
    const movement=Math.min(this.travelSpeed*dt,e.length-e.progress);e.progress+=movement;
    const fraction=e.progress/e.length;this.x=a.x+(b.x-a.x)*fraction;this.z=a.z+(b.z-a.z)*fraction;
    this.distance+=movement;this.trail.walk(old,this,this.heading);
    if(!this.decision&&e.length-e.progress<=SPEED*WARNING_SECONDS+.000001)
      this.decision=this.makeDecision(e.to,e.from,this.heading);
    if(e.length-e.progress<1e-7)this.arrive();
  }
  get warningSeconds(){return this.decision&&this.edge?Math.max(0,(this.edge.length-this.edge.progress)/SPEED):0;}
  route(){
    const points=[{x:this.x,z:this.z}];let at=this.at;
    if(this.edge){
      const e=this.edge,back=e.progress+this.goalDistance.get(e.from)*(this.map.node_pitch_m??8),
        forward=e.length-e.progress+this.goalDistance.get(e.to)*(this.map.node_pitch_m??8);
      at=forward<=back?e.to:e.from;
    }
    if(Math.hypot(points[0].x-this.points.get(at).x,points[0].z-this.points.get(at).z)>1e-6)points.push({...this.points.get(at)});
    const ids=[at];
    while(at!==this.goal){at=this.adj.get(at).find(n=>this.goalDistance.get(n)===this.goalDistance.get(at)-1);ids.push(at);points.push({...this.points.get(at)});}
    return {points,ids};
  }
  get suggestedAction(){
    if(!this.decision)return null;
    const at=this.decision.at;
    const next=this.adj.get(at).find(n=>this.goalDistance.get(n)===this.goalDistance.get(at)-1);
    return this.decision.options.find(o=>o.next===next)?.action||'back';
  }
  snapshot(){return {x:this.x,z:this.z,heading:this.heading,phase:this.phase,arrived:this.arrived,distance:this.distance,
    decision:this.decision?{...this.decision,options:this.decision.options.map(o=>({...o}))}:null,
    warningSeconds:this.warningSeconds,footprints:this.trail.items.length,elapsed:this.elapsed,speed:this.speed,gait:this.gait};}
}
