// This entry point intentionally has no Three.js or game imports. The opening
// image, scripture and audio get the network before the 3D module graph.
import {createJourneyStory} from './journey-story.mjs';
let gamePromise,gameError=null;
const story=createJourneyStory({onPlaying(kind){window.shepherdStartup?.mark(`${kind}-interactive`);},async onClose(kind){
 if(kind==='ending'){(await prepareGame())?.finishStory();return;}
 if(kind!=='opening')return;
 window.storyLoading.show();
 const game=await prepareGame();
 if(!game){window.storyLoading.show();window.storyLoading.fail('The game could not load. Reload to try again.');console.error(gameError);return;}
 try{await game.startOpeningCamera();window.storyLoading.ready();}
 catch(error){console.error(error);window.storyLoading.show();window.storyLoading.fail('The 3D view could not start. Reload to restart, or try another browser.');}
}});
function prepareGame(){
 if(!gamePromise){window.shepherdStartup?.mark('game-import-start');gamePromise=import('./village-game.mjs').then(module=>{window.shepherdStartup?.mark('game-import-end');return module.createVillageGame(story);}).catch(error=>{gameError=error;return null;});}
 return gamePromise;
}
if(new URLSearchParams(location.search).has('debug')){
 window.storyLoading.show();
 const game=await prepareGame();
 if(game){const {createDebug}=await import('./journey-debug.mjs');game.startDebug(createDebug);window.storyLoading.ready();}
 else window.storyLoading.fail('The scene inspector could not load. Reload to try again.');
}else story.open('opening');
