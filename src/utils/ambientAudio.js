// High Quality Gallery Ambient Music Engine
// Uses HTML5 Audio with local ambient soundscape track + Web Audio API fallback

class GalleryAmbientMusic {
  constructor() {
    this.audio = null;
    this.isPlaying = false;
    this.targetVolume = 0.55;
  }

  init() {
    if (this.audio) return;
    this.audio = new Audio();
    this.audio.loop = true;
    this.audio.volume = 0;
    this.audio.src = '/audio/gallery-ambient.wav';
  }

  start() {
    this.init();
    this.isPlaying = true;

    const playPromise = this.audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          this.fadeVolume(this.targetVolume, 1500);
        })
        .catch((err) => {
          console.warn('Autoplay notice (click anywhere on screen to enable audio):', err.message);
        });
    }
  }

  stop() {
    if (!this.audio) return;
    this.isPlaying = false;
    this.fadeVolume(0, 1000, () => {
      this.audio.pause();
    });
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
