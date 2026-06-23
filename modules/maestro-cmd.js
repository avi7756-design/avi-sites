/* maestro-cmd.js | v2.0.0 | 2026-06-23
   Command Bar — press / or click 🔍 to open.
   Hebrew natural language routing to tools. */
(function(){
  const MOD = {
    id:'command-bar', version:'2.0.0', name:'שורת פקודות חכמה',
    init: setup, destroy: teardown
  };

  const ROUTES = [
    {keys:['ליד','לידים','pipeline'],         label:'📋 דשבורד לידים',      href:'maestro-dashboard.html'},
    {keys:['swot','בדיקה','עסקה','ניתוח'],    label:'🔬 ניתוח עסקה SWOT',   href:'deal-swot/'},
    {keys:['עזרה','help','מדריך'],             label:'📚 מרכז עזרה',          href:'maestro-help.html'},
    {keys:['אינפוגרפיקה','תרשים','סקירה'],    label:'📊 אינפוגרפיקה',       href:'maestro-infographic.html'},
    {keys:['מחקר','אזור','שכונה'],             label:'🗺️ מחקר אזור',         href:'area-research.html'},
    {keys:['תזרים','cashflow','כסף'],          label:'💰 תזרים מזומנים',      href:'cashflow.html'},
    {keys:['נכסים','תיק','assets'],            label:'🏢 תיק נכסים',          href:'assets-hub.html'},
    {keys:['השוואה','compare','comps'],         label:'⚖️ השוואת עסקאות',     href:'deals-db.html'},
    {keys:['יומן','לוח','agenda'],              label:'📅 יומן פגישות',        href:'agenda.html'},
    {keys:['מתווך','מתווכים','agent'],          label:'👥 רשת מתווכים',        href:'maestro-dashboard.html#agentsSection'},
    {keys:['govmap','תב"ע','תכנון'],            label:'🗺️ GovMap',            href:'https://www.govmap.gov.il', ext:true},
    {keys:['טאבו','נסח','רישום'],               label:'📜 נסח טאבו',          href:'https://www.iaa.gov.il/tabsearch/', ext:true},
    {keys:['מדלן','שוק','מחירים'],              label:'📈 מדלן',              href:'https://www.madlan.co.il', ext:true},
    {keys:['יד2','מודעות','היצע'],              label:'🏠 יד2 נדל"ן',         href:'https://www.yad2.co.il/realestate/forsale', ext:true},
  ];

  const ACTIONS = [
    {keys:['דירה','השקעה','תשואה','חיפוש','מחפש'], action:'wizard'},
    {keys:['יומן','journal','היסטוריה','לוג'],       action:'journal'},
    {keys:['מודולים','modules','הגדרות'],             action:'modules'},
  ];

  const BASE = 'https://avi7756-design.github.io/avi-sites/';

  function setup(){
    MaestroCore.injectCSS(MOD.id, `
      .mcmd-trigger{position:fixed;top:12px;right:50%;transform:translateX(50%);z-index:9990;background:#1a2230;color:#8aa0b5;border:1px solid #2e3c4f;border-radius:12px;padding:9px 22px;font-size:14px;cursor:pointer;display:flex;align-items:center;gap:8px;font-family:inherit;transition:all .2s}
      .mcmd-trigger:hover{background:#222d3d;color:#e8eef5;border-color:#4ea1ff}
      .mcmd-trigger kbd{background:#0c1118;border:1px solid #2e3c4f;border-radius:5px;padding:2px 7px;font-size:12px;color:#4ea1ff}
      .mcmd-overlay{position:fixed;inset:0;background:rgba(4,9,15,.7);z-index:9998;display:none;align-items:flex-start;justify-content:center;padding-top:12vh}
      .mcmd-overlay.open{display:flex}
      .mcmd-box{background:#1a2230;border:1px solid #2e3c4f;border-radius:16px;width:96%;max-width:640px;box-shadow:0 20px 60px rgba(0,0,0,.5);overflow:hidden}
      .mcmd-input{width:100%;background:transparent;border:none;border-bottom:1px solid #2e3c4f;color:#e8eef5;padding:18px 20px;font-size:17px;font-family:inherit;outline:none;direction:rtl}
      .mcmd-input::placeholder{color:#5f6f86}
      .mcmd-results{max-height:52vh;overflow:auto;padding:6px}
      .mcmd-item{display:flex;align-items:center;gap:10px;padding:11px 16px;border-radius:10px;cursor:pointer;color:#c8d6e5;font-size:14px;transition:background .12s}
      .mcmd-item:hover,.mcmd-item.active{background:#222d3d;color:#fff}
      .mcmd-item .hint{margin-inline-start:auto;color:#5f6f86;font-size:12px}
      .mcmd-empty{padding:28px;text-align:center;color:#5f6f86;font-size:14px}
      .mcmd-footer{border-top:1px solid #2e3c4f;padding:8px 16px;display:flex;gap:12px;color:#5f6f86;font-size:12px}
      .mcmd-footer kbd{background:#0c1118;border:1px solid #2e3c4f;border-radius:4px;padding:1px 5px}
    `);

    const trigger = document.createElement('button');
    trigger.className = 'mcmd-trigger';
    trigger.innerHTML = '🔍 מה תרצה לעשות? <kbd>/</kbd>';
    trigger.onclick = open;

    const overlay = document.createElement('div');
    overlay.className = 'mcmd-overlay';
    overlay.id = 'mmod-command-bar';
    overlay.innerHTML = `
      <div class="mcmd-box">
        <input class="mcmd-input" placeholder="חפש כלי, הקלד פעולה, או תאר מה אתה צריך..." autofocus>
        <div class="mcmd-results"></div>
        <div class="mcmd-footer"><span><kbd>↑↓</kbd> ניווט</span><span><kbd>Enter</kbd> בחר</span><span><kbd>Esc</kbd> סגור</span></div>
      </div>`;
    overlay.addEventListener('click', e=>{ if(e.target===overlay) close(); });

    document.body.appendChild(trigger);
    document.body.appendChild(overlay);

    const input = overlay.querySelector('.mcmd-input');
    const results = overlay.querySelector('.mcmd-results');
    let activeIdx = -1;

    input.addEventListener('input', ()=>{ activeIdx=-1; render(input.value); });
    input.addEventListener('keydown', e=>{
      const items = results.querySelectorAll('.mcmd-item');
      if(e.key==='ArrowDown'){ e.preventDefault(); activeIdx=Math.min(activeIdx+1,items.length-1); highlight(items); }
      else if(e.key==='ArrowUp'){ e.preventDefault(); activeIdx=Math.max(activeIdx-1,0); highlight(items); }
      else if(e.key==='Enter'&&items[activeIdx]){ e.preventDefault(); items[activeIdx].click(); }
      else if(e.key==='Escape') close();
    });

    document.addEventListener('keydown', e=>{
      if(e.key==='/' && !['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)){
        e.preventDefault(); open();
      }
    });

    function highlight(items){
      items.forEach((el,i)=> el.classList.toggle('active', i===activeIdx));
      if(items[activeIdx]) items[activeIdx].scrollIntoView({block:'nearest'});
    }

    function open(){
      overlay.classList.add('open');
      input.value='';
      render('');
      setTimeout(()=>input.focus(),50);
      MaestroCore.journal('cmd-open', MOD.id, MOD.version);
    }

    function close(){
      overlay.classList.remove('open');
    }

    function render(q){
      const t = q.trim().toLowerCase();
      let html = '';
      if(!t){
        html = ROUTES.slice(0,8).map(r=> item(r.label, r.href, r.ext, 'כלי')).join('');
        html += item('🧙 אשף חיפוש עסקה', '#wizard', false, 'אשף');
        html += item('📓 יומן פעולות', '#journal', false, 'מערכת');
        html += item('⚙️ מודולים פעילים', '#modules', false, 'מערכת');
      } else {
        const matched = ROUTES.filter(r=> r.keys.some(k=>k.includes(t)) || r.label.includes(t));
        const actMatched = ACTIONS.filter(a=> a.keys.some(k=>k.includes(t)));
        if(actMatched.find(a=>a.action==='wizard') || t.includes('דירה') || t.includes('השקעה') || t.includes('תשואה') || t.includes('מחפש')){
          html += item('🧙 אשף חיפוש עסקה - "'+q+'"', '#wizard:'+encodeURIComponent(q), false, 'אשף');
        }
        matched.forEach(r=> html += item(r.label, r.href, r.ext, r.ext?'חיצוני':'כלי'));
        if(actMatched.find(a=>a.action==='journal')) html += item('📓 יומן פעולות', '#journal', false, 'מערכת');
        if(actMatched.find(a=>a.action==='modules')) html += item('⚙️ מודולים פעילים', '#modules', false, 'מערכת');
        if(!html) html = '<div class="mcmd-empty">לא נמצא. נסה מילה אחרת או הפעל את האשף 🧙</div>';
      }
      results.innerHTML = html;
      results.querySelectorAll('.mcmd-item').forEach((el,i)=>{
        el.addEventListener('click', ()=> go(el.dataset.href, el.dataset.ext==='1'));
        el.addEventListener('mouseenter', ()=>{ activeIdx=i; highlight(results.querySelectorAll('.mcmd-item')); });
      });
      activeIdx = 0;
      highlight(results.querySelectorAll('.mcmd-item'));
    }

    function item(label, href, ext, hint){
      return `<div class="mcmd-item" data-href="${href}" data-ext="${ext?1:0}"><span>${label}</span><span class="hint">${hint||''}</span></div>`;
    }

    function go(href, ext){
      close();
      MaestroCore.journal('cmd-navigate', MOD.id, MOD.version, href);
      if(href==='#journal'){ showJournal(); return; }
      if(href==='#modules'){ showModules(); return; }
      if(href.startsWith('#wizard')){
        const q = href.includes(':')?decodeURIComponent(href.split(':')[1]):'';
        if(window.MaestroWizard) window.MaestroWizard.open(q);
        else alert('מודול האשף לא נטען');
        return;
      }
      const url = ext ? href : BASE + href;
      window.location.href = url;
    }

    function showJournal(){
      const j = MaestroCore.getJournal().slice(-30).reverse();
      const rows = j.map(e=>`<tr><td style="font-size:12px;color:#8aa0b5">${new Date(e.ts).toLocaleString('he-IL')}</td><td>${e.action}</td><td>${e.id}</td><td style="color:#5f6f86">${e.detail||''}</td></tr>`).join('');
      results.innerHTML = `<div style="padding:12px;direction:rtl"><h3 style="color:#4ea1ff;margin:0 0 10px">📓 יומן פעולות (30 אחרונות)</h3><table style="width:100%;font-size:13px;color:#e8eef5;border-collapse:collapse"><tr style="color:#8aa0b5"><th style="text-align:right;padding:6px">זמן</th><th style="text-align:right;padding:6px">פעולה</th><th style="text-align:right;padding:6px">מודול</th><th style="text-align:right;padding:6px">פרטים</th></tr>${rows}</table></div>`;
    }

    function showModules(){
      const mods = MaestroCore.listModules();
      const rows = mods.map(m=>`<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid #2e3c4f"><span style="font-size:14px">${m.enabled?'🟢':'🔴'} ${m.name}</span><span style="margin-inline-start:auto;color:#5f6f86;font-size:12px">v${m.version}</span></div>`).join('');
      results.innerHTML = `<div style="padding:12px;direction:rtl"><h3 style="color:#4ea1ff;margin:0 0 10px">⚙️ מודולים פעילים</h3>${rows}</div>`;
    }
  }

  function teardown(){ MaestroCore.removeModule(MOD.id); document.querySelector('.mcmd-trigger')?.remove(); }

  if(window.MaestroCore) MaestroCore.register(MOD);
  else window.addEventListener('load', ()=> MaestroCore.register(MOD));
})();
