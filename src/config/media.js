// Paths are relative to public/. Home teasers use real demos; other images are placeholders.
// Enable a local video with an MP4/WebM path in video and an image path in poster.
// Add captions as a WebVTT path when the video has spoken content.
// playOnHover enables a muted, looping mouse preview with native controls as a fallback.
export const media = {
  carouselAdventure: { image: 'assets/media/landing_page/image_marking.png', alt: 'Interactive story screenshot showing a room with objects to find' },
  carouselWorlds: { image: 'assets/media/landing_page/desktop_mobile.png', alt: 'Playable stories on mobile devices' },
  carouselFuture: { image: 'assets/media/landing_page/story_settings.png', alt: 'Customizable story settings' },
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
  gameWorlds: { image: 'public/assets/media/game/custom_look.png', alt: 'Custom background and icon positions', video: '', poster: '', captions: '' },
  gameChoices: { image: 'public/assets/media/game/Drei leuchtende Wege im All.png', alt: 'Illustrated story scene showing a world to explore', video: '', poster: '', captions: '' },
  gameCharacters: { image: 'public/assets/media/game/interactions.png', alt: 'Collage of illustrations from different story worlds', video: '', poster: '', captions: '' },
  editorWrite: { image: 'assets/media/story-book.webp', alt: 'Illustrated story book representing the writing process', video: '', poster: '', captions: '' },
  editorBranch: { image: 'assets/media/future.webp', alt: 'Futuristic world illustrating one possible story setting', video: '', poster: '', captions: '' },
  editorMedia: { image: 'assets/media/collage.webp', alt: 'Collage representing visual inspiration for a story', video: '', poster: '', captions: '' },
};
