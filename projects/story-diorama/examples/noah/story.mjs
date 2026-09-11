const asset = (name) => new URL("./assets/" + name, import.meta.url).href;
const music = (name, options = {}) => ({
  src: asset(name + ".mp3"),
  name,
  loop: true,
  fade: 2200,
  volume: 0.55,
  ...options,
});
const scene = (image, number, title, alt) => ({
  image: asset(image + ".png"),
  number,
  title,
  version: "BEREAN STANDARD BIBLE",
  alt,
});
const building = scene(
  "building",
  "01",
  "The calling",
  "Noah beneath the towering wooden ribs of an unfinished ark, with distant skeptical onlookers.",
);
const animals = scene(
  "animals",
  "02",
  "A living cargo",
  "Animals approach the ramp of the completed ark beneath a luminous sky.",
);
const flood = scene(
  "flood",
  "03",
  "The deep",
  "The sealed ark floats on vast dark floodwaters under heavy rain.",
);
const promise = scene(
  "promise",
  "04",
  "Remembered",
  "A dove with an olive leaf crosses a renewing landscape, with the ark and a rainbow in the distance.",
);
export const story = {
  title: "Noah · Through the waters",
  cues: [
    {
      ...building,
      text: "“Make for yourself an ark of gopher wood; make rooms in the ark and coat it with pitch inside and out.”",
      reference: "GENESIS 6:14",
      music: music("reverie"),
    },
    {
      ...building,
      text: "So Noah did everything precisely as God had commanded him.",
      reference: "GENESIS 6:22",
    },
    {
      ...animals,
      text: "They came to Noah to enter the ark, two by two of every creature with the breath of life.",
      reference: "GENESIS 7:15",
      music: music("childhood"),
    },
    {
      ...animals,
      text: "Then the LORD shut him in.",
      reference: "GENESIS 7:16b",
      music: null,
      options: { hold: 2800 },
    },
    {
      ...flood,
      text: "And the rain fell upon the earth for forty days and forty nights.",
      reference: "GENESIS 7:12",
      music: music("hiraeth", { delay: 900 }),
    },
    {
      ...flood,
      text: "And every living thing that moved upon the earth perished—birds, livestock, animals, every creature that swarms upon the earth, and all mankind.",
      reference: "GENESIS 7:21",
      options: { hold: 5000 },
    },
    {
      ...promise,
      text: "But God remembered Noah and all the animals and livestock that were with him in the ark. And God sent a wind over the earth, and the waters began to subside.",
      reference: "GENESIS 8:1",
      music: music("reverie", { loop: false }),
    },
    {
      ...promise,
      text: "“I have set My rainbow in the clouds, and it will be a sign of the covenant between Me and the earth.”",
      reference: "GENESIS 9:13",
      options: { hold: 5500 },
    },
  ],
};
