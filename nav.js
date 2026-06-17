/* ===== ניווט צף משותף - מאסטרו נדל"ן =====
   הטמעה: <script src="nav.js"></script> בכל דף.
   נותן כפתור צף (🧭) שפותח תפריט לכל הדפים, כפתור "חזרה למאסטרו",
   ומקש F2 שמחזיר למסך הראשי. עובד בכל דף בלי תלות בקוד הדף. */
(function () {
  var BASE = 'https://avi7756-design.github.io/avi-sites/';
  var HOME = BASE + 'maestro-nadlan.html';

  // רשימת היעדים בתפריט הניווט
  var LINKS = [
    { i: '🏠', t: 'מאסטרו (ראשי)', u: HOME },
    { i: '🎯', t: 'משימות היום', u: BASE + 'manage.html' },
    { i: '📊', t: 'דשבורד לידים', u: BASE + 'dashboard.html' },
    { i: '🏡', t: 'דף נחיתה', u: BASE + 'dira-gallery/' },
    { i: '🏢', t: 'מרכז השקעות', u: 'https://avi-hazan.app.n8n.cloud/webhook/investment-center' },
    { i: '▶️', t: 'ניתוח עסקה', u: 'https://avi-hazan.app.n8n.cloud/form/2a13924a-6497-4442-8351-989cb3555faf' },
    { i: '🤖', t: 'בוט טלגרם', u: 'https://t.me/Avi_eilat5_bot' }
  ];

  // אל תציג את הכפתור על המאסטרו עצמו (כדי לא לכפול)
  var onHome = location.pathname.indexOf('maestro-nadlan') > -1;

  var css = '' +
  '#mnav-fab{position:fixed;bottom:calc(18px + env(safe-area-inset-bottom));left:18px;z-index:99999;' +
  'width:56px;height:56px;border-radius:50%;background:#4a382b;color:#fff;border:none;cursor:pointer;' +
  'font-size:24px;box-shadow:0 4px 16px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;}' +
  '#mnav-fab:active{transform:scale(.92);}' +
  '#mnav-home{position:fixed;bottom:calc(18px + env(safe-area-inset-bottom));right:18px;z-index:99999;' +
  'background:#c1764c;color:#fff;border:none;border-radius:30px;padding:13px 18px;font-size:14px;font-weight:bold;' +
  'cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.3);font-family:inherit;}' +
  '#mnav-home:active{transform:scale(.95);}' +
  '#mnav-ov{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:99998;display:none;}' +
  '#mnav-ov.show{display:block;}' +
  '#mnav-sheet{position:fixed;bottom:0;left:0;right:0;z-index:99999;background:#fbf4e9;' +
  'border-radius:18px 18px 0 0;padding:14px 14px calc(20px + env(safe-area-inset-bottom));' +
  'box-shadow:0 -4px 30px rgba(0,0,0,.3);transform:translateY(100%);transition:transform .22s;max-width:560px;margin:0 auto;}' +
  '#mnav-ov.show #mnav-sheet{transform:translateY(0);}' +
  '#mnav-sheet h3{font-family:Segoe UI,Arial,sans-serif;color:#a05c3a;font-size:16px;text-align:center;margin:4px 0 12px;direction:rtl;}' +
  '.mnav-item{display:flex;align-items:center;gap:12px;padding:13px 14px;margin-bottom:7px;background:#fff;' +
  'border:1px solid #e6d9c2;border-radius:13px;text-decoration:none;color:#4a382b;font-family:Segoe UI,Arial,sans-serif;' +
  'font-size:15px;font-weight:bold;direction:rtl;}' +
  '.mnav-item:active{background:#fbf4e9;}' +
  '.mnav-item .mi{font-size:22px;}' +
  '#mnav-close{width:100%;padding:12px;margin-top:4px;background:#78624f;color:#fff;border:none;border-radius:13px;' +
  'font-size:14px;font-weight:bold;cursor:pointer;font-family:inherit;}';

  function build() {
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

    // כפתור "חזרה למאסטרו" (ימין) - בכל דף שהוא לא המאסטרו
    if (!onHome) {
      var home = document.createElement('button');
      home.id = 'mnav-home'; home.innerHTML = '🏠 מאסטרו';
      home.title = 'חזרה למסך הראשי (F2)';
      home.onclick = function () { location.href = HOME; };
      document.body.appendChild(home);
    }

    // כפתור ניווט צף (שמאל) - בכל הדפים
    var fab = document.createElement('button');
    fab.id = 'mnav-fab'; fab.innerHTML = '🧭'; fab.title = 'ניווט מהיר';
    document.body.appendChild(fab);

    var ov = document.createElement('div'); ov.id = 'mnav-ov';
    var sheet = '<div id="mnav-sheet"><h3>🧭 ניווט מהיר</h3>';
    LINKS.forEach(function (l) {
      var ext = l.u.indexOf('avi7756-design') === -1 ? ' target="_blank"' : '';
      sheet += '<a class="mnav-item" href="' + l.u + '"' + ext + '><span class="mi">' + l.i + '</span>' + l.t + '</a>';
    });
    sheet += '<button id="mnav-close">סגור</button></div>';
    ov.innerHTML = sheet;
    document.body.appendChild(ov);

    fab.onclick = function () { ov.classList.add('show'); };
    ov.onclick = function (e) { if (e.target === ov || e.target.id === 'mnav-close') ov.classList.remove('show'); };

    // אם יש סרגל ניווט תחתון קבוע בדף (כמו ב-manage) - הרם את הכפתורים מעליו כדי לא להסתירו
    function lift() {
      var bar = document.querySelector('.bottomnav');
      var extra = (bar && getComputedStyle(bar).display !== 'none') ? (bar.offsetHeight + 8) + 'px + ' : '';
      var b = 'calc(' + extra + '18px + env(safe-area-inset-bottom))';
      fab.style.bottom = b;
      if (typeof home !== 'undefined') home.style.bottom = b;
    }
    lift();
    window.addEventListener('resize', lift);
  }

  // F2 = חזרה למאסטרו (במחשב)
  document.addEventListener('keydown', function (e) {
    if (e.key === 'F2') { e.preventDefault(); location.href = HOME; }
  });

  if (document.body) build();
  else document.addEventListener('DOMContentLoaded', build);
})();
