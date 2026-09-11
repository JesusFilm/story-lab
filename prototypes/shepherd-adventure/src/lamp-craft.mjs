// Deliberate, discrete actions: outcomes never depend on a clock or input latency.
export class LampCraft {
 constructor(){this.reset();}
 reset(){this.wick=0;this.oil=0;this.cap=false;this.result='working';this.message='Fit the wick, then leave a short tip above the collar.';}
 act(action){
  if(action==='retry'){this.reset();return true;}
  if(this.result!=='working')return false;
  if(action==='insert'&&!this.wick){this.wick=1;this.message='Pull the wick up to the small brass mark.';}
  else if(action==='raise'&&this.wick){this.wick=Math.min(4,this.wick+1);this.message='A short tip burns cleanly. Too much will smoke.';}
  else if(action==='lower'&&this.wick){this.wick=Math.max(1,this.wick-1);this.message='Leave the tip level with the brass mark.';}
  else if(action==='pour'&&!this.cap){this.oil=Math.min(4,this.oil+1);this.message='Fill to the mark. Leave room above the oil.';}
  else if(action==='drain'&&!this.cap){this.oil=Math.max(0,this.oil-1);this.message='You pour a little oil back into the jar.';}
  else if(action==='cap'){this.cap=!this.cap;this.message=this.cap?'The cap is secure. Try a spark.':'The reservoir is open.';}
  else if(action==='spark'){
   const fault=!this.wick?'There is no wick to catch the spark.':!this.oil?'The dry wick cannot keep a flame.':this.oil<2?'Too little oil reaches the wick.':this.oil>2?'Oil spills over the collar; the flame gutters out.':!this.cap?'The loose cap leaks; the flame will not settle.':this.wick<2?'The wick is too low; the spark cannot catch.':this.wick>2?'The long wick smokes and blackens. Leave a shorter tip.':null;
   this.result=fault?'failed':'lit';this.message=fault||'A steady little flame. Ready for the road.';
  }else return false;
  return true;
 }
}
