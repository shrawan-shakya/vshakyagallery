// High Quality Gallery Ambient Music Engine
// Uses HTML5 Audio with multi-track randomized ambient soundscape

export const AMBIENT_TRACKS = [
  { id: 'track-1', src: '/audio/track-1.mp3', title: 'Serenade of Silence' },
  { id: 'track-2', src: '/audio/track-2.mp3', title: 'Himalayan Whispers' },
];

class GalleryAmbientMusic {
  constructor() {
    this.audio = null;
    this.isPlaying = false;
    this.targetVolume = 0.5; // Start at 50% Volume as requested
    this.currentTrackIndex = Math.floor(Math.random() * AMBIENT_TRACKS.length);
  }

  init() {
    if (this.audio) return;
    this.audio = new Audio();
    this.audio.preload = 'none'; // Only stream bytes when visitor plays audio to keep server/client light
    this.audio.volume = 0;

    // Pick random track on startup
    const track = AMBIENT_TRACKS[this.currentTrackIndex];
    this.audio.src = track.src;

    // When the track ends, automatically crossfade into another random track
    this.audio.onended = () => {
      this.playNextTrack();
    };
  }

  getCurrentTrack() {
    return AMBIENT_TRACKS[this.currentTrackIndex] || AMBIENT_TRACKS[0];
  }

  playNextTrack() {
    // Pick next track (alternating or random if more than 2)
    const nextIndex = (this.currentTrackIndex + 1) % AMBIENT_TRACKS.length;
    this.currentTrackIndex = nextIndex;
    const nextTrack = AMBIENT_TRACKS[nextIndex];

    if (this.audio) {
      this.audio.src = nextTrack.src;
      this.audio.volume = 0;
      const playPromise = this.audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            this.fadeVolume(this.targetVolume, 1500);
          })
          .catch((err) => {
            console.warn('Playback notice:', err.message);
          });
      }
    }
  }

  start() {
    this.init();
    this.isPlaying = true;

    const playPromise = this.audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          this.fadeVolume(this.targetVolume, 1000);
        })
        .catch((err) => {
          console.warn('Autoplay notice (click anywhere on screen to enable audio):', err.message);
        });
    }
  }

  stop() {
    if (!this.audio) return;
    this.isPlaying = false;
    this.fadeVolume(0, 600, () => {
      this.audio.pause();
    });
  }

  setVolume(val) {
    const clamped = Math.max(0, Math.min(1, val));
    this.targetVolume = clamped;
    if (this.audio && this.isPlaying) {
      this.audio.volume = clamped;
    }
  }

  fadeVolume(targetVol, durationMs, onComplete) {
    if (!this.audio) return;
    const startVol = this.audio.volume;
    const startTime = performance.now();

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      this.audio.volume = startVol + (targetVol - startVol) * progress;

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else if (onComplete) {
        onComplete();
      }
    };
    requestAnimationFrame(animate);
  }

  toggle() {
    if (this.isPlaying) {
      this.stop();
    } else {
      this.start();
    }
    return this.isPlaying;
  }
}

export const ambientSoundscape = new GalleryAmbientMusic();
