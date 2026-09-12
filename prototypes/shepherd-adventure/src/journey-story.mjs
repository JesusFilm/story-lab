import {StoryDiorama} from '../vendor/story-diorama/story-diorama.mjs';
import {createStoryMedia} from './story-media.mjs';
export function createJourneyStory({onClose,onPlaying=()=>{}}){
 const $=s=>document.querySelector(s),overlay=$('#story-overlay'),stage=$('#story-scene'),next=$('#story-next'),status=$('#story-status'),bubble=$('#angel-bubble'),media=createStoryMedia();
 let player=null,kind=null,muted=false,generation=0,previousFocus;
 function syncSound(){ $('#story-sound').textContent=muted?'Sound off':'Sound on';$('#story-sound').setAttribute('aria-pressed',String(!muted));}
 const close=()=>{generation++;const completed=kind;kind=null;player?.destroy();player=null;stage.replaceChildren();bubble.textContent='';overlay.hidden=true;document.body.classList.remove('story-playing');if(completed)media.release(completed);previousFocus?.focus?.({preventScroll:true});};
 const finish=()=>{const completed=kind;if(!completed)return;close();onClose(completed);};
 function advance(){if(!player)return;const s=player.getState();if(s.phase==='idle')player.start();else if(s.paused)player.pause(false);else player.next();}
 function sound(){muted=!muted;syncSound();player?.setMuted(muted);if(!muted)player?.retryAudio();else{$('#story-audio-retry').hidden=true;status.textContent='';}}
 async function open(which){
  close();previousFocus=document.activeElement;kind=which;const token=generation;document.body.classList.add('story-playing');if(!media.isReady(which))window.storyLoading?.show();
  overlay.setAttribute('aria-label',which==='opening'?'The angel and the shepherds':'The shepherds find Jesus');bubble.hidden=true;$('#story-audio-retry').hidden=true;$('#story-retry').hidden=true;syncSound();
  try{
   const data=await media.prepare(which);if(token!==generation)return;
   // Keep the first verse in preview until a user gesture starts audio.
   const cues=data.cues.map(cue=>({...cue,title:'Luke',reference:'',version:'',bubble:false,options:{...cue.options,mode:'manual',reveal:'instant'}}));
   player=new StoryDiorama(stage,{...data,cues},{mode:'manual',reveal:'instant',appearance:{fontFamily:'Georgia, serif',number:{visible:false},text:{fontSize:'clamp(20px, 2.1vw, 29px)',lineHeight:'1.45',maxHeight:'240px'},image:{fit:'contain',position:'center top'},mobile:{text:{fontSize:'20px',maxHeight:'260px'}}}});
   player.setMuted(muted);
   player.addEventListener('cue',e=>{bubble.hidden=!e.detail.cue.bubble;bubble.textContent=e.detail.cue.bubble?e.detail.cue.text:'';});
   player.addEventListener('state',e=>{const s=e.detail;next.textContent=s.phase==='idle'?'Start':s.paused?'Continue':s.index===s.total-1?(kind==='opening'?'Start adventure':'Finish story'):'Next verse';});
   player.addEventListener('audioerror',()=>{if(muted)return;status.textContent='Sound could not start.';$('#story-audio-retry').textContent='Retry sound';$('#story-audio-retry').hidden=false;});
   player.addEventListener('complete',finish);
   await player.preload();if(token!==generation)return;
   status.textContent='';next.textContent='Start';overlay.hidden=false;window.storyLoading?.ready();next.focus({preventScroll:true});onPlaying(which);
  }catch(error){if(token!==generation)return;window.storyLoading?.show();window.storyLoading?.fail('Story media could not load. Retry or reload to continue.');const retry=document.querySelector('.loading-retry');if(retry){retry.textContent='Retry story';retry.onclick=()=>open(which);retry.focus({preventScroll:true});}}
 }
 next.onclick=advance;$('#story-skip').onclick=finish;$('#story-sound').onclick=sound;$('#story-retry').onclick=()=>open(kind);$('#story-audio-retry').onclick=()=>{player?.retryAudio();$('#story-audio-retry').hidden=true;status.textContent='';};
 // Register before the dynamically imported game. Story keys never leak into it.
 const keys=new Set(['Enter',' ','Select','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Escape','p','P']);
 addEventListener('keydown',e=>{if(!kind||!player||!keys.has(e.key))return;e.preventDefault();e.stopImmediatePropagation();if(e.repeat||!player)return;if(['Enter',' ','Select'].includes(e.key)){const focused=document.activeElement;if(overlay.contains(focused)&&focused!==next&&focused.tagName==='BUTTON')focused.click();else advance();}else if(e.key==='ArrowUp')sound();else if(['Escape','p','P'].includes(e.key))player.pause();},true);
 overlay.addEventListener('keydown',e=>{if(e.key!=='Tab')return;const buttons=[...overlay.querySelectorAll('button,a')].filter(el=>!el.hidden&&!el.disabled);const first=buttons[0],last=buttons.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}});
 addEventListener('pagehide',()=>{close();media.releaseAll();});
 return {open,close,prepare:media.prepare,release:media.release,get active(){return kind!==null;}};
}
