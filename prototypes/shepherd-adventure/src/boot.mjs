// This entry point intentionally has no Three.js or game imports. The opening
// image, scripture and audio get the network before the 3D module graph.
import {createJourneyStory} from './journey-story.mjs';
let gamePromise,gameReady=false,gameError=null;
const story=createJourneyStory({onPlaying(kind){if(kind==='opening')requestAnimationFrame(()=>requestAnimationFrame(prepareGame));},async onClose(kind){
 if(kind==='ending'){(await prepareGame())?.finishStory();return;}
 if(kind!=='opening')return;
 if(!gameReady)window.storyLoading.show();
 const game=await prepareGame();
 if(!game){window.storyLoading.show();window.storyLoading.fail('The game could not load. Reload to try again.');console.error(gameError);return;}
 window.storyLoading.ready();game.startOpeningCamera();
}});
function prepareGame(){
 if(!gamePromise)gamePromise=Promise.resolve(null); // Deliberate regression-test failure: gameplay never initializes.
 return gamePromise;
}
if(new URLSearchParams(location.search).has('debug')){
 window.storyLoading.show();
 const game=await prepareGame();
 if(game){const {createDebug}=await import('./journey-debug.mjs');game.startDebug(createDebug);window.storyLoading.ready();}
 else window.storyLoading.fail('The scene inspector could not load. Reload to try again.');
}else story.open('opening');
