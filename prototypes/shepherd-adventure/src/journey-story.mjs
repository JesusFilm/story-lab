import {StoryDiorama} from '../vendor/story-diorama/story-diorama.mjs';
import {createStoryMedia} from './story-media.mjs';
export function createJourneyStory({onClose,onPlaying=()=>{}}){
 const $=s=>document.querySelector(s),overlay=$('#story-overlay'),stage=$('#story-scene'),next=$('#story-next'),status=$('#story-status'),bubble=$('#angel-bubble'),media=createStoryMedia();
 let player=null,kind=null,muted=false,generation=0,previousFocus;
 function syncSound(){ $('#story-sound').textContent=muted?'Music off':'Music on';$('#story-sound').setAttribute('aria-pressed',String(!muted));}
 const close=()=>{generation++;const completed=kind;kind=null;player?.destroy();player=null;stage.replaceChildren();bubble.textContent='';overlay.hidden=true;document.body.classList.remove('story-playing');if(completed)media.release(completed);previousFocus?.focus?.({preventScroll:true});};
 const finish=()=>{const completed=kind;if(!completed)return;close();onClose(completed);};
 function advance(){if(!player)return;const s=player.getState();if(s.paused)player.pause(false);else player.next();}
 function sound(){muted=!muted;syncSound();player?.setMuted(muted);if(!muted)player?.retryAudio();else{$('#story-audio-retry').hidden=true;status.textContent='Music off. The story will continue.';}}
 async function open(which){
  close();previousFocus=document.activeElement;kind=which;const token=generation;document.body.classList.add('story-playing');if(!media.isReady(which))window.storyLoading?.show();
  overlay.setAttribute('aria-label',which==='opening'?'The angel and the shepherds':'The shepherds find Jesus');bubble.hidden=true;$('#story-audio-retry').hidden=true;$('#story-retry').hidden=true;syncSound();
  try{
   const data=await media.prepare(which);if(token!==generation)return;
   // Auto-play every passage, but wait for Begin/Finish at the last passage.
   const cues=data.cues.map((cue,index)=>({...cue,options:{...cue.options,...(index===data.cues.length-1?{mode:'manual'}:{})}}));
   player=new StoryDiorama(stage,{...data,cues},{mode:'auto',reveal:'typewriter',speed:34,hold:4500,fade:350,appearance:{fontFamily:'Georgia, serif',number:{visible:false},text:{fontSize:'clamp(19px, 2.1vw, 29px)',lineHeight:'1.45',maxHeight:'200px'},image:{fit:'contain',position:'center top'},mobile:{text:{fontSize:'20px',maxHeight:'230px'}}}});
   player.setMuted(muted);
   player.addEventListener('cue',e=>{bubble.hidden=!e.detail.cue.bubble;bubble.textContent=e.detail.cue.bubble?e.detail.cue.text:'';});
   player.addEventListener('state',e=>{const s=e.detail;next.textContent=s.paused?'Resume story · OK':s.phase==='revealing'?'Show passage · OK':s.index===s.total-1?(kind==='opening'?'Begin adventure · OK':'Finish story · OK'):'Next passage · OK';$('#story-progress').textContent=`${s.index+1} / ${s.total}`;});
   player.addEventListener('audioerror',()=>{if(muted)return;status.textContent='Tap Enable music to allow sound, or turn Music off and keep the story.';$('#story-audio-retry').textContent='Enable music';$('#story-audio-retry').hidden=false;});
   player.addEventListener('complete',finish);
   await player.preload();if(token!==generation)return;
   status.textContent='The story plays automatically. Continue at any time with OK.';overlay.hidden=false;window.storyLoading?.ready();player.start();next.focus({preventScroll:true});onPlaying(which);
  }catch(error){if(token!==generation)return;window.storyLoading?.show();window.storyLoading?.fail('Story media could not load. Retry or reload to continue.');const retry=document.querySelector('.loading-retry');if(retry){retry.textContent='Retry story';retry.onclick=()=>open(which);retry.focus({preventScroll:true});}}
 }
 next.onclick=advance;$('#story-skip').onclick=finish;$('#story-sound').onclick=sound;$('#story-retry').onclick=()=>open(kind);$('#story-audio-retry').onclick=()=>{player?.retryAudio();$('#story-audio-retry').hidden=true;status.textContent='The story plays automatically.';};
 // Register before the dynamically imported game. Story keys never leak into it.
 const keys=new Set(['Enter',' ','Select','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Escape','p','P']);
 addEventListener('keydown',e=>{if(!kind||!player||!keys.has(e.key))return;e.preventDefault();e.stopImmediatePropagation();if(e.repeat||!player)return;if(['Enter',' ','Select'].includes(e.key)){const focused=document.activeElement;if(overlay.contains(focused)&&focused!==next&&focused.tagName==='BUTTON')focused.click();else advance();}else if(e.key==='ArrowUp')sound();else if(['Escape','p','P'].includes(e.key))player.pause();},true);
 overlay.addEventListener('keydown',e=>{if(e.key!=='Tab')return;const buttons=[...overlay.querySelectorAll('button,a')].filter(el=>!el.hidden&&!el.disabled);const first=buttons[0],last=buttons.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}});
 addEventListener('pagehide',()=>{close();media.releaseAll();});
 return {open,close,prepare:media.prepare,release:media.release,get active(){return kind!==null;}};
}
