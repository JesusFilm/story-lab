// This entry point intentionally has no Three.js or game imports. The opening
// image, scripture and audio get the network before the 3D module graph.
import {createJourneyStory} from './journey-story.mjs';
let gamePromise,gameReady=false,gameError=null;
const story=createJourneyStory({onPlaying(kind){if(kind==='opening')requestAnimationFrame(()=>requestAnimationFrame(prepareGame));},async onClose(kind){
 if(kind!=='opening')return;
 if(!gameReady)window.storyLoading.show();
 const game=await prepareGame();
 if(!game){window.storyLoading.show();window.storyLoading.fail('The game could not load. Reload to try again.');console.error(gameError);return;}
 window.storyLoading.ready();game.startOpeningCamera();
}});
function prepareGame(){
 if(!gamePromise)gamePromise=import('./journey.mjs').then(module=>module.createGame(story)).then(game=>{gameReady=true;return game;}).catch(error=>{gameError=error;return null;});
 return gamePromise;
}
if(new URLSearchParams(location.search).has('debug')){
 window.storyLoading.show();const game=await prepareGame();if(game){try{const {createDebug}=await import('./journey-debug.mjs');game.startDebug(createDebug);window.storyLoading.ready();}catch(error){console.error(error);window.storyLoading.fail('The scene inspector could not load. Reload to try again.');}}else window.storyLoading.fail('The game could not load. Reload to try again.');
}else if(new URLSearchParams(location.search).has('camera-review')){
 window.storyLoading.show();const game=await prepareGame();if(game){window.storyLoading.ready();game.startOpeningCamera();}else window.storyLoading.fail('The game could not load. Reload to try again.');
}else story.open('opening');
