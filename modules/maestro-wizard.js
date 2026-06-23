/* maestro-wizard.js | v2.0.0 | 2026-06-23
   Guided wizard — step-by-step onboarding for non-technical users.
   Triggered from Command Bar or direct. */
(function(){
  const MOD = {
    id:'wizard', version:'2.0.0', name:'אשף חיפוש עסקה',
    init: setup, destroy: teardown
  };

  const BASE = 'https://avi7756-design.github.io/avi-sites/';

  const STEPS = [
    {id:'goal', title:'מה תרצה לעשות?', type:'choice', choices:[
      {value:'invest',  icon:'💎', label:'חיפוש דירה להשקעה', sub:'תשואה, אזור, תקציב'},
      {value:'check',   icon:'🔬', label:'בדיקת עסקה ספציפית', sub:'כתובת, SWOT, בדיקות'},
      {value:'manage',  icon:'📋', label:'ניהול לידים קיימים', sub:'דשבורד, מתווכים, מעקב'},
      {value:'learn',   icon:'📚', label:'ללמוד איך המערכת עובדת', sub:'מדריך, אינפוגרפיקה'},
    ]},
    {id:'area', title:'באיזה אזור?', type:'text', placeholder:'קריות / חיפה / עכו / אחר...', showIf:g=>g==='invest'||g==='check'},
    {id:'budget', title:'מה התקציב שלך?', type:'choice', showIf:g=>g==='invest', choices:[
      {value:'500',  icon:'💰', label:'עד 500,000 ₪', sub:'סטודיו / דירת חדר'},
      {value:'800',  icon:'💰💰', label:'500-800,000 ₪', sub:'2-3 חדרים'},
      {value:'1200', icon:'💰💰💰', label:'800,000-1.2M ₪', sub:'3-4 חדרים'},
      {value:'max',  icon:'🏦', label:'מעל 1.2M ₪', sub:'דירה גדולה / בניין'},
    ]},
    {id:'yield', title:'תשואה מינימלית?', type:'choice', showIf:g=>g==='invest', choices:[
      {value:'5',  icon:'📊', label:'5%+', sub:'סולידי'},
      {value:'7',  icon:'📈', label:'7%+', sub:'טוב'},
      {value:'10', icon:'🚀', label:'10%+', sub:'יהלום - דורש חיפוש'},
    ]},
    {id:'address', title:'מה הכתובת?', type:'text', placeholder:'רחוב, מספר, עיר...', showIf:g=>g==='check'},
  ];

  let overlay, state;

  function setup(){
    MaestroCore.injectCSS(MOD.id, `
      .mwiz-overlay{position:fixed;inset:0;background:rgba(4,9,15,.85);z-index:9997;display:none;align-items:center;justify-content:center}
      .mwiz-overlay.open{display:flex}
      .mwiz-box{background:#1a2230;border:1px solid #2e3c4f;border-radius:20px;width:96%;max-width:580px;padding:32px;box-shadow:0 24px 72px rgba(0,0,0,.5);direction:rtl}
      .mwiz-title{font-size:22px;font-weight:800;color:#e8eef5;margin:0 0 6px}
      .mwiz-sub{color:#8aa0b5;font-size:14px;margin:0 0 20px}
      .mwiz-progress{display:flex;gap:6px;margin-bottom:22px}
      .mwiz-dot{width:100%;height:5px;border-radius:99px;background:#222d3d}
      .mwiz-dot.done{background:#4ea1ff}
      .mwiz-dot.now{background:#ffcc4d}
      .mwiz-choices{display:grid;grid-template-columns:1fr 1fr;gap:10px}
      .mwiz-choice{background:#222d3d;border:2px solid #2e3c4f;border-radius:14px;padding:16px;cursor:pointer;text-align:center;transition:all .15s}
      .mwiz-choice:hover{border-color:#4ea1ff;background:#1e2e42}
      .mwiz-choice .ico{font-size:28px;margin-bottom:6px}
      .mwiz-choice .lbl{font-size:15px;font-weight:700;color:#e8eef5}
      .mwiz-choice .sub{font-size:12px;color:#8aa0b5;margin-top:3px}
      .mwiz-input{width:100%;background:#0c1118;border:2px solid #2e3c4f;color:#e8eef5;border-radius:12px;padding:14px 16px;font-size:16px;font-family:inherit;outline:none;direction:rtl}
      .mwiz-input:focus{border-color:#4ea1ff}
      .mwiz-nav{display:flex;justify-content:space-between;margin-top:22px;gap:10px}
      .mwiz-btn{border:none;border-radius:10px;padding:11px 22px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit}
      .mwiz-btn.next{background:#4ea1ff;color:#06121f}
      .mwiz-btn.back{background:#222d3d;color:#8aa0b5;border:1px solid #2e3c4f}
      .mwiz-btn.skip{background:transparent;color:#5f6f86;border:none;text-decoration:underline}
      .mwiz-summary{background:#0c1118;border:1px solid #2e3c4f;border-radius:12px;padding:16px;margin-bottom:16px}
      .mwiz-summary .row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #1a2230;font-size:14px;color:#c8d6e5}
      .mwiz-summary .row:last-child{border:none}
      .mwiz-summary .val{color:#4ea1ff;font-weight:700}
      .mwiz-launch{display:grid;gap:8px}
      .mwiz-launch a{display:block;background:#222d3d;border:1px solid #2e3c4f;border-radius:10px;padding:12px 16px;color:#e8eef5;text-decoration:none;font-size:14px;font-weight:600;transition:background .12s}
      .mwiz-launch a:hover{background:#1e2e42;border-color:#4ea1ff}
    `);

    state = {step:0, answers:{}, query:''};

    overlay = document.createElement('div');
    overlay.className = 'mwiz-overlay';
    overlay.id = 'mmod-wizard';
    overlay.addEventListener('click', e=>{ if(e.target===overlay) close(); });
    document.body.appendChild(overlay);

    window.MaestroWizard = {open: openWizard};
  }

  function openWizard(query){
    state = {step:0, answers:{}, query: query||''};
    if(query) parseQuery(query);
    overlay.classList.add('open');
    renderStep();
    MaestroCore.journal('wizard-open', MOD.id, MOD.version, query||'');
  }

  function close(){ overlay.classList.remove('open'); }

  function parseQuery(q){
    const t = q.toLowerCase();
    if(t.includes('דירה')||t.includes('השקעה')) state.answers.goal='invest';
    if(t.includes('בדיקה')||t.includes('בדוק')) state.answers.goal='check';
    const yieldMatch = t.match(/(\d+)\s*%/);
    if(yieldMatch) state.answers.yield = yieldMatch[1];
    const areas = ['קריות','קרית ים','קרית ביאליק','קרית מוצקין','קרית אתא','חיפה','עכו'];
    areas.forEach(a=>{ if(t.includes(a)) state.answers.area = a; });
  }

  function visibleSteps(){
    const goal = state.answers.goal;
    return STEPS.filter(s=> !s.showIf || s.showIf(goal));
  }

  function renderStep(){
    const steps = visibleSteps();
    if(state.step >= steps.length){ renderSummary(); return; }
    const s = steps[state.step];
    const pre = state.answers[s.id] || '';

    let progress = '<div class="mwiz-progress">';
    for(let i=0;i<steps.length;i++){
      progress += `<div class="mwiz-dot ${i<state.step?'done':i===state.step?'now':''}"></div>`;
    }
    progress += '</div>';

    let body = '';
    if(s.type==='choice'){
      body = '<div class="mwiz-choices">';
      s.choices.forEach(c=>{
        body += `<div class="mwiz-choice" data-val="${c.value}"><div class="ico">${c.icon}</div><div class="lbl">${c.label}</div><div class="sub">${c.sub}</div></div>`;
      });
      body += '</div>';
    } else {
      body = `<input class="mwiz-input" placeholder="${s.placeholder||''}" value="${pre}">`;
    }

    const nav = `<div class="mwiz-nav">
      ${state.step>0?'<button class="mwiz-btn back" data-act="back">← חזור</button>':'<span></span>'}
      <div style="display:flex;gap:8px">
        <button class="mwiz-btn skip" data-act="skip">דלג</button>
        ${s.type==='text'?'<button class="mwiz-btn next" data-act="next">הבא →</button>':''}
      </div>
    </div>`;

    overlay.querySelector('.mwiz-box')?.remove();
    const box = document.createElement('div');
    box.className = 'mwiz-box';
    box.innerHTML = `${progress}<h2 class="mwiz-title">${s.title}</h2><p class="mwiz-sub">שלב ${state.step+1} מתוך ${steps.length}</p>${body}${nav}`;
    overlay.appendChild(box);

    box.querySelectorAll('.mwiz-choice').forEach(el=>{
      el.addEventListener('click', ()=>{
        state.answers[s.id] = el.dataset.val;
        state.step++;
        renderStep();
      });
    });
    box.querySelectorAll('[data-act]').forEach(el=>{
      el.addEventListener('click', ()=>{
        const act = el.dataset.act;
        if(act==='back'){ state.step = Math.max(0, state.step-1); renderStep(); }
        else if(act==='skip'){ state.step++; renderStep(); }
        else if(act==='next'){
          const inp = box.querySelector('.mwiz-input');
          if(inp) state.answers[s.id] = inp.value;
          state.step++;
          renderStep();
        }
      });
    });

    const inp = box.querySelector('.mwiz-input');
    if(inp){
      inp.focus();
      inp.addEventListener('keydown', e=>{
        if(e.key==='Enter'){
          state.answers[s.id] = inp.value;
          state.step++;
          renderStep();
        }
      });
    }
  }

  function renderSummary(){
    const a = state.answers;
    const goalLabel = {'invest':'חיפוש דירה להשקעה','check':'בדיקת עסקה','manage':'ניהול לידים','learn':'למידה'}[a.goal]||'כללי';
    const budgetLabel = {'500':'עד 500K','800':'500-800K','1200':'800K-1.2M','max':'מעל 1.2M'}[a.budget]||'';

    let rows = `<div class="row"><span>מטרה</span><span class="val">${goalLabel}</span></div>`;
    if(a.area) rows += `<div class="row"><span>אזור</span><span class="val">${a.area}</span></div>`;
    if(a.budget) rows += `<div class="row"><span>תקציב</span><span class="val">${budgetLabel} ₪</span></div>`;
    if(a.yield) rows += `<div class="row"><span>תשואה מינימלית</span><span class="val">${a.yield}%</span></div>`;
    if(a.address) rows += `<div class="row"><span>כתובת</span><span class="val">${a.address}</span></div>`;

    let links = '';
    if(a.goal==='invest'){
      links = `
        <a href="${BASE}maestro-dashboard.html">📋 פתח דשבורד לידים - התחל לסרוק</a>
        <a href="${BASE}area-research.html">🗺️ מחקר אזור ${a.area||''}</a>
        <a href="https://www.yad2.co.il/realestate/forsale?city=${encodeURIComponent(a.area||'')}" target="_blank">🏠 חפש ביד2 ${a.area||''}</a>
        <a href="https://www.madlan.co.il" target="_blank">📈 בדוק מחירים במדלן</a>
      `;
    } else if(a.goal==='check'){
      links = `
        <a href="${BASE}deal-swot/">🔬 פתח ניתוח SWOT ${a.address?'- '+a.address:''}</a>
        <a href="https://www.govmap.gov.il" target="_blank">🗺️ בדוק ב-GovMap</a>
        <a href="https://www.iaa.gov.il/tabsearch/" target="_blank">📜 משוך נסח טאבו</a>
      `;
    } else if(a.goal==='manage'){
      links = `<a href="${BASE}maestro-dashboard.html">📋 פתח דשבורד לידים</a>`;
    } else {
      links = `
        <a href="${BASE}maestro-help.html">📚 מרכז עזרה</a>
        <a href="${BASE}maestro-infographic.html">📊 אינפוגרפיקה</a>
      `;
    }

    overlay.querySelector('.mwiz-box')?.remove();
    const box = document.createElement('div');
    box.className = 'mwiz-box';
    box.innerHTML = `
      <h2 class="mwiz-title">סיכום ושיגור 🚀</h2>
      <p class="mwiz-sub">הנה מה שהגדרת. לחץ על כלי כדי להתחיל.</p>
      <div class="mwiz-summary">${rows}</div>
      <div class="mwiz-launch">${links}</div>
      <div class="mwiz-nav">
        <button class="mwiz-btn back" data-act="restart">↩ התחל מחדש</button>
        <button class="mwiz-btn skip" data-act="close">סגור</button>
      </div>`;
    overlay.appendChild(box);

    box.querySelector('[data-act="restart"]').addEventListener('click', ()=>{ state={step:0,answers:{},query:''}; renderStep(); });
    box.querySelector('[data-act="close"]').addEventListener('click', close);

    MaestroCore.journal('wizard-complete', MOD.id, MOD.version, JSON.stringify(a));
  }

  function teardown(){ MaestroCore.removeModule(MOD.id); window.MaestroWizard=null; }

  if(window.MaestroCore) MaestroCore.register(MOD);
  else window.addEventListener('load', ()=> MaestroCore.register(MOD));
})();
