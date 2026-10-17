(() => {
  'use strict';

  // The only photographic transition is the large hero image. No scrolling gallery.
  const music = document.querySelector('#music');
  const stage = document.querySelector('#stage');
  const playButton = document.querySelector('#play-button');
  const muteButton = document.querySelector('#mute-button');
  const seek = document.querySelector('#seek');
  const elapsed = document.querySelector('#elapsed');
  const durationLabel = document.querySelector('#duration');
  const hint = document.querySelector('#hint');
  const photoCaption = document.querySelector('#photo-caption');
  const photoCount = document.querySelector('#photo-count');
  const card = document.querySelector('.music-card');
  const COVER_FALLBACK = 'photos/cover.jpg';
  const INTRO_END_SECONDS = 20; // Introducer and crowd get their own moment.
  const NORMAL_HOLD_SECONDS = 13;
  const PAIR_FIRST_HOLD_SECONDS = 9.5;
  const PAIR_SECOND_HOLD_SECONDS = 12;
  const FINALE_START_SECONDS = 3 * 60 + 30; // Return to the couple at exactly 3:30.

  let cover = COVER_FALLBACK;
  let moments = [];
  let queue = [];
  let pendingPairPhoto = null;
  let nextChangeAt = Infinity;
  let priorPhoto = cover;
  let revealToken = 0;
  let finaleLocked = false;

  const formatTime = (seconds) => {
    if (!Number.isFinite(seconds)) return '--:--';
    return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
  };

  function updateProgress() {
    const total = music.duration;
    const progress = Number.isFinite(total) && total > 0 ? music.currentTime / total : 0;
    seek.value = Math.round(progress * 1000);
    seek.style.setProperty('--progress', `${Math.max(0,Math.min(100,progress * 100))}%`);
    seek.setAttribute('aria-valuetext', `${Math.floor(music.currentTime / 60)} minutes ${Math.floor(music.currentTime % 60)} seconds`);
    elapsed.textContent = formatTime(music.currentTime);
    durationLabel.textContent = formatTime(total);
  }

  function shuffleMoments() {
    const shuffled = moments.slice();
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    if (shuffled.length > 1 && shuffled[0].images[0] === priorPhoto) {
      [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
    }
    queue = shuffled;
  }

  function getNextPhoto() {
    // The linked group shot is ONE story moment, never two random choices.
    if (pendingPairPhoto) {
      const next = pendingPairPhoto;
      pendingPairPhoto = null;
      return {src:next, hold:PAIR_SECOND_HOLD_SECONDS, caption:'Together, always'};
    }
    if (!queue.length) shuffleMoments();
    const moment = queue.shift();
    if (!moment) return null;
    if (moment.type === 'pair' && moment.images.length === 2) {
      pendingPairPhoto = moment.images[1];
      return {src:moment.images[0], hold:PAIR_FIRST_HOLD_SECONDS, caption:'Everyone together'};
    }
    return {src:moment.images[0], hold:NORMAL_HOLD_SECONDS, caption:'A day worth reliving'};
  }

  function createScene(src) {
    const wrapper = document.createElement('div');
    wrapper.className = 'scene scene--entering';
    wrapper.setAttribute('aria-hidden', 'true');
    wrapper.dataset.photo = src;
    const bg = document.createElement('img');
    bg.className = 'scene-backdrop'; bg.alt = ''; bg.src = src;
    const foreground = document.createElement('img');
    foreground.className = 'scene-foreground'; foreground.alt = ''; foreground.src = src;
    wrapper.append(bg, foreground);
    return wrapper;
  }

  // All transitions are visual only; the original photograph files are never modified.
  async function showPhoto(src, caption, isReturn = false) {
    const token = ++revealToken;
    const image = new Image();
    image.src = src;
    try {
      if (image.decode) await image.decode();
      else if (!image.complete) await new Promise((resolve,reject) => { image.onload=resolve; image.onerror=reject; });
    } catch {
      if (token === revealToken) hint.textContent = 'One photograph could not load; the music will keep playing.';
      return;
    }
    if (token !== revealToken) return;
    if ([...stage.querySelectorAll('.scene')].at(-1)?.dataset.photo === src) {
      photoCaption.textContent = caption;
      return;
    }
    const scene = createScene(src);
    scene.style.setProperty('--reveal', isReturn ? '6900ms' : '6000ms');
    const oldScenes = [...stage.querySelectorAll('.scene')];
    // Crossfade layers remain aligned: the images never move or resize.
    const overlay = stage.querySelector('.stage-tint');
    stage.insertBefore(scene,overlay);
    // All previous slides are placed below the new slide. Clean up after the animation.
    for (const old of oldScenes) { old.style.zIndex='0'; }
    scene.style.zIndex = '2';
    const duration = isReturn ? 6900 : 6000;
    scene.addEventListener('animationend', (ev) => {
      if (ev.target !== scene) return;
      oldScenes.forEach(el => el.remove());
      scene.classList.remove('scene--entering');
      scene.classList.add('scene--initial');
    }, {once:true});
    // Safety cleanup in case the browser suppresses animationend.
    setTimeout(() => {
      if (scene.isConnected && !scene.classList.contains('scene--entering')) return;
      if (scene.isConnected) {
        for (const old of oldScenes) old.remove();
        scene.classList.remove('scene--entering');
        scene.classList.add('scene--initial');
      }
    },duration+350);
    photoCaption.textContent = caption;
    photoCount.textContent = isReturn ? '29.08.2026' : '✧ 29.08.2026';
    priorPhoto = src;
  }

  function returnToCover() {
    pendingPairPhoto = null;
    nextChangeAt = Infinity;
    queue = [];
    finaleLocked = false;
    void showPhoto(cover,'A moment to remember',true);
  }

  function maybeEnterFinale() {
    if (finaleLocked) return true; // Hold the couple portrait for the rest of the song.
    if (music.currentTime < FINALE_START_SECONDS) return false;
    finaleLocked = true;
    pendingPairPhoto = null;
    queue = [];
    nextChangeAt = Infinity;
    void showPhoto(cover,'Right where it all began',true);
    return true;
  }

  function maybeShowNext() {
    if (music.paused || music.ended || !moments.length) return;
    if (maybeEnterFinale()) return;
    if (music.currentTime + 0.16 < nextChangeAt) return;
    const item = getNextPhoto();
    if (!item) return;
    void showPhoto(item.src,item.caption);
    // If the audio is still early, the image stays on the couple through the introduction.
    nextChangeAt = music.currentTime + item.hold;
  }

  music.addEventListener('loadedmetadata', updateProgress);
  music.addEventListener('durationchange', updateProgress);
  music.addEventListener('timeupdate', () => { updateProgress(); maybeShowNext(); });
  music.addEventListener('play', () => {
    card.classList.add('playing');
    playButton.setAttribute('aria-label','Pause From The Jump');
    hint.textContent = 'Every photograph, a memory';
    if (!Number.isFinite(nextChangeAt)) {
      nextChangeAt = music.currentTime < INTRO_END_SECONDS ? INTRO_END_SECONDS : music.currentTime + 1.6;
    }
    // Test the absolute 3:30 cue even if playback begins after seeking near the end.
    maybeShowNext();
  });
  music.addEventListener('pause', () => {
    card.classList.remove('playing');
    playButton.setAttribute('aria-label','Play From The Jump');
    hint.textContent = 'Press play to carry on remembering';
    returnToCover();
  });
  music.addEventListener('ended', () => {
    card.classList.remove('playing');
    playButton.setAttribute('aria-label','Replay From The Jump');
    hint.textContent = 'One beautiful day, forever yours ♡';
    pendingPairPhoto = null;
    nextChangeAt = Infinity;
    queue = [];
    finaleLocked = false;
    void showPhoto(cover,'Right where it all began',true);
  });
  music.addEventListener('error', () => {
    hint.textContent = 'Song unavailable. Please check the audio file.';
  });
  music.addEventListener('seeking', () => {
    finaleLocked = false;
    if (!music.paused) {
      pendingPairPhoto = null;
      nextChangeAt = music.currentTime < INTRO_END_SECONDS ? INTRO_END_SECONDS : music.currentTime + 1.2;
    }
  });

  playButton.addEventListener('click', async () => {
    if (music.paused) {
      try { await music.play(); }
      catch { hint.textContent = 'Unable to play audio. Please tap again or check your connection.'; }
    } else music.pause();
  });
  muteButton.addEventListener('click', () => {
    music.muted = !music.muted;
    muteButton.classList.toggle('muted',music.muted);
    muteButton.setAttribute('aria-label',music.muted ? 'Unmute audio' : 'Mute audio');
    muteButton.setAttribute('aria-pressed',String(music.muted));
  });
  seek.addEventListener('input', () => {
    if (!Number.isFinite(music.duration)) return;
    music.currentTime = (Number(seek.value) / 1000) * music.duration;
    updateProgress();
  });

  // Works both on GitHub Pages (https://) and by double-clicking index.html (file://).
  // GitHub Actions refreshes gallery.js from the photos folder on each deployment.
  // Standard script tags are permitted with file:// where fetch('gallery.json') is not.
  const gallery = window.WEDDING_GALLERY;
  if (gallery && Array.isArray(gallery.moments)) {
    cover = gallery.cover || COVER_FALLBACK;
    moments = gallery.moments.filter(m => Array.isArray(m.images) && m.images.length > 0);
  } else {
    hint.textContent = 'Slideshow unavailable. Check that gallery.js is next to index.html.';
  }
  updateProgress();
})();
