const BASE_MOOD_IMAGES = {
  neutral: require('../../assets/cats/cat.png'),
  sad: require('../../assets/cats/sadcat.png'),
  sleepy: require('../../assets/cats/sleepingcat.png'),
  happy: require('../../assets/cats/happycat.png'),
  excited: require('../../assets/cats/celebratingcat.png'),
};

const EQUIPPED_MOOD_IMAGES = {
  bowtie: {
    neutral: require('../../assets/cats/bowtie/cat-bowtie.png'),
    sad: require('../../assets/cats/bowtie/sadcat.png'),
    sleepy: require('../../assets/cats/bowtie/cat-bowtie.png'),
    happy: require('../../assets/cats/bowtie/happycat.png'),
    excited: require('../../assets/cats/bowtie/happycat.png'),
  },
  medal: {
    neutral: require('../../assets/cats/medal/cat-medal.png'),
    sad: require('../../assets/cats/medal/sadcat.png'),
    sleepy: require('../../assets/cats/medal/cat-medal.png'),
    happy: require('../../assets/cats/medal/happycat.png'),
    excited: require('../../assets/cats/medal/happycat.png'),
  },
  party_hat: {
    neutral: require('../../assets/cats/hat/cat-partyhat.png'),
    sad: require('../../assets/cats/hat/sadcat.png'),
    sleepy: require('../../assets/cats/hat/cat-partyhat.png'),
    happy: require('../../assets/cats/hat/happycat.png'),
    excited: require('../../assets/cats/hat/happycat.png'),
  },
  gold_necklace: {
    neutral: require('../../assets/cats/gold/cat-gold.png'),
    sad: require('../../assets/cats/gold/sadcat.png'),
    sleepy: require('../../assets/cats/gold/cat-gold.png'),
    happy: require('../../assets/cats/gold/happycat.png'),
    excited: require('../../assets/cats/gold/happycat.png'),
  },
};

export function getCatImage(mood = 'neutral', equippedItemId = null) {
  const baseImage = BASE_MOOD_IMAGES[mood] ?? BASE_MOOD_IMAGES.neutral;
  if (!equippedItemId) return baseImage;

  const equippedImages = EQUIPPED_MOOD_IMAGES[equippedItemId];
  return equippedImages?.[mood] ?? equippedImages?.neutral ?? baseImage;
}

