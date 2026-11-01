// Sound + notification helpers (same behaviour as the original tracker).
let soundOn = true;
let lastSfxAt = 0;
let appOpenPlayed = false;

const make = (src, volume) => {
  try { const a = new Audio(src); a.preload = 'auto'; a.volume = volume; return a; } catch (e) { return null; }
};
let alertAudio = null;
let questAudio = null;
let openAudio = null;
let openPending = true;
function ensure() {
  if (!alertAudio) alertAudio = make('./alert.mp3', 0.78);
  if (!questAudio) questAudio = make('./quest.mp3', 0.82);
  if (!openAudio) openAudio = make('./open.mp3', 1);
}

export const setSoundOn = (v) => { soundOn = !!v; };

function play(audio, isAlert) {
  if (!audio) return;
  try {
    audio.pause(); audio.currentTime = 0;
    const p = audio.play();
    if (p && p.then) p.then(() => { if (isAlert) appOpenPlayed = true; }).catch(() => {});
  } catch (e) { /* autoplay blocked */ }
}

// The opening notification sound. Browsers block sound before the first tap, so if the
// automatic attempt is refused it is retried on the player's first tap / key press.
function playOpen() {
  if (!openAudio) return;
  try {
    openAudio.pause(); openAudio.currentTime = 0;
    const p = openAudio.play();
    if (p && p.then) p.then(() => { openPending = false; }).catch(() => {});
  } catch (e) { /* blocked */ }
}

export function sfx(kind = 'tap') {
  ensure();
  if (!soundOn || ['tap', 'touch', 'check'].includes(kind)) return;
  const now = performance.now();
  if (now - lastSfxAt < 140) return;
  lastSfxAt = now;
  if (kind === 'quest' || kind === 'checkbox') return play(questAudio, false);
  if (kind === 'open') return playOpen();
  play(alertAudio, true);
}

// Every enabled button gives the short "quest" blip after its own action.
export function buttonBlip() {
  ensure();
  if (!soundOn) return;
  try { questAudio.pause(); questAudio.currentTime = 0; const p = questAudio.play(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* ignore */ }
}

export function tryAppOpenSound() {
  ensure();
  if (!openPending || !soundOn) return;
  playOpen();
}

export function notifyPenalty(title, body) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const opts = { body, tag: 'arise-penalty', renotify: true, requireInteraction: true, icon: './icon-192.png', badge: './icon-192.png' };
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((r) => r.showNotification(title, opts)).catch(() => { try { new Notification(title, opts); } catch (e) { /* ignore */ } });
  } else {
    try { new Notification(title, opts); } catch (e) { /* ignore */ }
  }
}
