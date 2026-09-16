// Scene 01: deliberate preparation, with no recipe failures or timing challenge.
export const LAMP_STEPS=Object.freeze([
 {id:'body',title:'Lamp',description:'A small lamp to carry through the village.',action:'Take Lamp',image:'lamp.png',alt:'The bronze lantern used in the village',done:'Lamp selected.'},
 {id:'wick',title:'Linen wick',description:'Fit the wick into the little oil cup.',action:'Add wick',image:'wick.png',alt:'A short braided linen wick with frayed ends',done:'Wick fitted.'},
 {id:'oil',title:'Oil',description:'Pour a little oil into the lamp.',action:'Add oil',image:'oil.png',alt:'The clay oil jar on the workbench',done:'Oil added.'},
 {id:'flint',title:'Flint & tinder',description:'Take what you need to kindle a flame.',action:'Take flint',image:'flint.png',alt:'Flint, a striking stone and a small bundle of tinder',done:'Flint and tinder ready.'},
 {id:'light',title:'A light for the road',description:'Everything is ready. Bring the little flame to life.',action:'Light lamp',image:'lamp.png',alt:'The prepared bronze lantern',done:'A steady little flame.'}
]);
export class LampAssembly{
 constructor(){this.reset();}
 reset(){this.open=false;this.step=0;this.taken=false;this.feedback='';}
 get lit(){return this.step===LAMP_STEPS.length;}
 get current(){return LAMP_STEPS[this.step]??null;}
 begin(){if(this.taken)return false;this.open=true;return true;}
 act(id){if(!this.open||id!==this.current?.id)return false;this.feedback=this.current.done;this.step++;return true;}
 take(){if(!this.open||!this.lit||this.taken)return false;this.taken=true;this.open=false;return true;}
 stageComplete(){this.step=LAMP_STEPS.length;this.taken=true;this.open=false;}
 snapshot(){return {step:this.step,open:this.open,lit:this.lit,taken:this.taken,feedback:this.feedback};}
}
