// Only the selected story's scripture/media manifest is downloaded. Its parsed
// text lives with the media lease and can be collected after the player closes.
export const storyURLs={
 opening:new URL('../assets/story/opening.json',import.meta.url).href,
 ending:new URL('../assets/story/ending.json',import.meta.url).href
};
