const languageNames={
  af:'American English · Female',am:'American English · Male',
  bf:'British English · Female',bm:'British English · Male',
  ef:'Spanish · Female',em:'Spanish · Male',ff:'French · Female',
  hf:'Hindi · Female',hm:'Hindi · Male',if:'Italian · Female',im:'Italian · Male',
  jf:'Japanese · Female',jm:'Japanese · Male',pf:'Brazilian Portuguese · Female',
  pm:'Brazilian Portuguese · Male',zf:'Mandarin Chinese · Female',zm:'Mandarin Chinese · Male'
};
const friendlyName=value=>value.slice(3).replaceAll('_',' ').replace(/^./,letter=>letter.toUpperCase());
const $=selector=>document.querySelector(selector);
const language=$('#language'),voice=$('#voice'),script=$('#script'),speed=$('#speed');
const generate=$('#generate'),message=$('#message'),audio=$('#audio'),play=$('#play');
const download=$('#download'),orb=$('.orb'),stateDot=$('.state-dot'),engineLabel=$('#engine-label');
let voices=[],audioUrl=null;

function setReady(ready){
  for(const control of [language,voice,script,speed,generate]) control.disabled=!ready;
}
function populateLanguages(){
  const groups=[...new Set(voices.map(name=>name.slice(0,2)))].filter(key=>languageNames[key]);
  language.replaceChildren(...groups.map(key=>new Option(languageNames[key],key)));
  language.value=groups.includes('af')?'af':groups[0];
  populateVoices();
}
function populateVoices(){
  const matches=voices.filter(name=>name.startsWith(`${language.value}_`));
  voice.replaceChildren(...matches.map(name=>new Option(friendlyName(name),name)));
  if(matches.includes('af_heart')) voice.value='af_heart';
}
function formatTime(seconds){
  if(!Number.isFinite(seconds)) return '0:00';
  return `${Math.floor(seconds/60)}:${String(Math.floor(seconds%60)).padStart(2,'0')}`;
}
async function waitForEngine(){
  try{
    const response=await fetch('./api/status');
    const status=await response.json();
    engineLabel.textContent=status.message;
    window.storyLoading?.status(status.message);
    if(status.state==='ready'){
      const voiceResponse=await fetch('./api/voices');
      voices=(await voiceResponse.json()).voices;
      populateLanguages();setReady(true);stateDot.classList.add('ready');
      message.textContent='Ready to generate locally.';
      window.storyLoading?.ready();
      return;
    }
    if(status.state==='error') throw new Error(status.message);
    setTimeout(waitForEngine,1000);
  }catch(error){
    engineLabel.textContent=error.message;stateDot.classList.add('error');
    window.storyLoading?.fail('The local voice engine could not start. Check the terminal and retry.');
  }
}

language.addEventListener('change',populateVoices);
script.addEventListener('input',()=>{$('#character-count').textContent=`${script.value.length.toLocaleString()} / 5,000`;});
speed.addEventListener('input',()=>{$('#speed-value').textContent=`${Number(speed.value).toFixed(2)}×`;});
generate.addEventListener('click',async()=>{
  const text=script.value.trim();
  if(!text){message.textContent='Enter some text to speak.';message.classList.add('error');script.focus();return;}
  generate.disabled=true;generate.innerHTML='<span aria-hidden="true">◌</span> Generating…';
  message.classList.remove('error');message.textContent='Synthesizing speech on this Mac…';
  try{
    const response=await fetch('./api/synthesize',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text,voice:voice.value,speed:Number(speed.value)})});
    if(!response.ok){const detail=await response.json();throw new Error(detail.error||'Synthesis failed.');}
    const blob=await response.blob();
    if(audioUrl) URL.revokeObjectURL(audioUrl);
    audioUrl=URL.createObjectURL(blob);audio.src=audioUrl;download.href=audioUrl;
    download.download=`${voice.value}-${Number(speed.value).toFixed(2)}x.wav`;download.hidden=false;
    play.disabled=false;$('#result-description').textContent=`${friendlyName(voice.value)} · ${languageNames[voice.value.slice(0,2)]} · ${Number(speed.value).toFixed(2)}×`;
    message.textContent='Voice generated. Press play to listen.';
    await audio.play();
  }catch(error){message.textContent=error.message;message.classList.add('error');}
  finally{generate.disabled=false;generate.innerHTML='<span aria-hidden="true">✦</span> Generate voice';}
});
play.addEventListener('click',()=>{if(audio.paused) audio.play();else audio.pause();});
audio.addEventListener('play',()=>{play.innerHTML='<span aria-hidden="true">Ⅱ</span>';play.setAttribute('aria-label','Pause generated speech');orb.classList.add('speaking');});
audio.addEventListener('pause',()=>{play.innerHTML='<span aria-hidden="true">▶</span>';play.setAttribute('aria-label','Play generated speech');orb.classList.remove('speaking');});
audio.addEventListener('ended',()=>{orb.classList.remove('speaking');play.innerHTML='<span aria-hidden="true">▶</span>';});
audio.addEventListener('loadedmetadata',()=>{$('#duration').textContent=formatTime(audio.duration);});
audio.addEventListener('timeupdate',()=>{$('#current-time').textContent=formatTime(audio.currentTime);$('#progress').style.width=`${audio.duration?audio.currentTime/audio.duration*100:0}%`;});
$('.timeline').addEventListener('click',event=>{if(audio.duration){const rect=event.currentTarget.getBoundingClientRect();audio.currentTime=(event.clientX-rect.left)/rect.width*audio.duration;}});
window.addEventListener('beforeunload',()=>{if(audioUrl) URL.revokeObjectURL(audioUrl);});

$('#character-count').textContent=`${script.value.length.toLocaleString()} / 5,000`;
waitForEngine();
