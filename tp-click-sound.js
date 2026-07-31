/* =====================================================================
   TURON — bosish (click) va surish (swipe) tovushlari
   ---------------------------------------------------------------------
   Ovoz Web Audio API orqali brauzerning o'zida generatsiya qilinadi:
   hech qanday mp3/wav fayl va internet KERAK EMAS.

   Bu fayl har bir sahifa ichiga script tegi sifatida joylashtirilgan
   (offline ishlashi kafolatlangan). Yangi sahifa qo'shilsa, shu
   fayldagi kodni sahifa oxiriga nusxalash yoki
   tp-click-sound.js faylini script src orqali ulash yetarli.

   O'chirish/yoqish:  localStorage.setItem('turonSound','off' | 'on')
   ===================================================================== */
(function () {
  if (window.TPSound) return;               /* ikki marta ulanib qolmasin */

  var AC = null, bus = null, noiseBuf = null;
  var VOL = 0.55;

  function enabled() {
    try { return localStorage.getItem('turonSound') !== 'off'; } catch (e) { return true; }
  }

  /* AudioContext faqat birinchi teginishda ochiladi (brauzer talabi) */
  function ctx() {
    if (!AC) {
      var C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      try { AC = new C(); } catch (e) { return null; }
      bus = AC.createGain();
      bus.gain.value = VOL;
      bus.connect(AC.destination);
    }
    if (AC.state === 'suspended') { try { AC.resume(); } catch (e) {} }
    return AC;
  }

  function noise() {
    if (noiseBuf) return noiseBuf;
    var len = Math.floor(AC.sampleRate * 0.6);
    noiseBuf = AC.createBuffer(1, len, AC.sampleRate);
    var ch = noiseBuf.getChannelData(0);
    for (var i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;
    return noiseBuf;
  }

  /* --- qisqa, yumshoq "tik" — tugma va havolalar uchun --- */
  function click() {
    if (!enabled() || !ctx()) return;
    var t = AC.currentTime;

    /* ikki ohangli metall tik */
    [[1180, 0.085], [1770, 0.055]].forEach(function (p) {
      var o = AC.createOscillator(), g = AC.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(p[0], t);
      o.frequency.exponentialRampToValueAtTime(p[0] * 0.72, t + 0.07);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(p[1], t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);
      o.connect(g); g.connect(bus);
      o.start(t); o.stop(t + 0.13);
    });

    /* pastki yumshoq zarba — "qadimiy" tus beradi */
    var o2 = AC.createOscillator(), g2 = AC.createGain();
    o2.type = 'sine';
    o2.frequency.setValueAtTime(220, t);
    o2.frequency.exponentialRampToValueAtTime(110, t + 0.12);
    g2.gain.setValueAtTime(0.07, t);
    g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    o2.connect(g2); g2.connect(bus);
    o2.start(t); o2.stop(t + 0.2);
  }

  /* slayder bor sahifalardagina surish tovushi chalinadi */
  var _slider = null;
  function hasSlider() {
    if (_slider === null) _slider = !!document.querySelector('#stage .slide, .slide, .tp-dot');
    return _slider;
  }

  /* --- surish (swipe / slayd almashuvi) — yengil "shuvillash" --- */
  function swipe(dir) {
    if (!enabled() || !hasSlider() || !ctx()) return;
    var t = AC.currentTime;

    var n = AC.createBufferSource(); n.buffer = noise();
    var bp = AC.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.1;
    var f0 = dir < 0 ? 1500 : 520, f1 = dir < 0 ? 520 : 1500;
    bp.frequency.setValueAtTime(f0, t);
    bp.frequency.exponentialRampToValueAtTime(f1, t + 0.34);

    var g = AC.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.16, t + 0.07);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.36);

    n.connect(bp); bp.connect(g); g.connect(bus);
    n.start(t); n.stop(t + 0.4);
  }

  /* ================= hodisalarni ulash ================= */
  var HOT = 'a,button,[role="button"],input,select,label,' +
            '.tp-card,.tp-lang,.tp-pill,.tp-icobtn,.tp-menu-btn,.tp-chip,' +
            '.tp-dot,.tp-nav-btn,.dot,.btn,.ch,.start,.close,[data-href],[onclick]';

  function isHot(el) {
    return !!(el && el.closest && el.closest(HOT));
  }

  var lastTap = 0;
  function onDown(e) {
    var now = e.timeStamp || 0;
    if (now && now - lastTap < 60) return;    /* takroriy hodisani o'tkazib yuborish */
    lastTap = now;
    if (isHot(e.target)) click();
  }

  if (window.PointerEvent) {
    document.addEventListener('pointerdown', onDown, true);
  } else {
    document.addEventListener('touchstart', onDown, true);
    document.addEventListener('mousedown', onDown, true);
  }

  /* --- barmoq bilan surish --- */
  var sx = 0, sy = 0, st = 0;
  document.addEventListener('touchstart', function (e) {
    if (e.touches.length !== 1) return;
    sx = e.touches[0].clientX; sy = e.touches[0].clientY; st = Date.now();
  }, { passive: true, capture: true });

  document.addEventListener('touchend', function (e) {
    if (!st || !e.changedTouches.length) return;
    var dx = e.changedTouches[0].clientX - sx,
        dy = e.changedTouches[0].clientY - sy;
    st = 0;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.3) swipe(dx < 0 ? -1 : 1);
  }, { passive: true, capture: true });

  /* --- sichqoncha bilan surish (kiosk bo'lmagan ekranlar uchun) --- */
  var mx = 0, md = false;
  document.addEventListener('mousedown', function (e) { mx = e.clientX; md = true; }, true);
  document.addEventListener('mouseup', function (e) {
    if (!md) return; md = false;
    var dx = e.clientX - mx;
    if (Math.abs(dx) > 90) swipe(dx < 0 ? -1 : 1);
  }, true);

  /* --- klaviatura strelkalari ham slaydni almashtiradi --- */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight' || e.key === ' ') swipe(-1);
    else if (e.key === 'ArrowLeft') swipe(1);
  }, true);

  window.TPSound = { click: click, swipe: swipe,
    on: function () { try { localStorage.setItem('turonSound', 'on'); } catch (e) {} },
    off: function () { try { localStorage.setItem('turonSound', 'off'); } catch (e) {} } };
})();
