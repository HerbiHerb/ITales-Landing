// Paths are relative to public/. Home teasers use real demos; other images are placeholders.
// Enable a local video with an MP4/WebM path in video and an image path in poster.
// Add captions as a WebVTT path when the video has spoken content.
// playOnHover enables a muted, looping mouse preview with native controls as a fallback.
export const media = {
  carouselAdventure: { image: 'assets/media/adventure.webp', alt: 'Illustrated forest and ancient ruins in an adventurous world' },
  carouselWorlds: { image: 'assets/media/story-world.webp', alt: 'Atmospheric story illustration' },
  carouselFuture: { image: 'assets/media/future.webp', alt: 'Illustration of a futuristic world' },
  gameTeaser: {
    image: 'assets/media/videos/game-preview.webp',
    alt: 'ITales Game demo showing an interactive story',
    video: 'assets/media/videos/game-preview.mp4',
    poster: 'assets/media/videos/game-preview.webp',
    caption: 'Game demo · Preview',
    playOnHover: true,
  },
  editorTeaser: {
    image: 'assets/media/videos/editor-preview.webp',
    alt: 'ITales Editor demo showing story creation',
    video: 'assets/media/videos/editor-preview.mp4',
    poster: 'assets/media/videos/editor-preview.webp',
    caption: 'Editor demo · Preview',
    playOnHover: true,
  },
  gameWorlds: { image: 'assets/media/adventure.webp', alt: 'Illustration of an adventurous landscape', video: '', poster: '', captions: '' },
  gameChoices: { image: 'assets/media/story-world.webp', alt: 'Illustrated story scene showing a world to explore', video: '', poster: '', captions: '' },
  gameCharacters: { image: 'assets/media/collage.webp', alt: 'Collage of illustrations from different story worlds', video: '', poster: '', captions: '' },
  editorWrite: { image: 'assets/media/story-book.webp', alt: 'Illustrated story book representing the writing process', video: '', poster: '', captions: '' },
  editorBranch: { image: 'assets/media/future.webp', alt: 'Futuristic world illustrating one possible story setting', video: '', poster: '', captions: '' },
  editorMedia: { image: 'assets/media/collage.webp', alt: 'Collage representing visual inspiration for a story', video: '', poster: '', captions: '' },
};
