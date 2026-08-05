/* =====================================================================
   TURON — EKRAN QULFI (idle lock)
   ---------------------------------------------------------------------
   Agar tashrifchi 5 daqiqa davomida ekranga tegmasa, sahifa o'zi
   bosh sahifaga (index.html — til tanlash ekrani) qaytadi.
   Xuddi telefon qulfi kabi: avval ekran qorayadi, keyin bosh menyu.

   Faollik hisoblanadi: teginish, bosish, sichqoncha, klaviatura,
   skrol va g'ildirak. Slayderning avtomatik almashuvi faollik EMAS.

   index.html sahifasida bu modul ishlamaydi — u yerda o'z hisoblagichi
   bor (IDLE_MS), u ham 5 daqiqaga sozlangan.

   Internet talab qilmaydi.  Vaqtni o'zgartirish: TP_IDLE_MS.
   ===================================================================== */
(function () {
  if (window.TPIdleLock) return;

  var TP_IDLE_MS = 5 * 60 * 1000;      /* 5 daqiqa */
  var HOME = 'index.html';
  var FADE = 600;                       /* qorayish vaqti, ms */

  /* index.html o'zining qulfiga ega — bu yerda takrorlamaymiz */
  if (document.getElementById('tp-splash')) return;

  var timer = null, locking = false, veil = null;

  function makeVeil() {
    var v = document.createElement('div');
    v.id = 'tp-lock-veil';
    v.style.cssText =
      'position:fixed;inset:0;z-index:2147483647;background:#050b18;' +
      'opacity:0;pointer-events:none;transition:opacity ' + FADE + 'ms ease';
    document.body.appendChild(v);
    return v;
  }

  function lock() {
    if (locking) return;
    locking = true;
    if (!veil) veil = makeVeil();
    veil.style.pointerEvents = 'auto';
    /* reflow — o'tish effekti ishlashi uchun */
    void veil.offsetWidth;
    veil.style.opacity = '1';
    setTimeout(function () { location.replace(HOME); }, FADE);
  }

  function reset() {
    if (locking) return;
    clearTimeout(timer);
    timer = setTimeout(lock, TP_IDLE_MS);
  }

  var EVENTS = ['pointerdown', 'pointermove', 'touchstart', 'touchmove',
                'mousedown', 'mousemove', 'wheel', 'keydown', 'scroll', 'click'];
  EVENTS.forEach(function (ev) {
    window.addEventListener(ev, reset, { passive: true, capture: true });
  });

  /* sahifaga qaytilganda hisoblagich yangilanadi */
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) reset();
  });

  reset();

  window.TPIdleLock = {
    ms: TP_IDLE_MS,
    reset: reset,
    lockNow: lock,
    cancel: function () { clearTimeout(timer); locking = true; }
  };
})();
