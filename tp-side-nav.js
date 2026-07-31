/* =====================================================================
   TURON — slayder uchun DUMALOQ "orqaga / keyingi" tugmalari
   (ekranning pastki o'ng burchagida)
   ---------------------------------------------------------------------
   Har bir sahifadagi slayder tuzilishi har xil, shuning uchun modul
   navigatsiya "ilgagi"ni o'zi topadi:
     1) window.prev() / window.next()          — I bo'lim
     2) #prev / #next tugmalari                — II bo'lim
     3) *-prev-btn / *-next-btn                — rw / te uslubidagi sahifalar
     4) #deck + #dots (IIFE ichidagi slayder)  — ArrowLeft/ArrowRight
   Slayder topilmasa (oddiy skroll sahifa) — hech narsa qo'shilmaydi.

   Internet talab qilmaydi: butun kod sahifa ichida.
   ===================================================================== */
(function () {
  if (window.TPSideNav) return;
  if (document.querySelector('.tp-side-btn')) return;

  function ready(fn) {
    if (document.readyState === 'loading')
      document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  ready(function () {
    var $ = function (s) { return document.querySelector(s); };

    /* --------- navigatsiya ilgagini aniqlash --------- */
    var hook = null;

    if (typeof window.next === 'function' && typeof window.prev === 'function') {
      hook = { prev: function () { window.prev(); }, next: function () { window.next(); } };
    } else if ($('#prev') && $('#next')) {
      hook = { prev: function () { $('#prev').click(); }, next: function () { $('#next').click(); } };
    } else if ($('[id$="-prev-btn"]') && $('[id$="-next-btn"]')) {
      hook = { prev: function () { $('[id$="-prev-btn"]').click(); },
               next: function () { $('[id$="-next-btn"]').click(); } };
    } else if ($('#deck') && $('#dots')) {
      hook = { prev: function () { key('ArrowLeft'); }, next: function () { key('ArrowRight'); } };
    }
    if (!hook) return;                       /* slayder yo'q — chiqamiz */

    function key(k) {
      var e;
      try { e = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }); }
      catch (err) { e = document.createEvent('Event'); e.initEvent('keydown', true, true); e.key = k; }
      window.dispatchEvent(e);
    }

    /* --------- uslub --------- */
    var css = document.createElement('style');
    css.textContent =
      /* pastki o'ng burchakdagi juftlik — BOSH MENYU tugmasi bilan bir qatorda */
      '.tp-side-nav{position:fixed;right:min(4vw,44px);bottom:2.3vh;z-index:9998;' +
        'display:flex;align-items:center;gap:clamp(10px,1vw,16px);' +
        'height:calc(clamp(16px,calc(.6vw + .6vh),34px) * 2.7)}' +
      '.tp-side-btn{' +
        'height:100%;aspect-ratio:1/1;flex:0 0 auto;' +
        'display:grid;place-items:center;cursor:pointer;padding:0;' +
        'border:1px solid rgba(212,175,110,.55);border-radius:50%;' +
        'background:linear-gradient(135deg,rgba(16,31,56,.92),rgba(11,22,40,.88));' +
        'backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);' +
        'box-shadow:0 10px 30px rgba(0,0,0,.6),0 0 20px rgba(216,178,108,.18);' +
        'transition:all .25s}' +
      '.tp-side-btn svg{width:44%;height:44%;fill:none;stroke:#d8b26c;stroke-width:2.2;' +
        'stroke-linecap:round;stroke-linejoin:round;transition:stroke .25s}' +
      '.tp-side-btn:hover,.tp-side-btn:active{' +
        'background:linear-gradient(180deg,#f3e2b8,#b98f45);border-color:transparent;' +
        'box-shadow:0 6px 22px rgba(216,178,108,.5);transform:scale(1.07)}' +
      '.tp-side-btn:hover svg,.tp-side-btn:active svg{stroke:#070d18}' +
      /* yorug' mavzudagi sahifalar uchun */
      'body.light .tp-side-btn{background:linear-gradient(135deg,rgba(253,248,238,.94),rgba(240,231,213,.9));' +
        'border-color:rgba(150,111,44,.5);box-shadow:0 10px 30px rgba(90,70,35,.2)}' +
      'body.light .tp-side-btn svg{stroke:#8a6520}' +
      'body.light .tp-side-btn:hover{background:linear-gradient(180deg,#c79a44,#a97c2c)}' +
      'body.light .tp-side-btn:hover svg{stroke:#fff8ea}' +
      /* II bo'limdagi eski xira strelkalar yashiriladi (bosish zonasi qoladi) */
      '.nav.prev svg,.nav.next svg{display:none}' +
      /* manbalar/kredit oynalari ochilganda yashirish */
      'body:has(#src.on) .tp-side-nav,body:has(#credits.on) .tp-side-nav,' +
      'body:has(#src.show) .tp-side-nav{opacity:0;visibility:hidden;pointer-events:none}' +
      '@media(max-width:720px){.tp-side-nav{right:14px;gap:9px;height:46px}}';
    document.head.appendChild(css);

    /* --------- tugmalar --------- */
    var wrap = document.createElement('div');
    wrap.className = 'tp-side-nav';

    function mk(side, path, label, act) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'tp-side-btn ' + side;
      b.setAttribute('aria-label', label);
      b.innerHTML = '<svg viewBox="0 0 24 24"><path d="' + path + '"/></svg>';
      b.addEventListener('click', function (e) { e.stopPropagation(); act(); });
      wrap.appendChild(b);
      return b;
    }
    mk('l', 'M15 5l-7 7 7 7', 'Oldingi', hook.prev);
    mk('r', 'M9 5l7 7-7 7',  'Keyingi', hook.next);
    document.body.appendChild(wrap);

    window.TPSideNav = hook;
  });
})();
