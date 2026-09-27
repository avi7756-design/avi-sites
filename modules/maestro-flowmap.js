/* maestro-flowmap.js | v2.0.0 | 2026-06-23
   Interactive visual process map — replaces the 8-step text list
   with a clickable flowchart showing status per deal. */
(function(){
  const MOD = {
    id:'flowmap', version:'2.0.0', name:'מפת תהליך אינטראקטיבית',
    init: setup, destroy: teardown
  };

  const FLOW = [
    {num:1, icon:'📜', title:'נסח טאבו',         desc:'בעלות, הערות, עיקולים', link:'https://www.iaa.gov.il/tabsearch/', ext:true, color:'#4ea1ff'},
    {num:2, icon:'🗺️', title:'תב"ע ותכנון',      desc:'ייעוד, זכויות, תוכניות', link:'https://www.govmap.gov.il', ext:true, color:'#39d3c3'},
    {num:3, icon:'🏗️', title:'התחדשות עירונית',   desc:'מתחם, דיירים, יזם', link:'https://www.renewal.gov.il', ext:true, color:'#ffcc4d'},
    {num:4, icon:'🚇', title:'תחבורה עתידית',     desc:'מטרו, רכבת, תחנות', link:'https://www.gov.il/he/service/metro-system-map', ext:true, color:'#ff8c42'},
    {num:5, icon:'🏢', title:'תיק בניין',          desc:'היתרים, חריגות, צווים', link:'', ext:false, color:'#b57edc'},
    {num:6, icon:'⚖️', title:'הליכים משפטיים',    desc:'עתירות, סכסוכים', link:'', ext:false, color:'#ff6b6b'},
    {num:7, icon:'📊', title:'השוואת שוק',         desc:'עסקאות, מחירים, שכירות', link:'https://www.madlan.co.il', ext:true, color:'#3ddc84'},
    {num:8, icon:'🎯', title:'SWOT והחלטה',        desc:'סיכום, Go/No-Go', link:'deal-swot/', ext:false, color:'#ffcc4d'},
  ];

  const STATUS_KEY = 'maestro_flow_status';

  function getStatus(){
    return JSON.parse(localStorage.getItem(STATUS_KEY)||'{}');
  }
  function setStatus(num, val){
    const s = getStatus();
    s[num] = val;
    localStorage.setItem(STATUS_KEY, JSON.stringify(s));
  }

  function setup(){
    MaestroCore.injectCSS(MOD.id, `
      .mflow-section{background:#111827;border:1px solid #2e3c4f;border-radius:16px;padding:24px;margin:20px 0}
      .mflow-title{font-size:18px;font-weight:800;color:#e8eef5;margin:0 0 4px}
      .mflow-sub{color:#8aa0b5;font-size:13px;margin:0 0 18px}
      .mflow-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
      @media(max-width:800px){.mflow-grid{grid-template-columns:repeat(2,1fr)}}
      .mflow-card{position:relative;background:#1a2230;border:2px solid #2e3c4f;border-radius:14px;padding:16px;cursor:pointer;transition:all .2s;text-align:center}
      .mflow-card:hover{border-color:#4ea1ff;transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.3)}
      .mflow-card .num{position:absolute;top:-8px;right:-8px;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:#fff}
      .mflow-card .ico{font-size:32px;margin:8px 0 6px}
      .mflow-card .ttl{font-size:14px;font-weight:700;color:#e8eef5;margin-bottom:3px}
      .mflow-card .dsc{font-size:12px;color:#8aa0b5}
      .mflow-card .sts{margin-top:8px;font-size:11px;font-weight:700;border-radius:99px;padding:3px 10px;display:inline-block}
      .mflow-card .sts.pending{background:rgba(255,204,77,.15);color:#ffcc4d}
      .mflow-card .sts.done{background:rgba(61,220,132,.15);color:#3ddc84}
      .mflow-card .sts.problem{background:rgba(255,107,107,.15);color:#ff6b6b}
      .mflow-card .sts.na{background:rgba(138,160,181,.1);color:#5f6f86}
      .mflow-arrow{display:none}
      .mflow-legend{display:flex;gap:14px;margin-top:14px;flex-wrap:wrap}
      .mflow-legend span{font-size:12px;color:#8aa0b5;display:flex;align-items:center;gap:4px}
      .mflow-legend i{width:10px;height:10px;border-radius:50%;display:inline-block}
      .mflow-menu{position:absolute;top:100%;right:0;background:#222d3d;border:1px solid #2e3c4f;border-radius:10px;padding:6px;z-index:10;display:none;min-width:130px}
      .mflow-menu.open{display:block}
      .mflow-menu button{display:block;width:100%;background:none;border:none;color:#c8d6e5;padding:7px 10px;font-size:13px;text-align:right;cursor:pointer;border-radius:6px;font-family:inherit}
      .mflow-menu button:hover{background:#1a2230}
    `);

    const target = document.querySelector('.process')?.closest('section');
    if(!target) return;

    const container = document.createElement('div');
    container.className = 'mflow-section';
    container.id = 'mmod-flowmap';

    const BASE_URL = 'https://avi7756-design.github.io/avi-sites/';
    const statuses = getStatus();
    const statusLabels = {pending:'ממתין',done:'הושלם',problem:'בעיה',na:'לא רלוונטי'};

    let cards = '';
    FLOW.forEach(f=>{
      const st = statuses[f.num] || 'pending';
      cards += `<div class="mflow-card" data-num="${f.num}" data-link="${f.ext?f.link:BASE_URL+f.link}" style="border-top:3px solid ${f.color}">
        <div class="num" style="background:${f.color}">${f.num}</div>
        <div class="ico">${f.icon}</div>
        <div class="ttl">${f.title}</div>
        <div class="dsc">${f.desc}</div>
        <div class="sts ${st}">${statusLabels[st]}</div>
        <div class="mflow-menu" data-menu="${f.num}">
          <button data-st="done">✅ הושלם</button>
          <button data-st="problem">🔴 בעיה</button>
          <button data-st="pending">⏳ ממתין</button>
          <button data-st="na">➖ לא רלוונטי</button>
        </div>
      </div>`;
    });

    container.innerHTML = `
      <h2 class="mflow-title">🗺️ מפת תהליך - 8 שלבי בדיקה</h2>
      <p class="mflow-sub">לחיצה → פותח כלי | לחיצה ימנית → שנה סטטוס</p>
      <div class="mflow-grid">${cards}</div>
      <div class="mflow-legend">
        <span><i style="background:#ffcc4d"></i> ממתין</span>
        <span><i style="background:#3ddc84"></i> הושלם</span>
        <span><i style="background:#ff6b6b"></i> בעיה</span>
        <span><i style="background:#5f6f86"></i> לא רלוונטי</span>
      </div>`;

    target.parentNode.insertBefore(container, target);
    target.style.display = 'none';

    container.querySelectorAll('.mflow-card').forEach(card=>{
      card.addEventListener('click', e=>{
        if(e.target.closest('.mflow-menu')) return;
        const link = card.dataset.link;
        if(link) window.open(link, card.dataset.link.startsWith('http')?'_blank':'_self');
        MaestroCore.journal('flow-click', MOD.id, MOD.version, 'step-'+card.dataset.num);
      });

      card.addEventListener('contextmenu', e=>{
        e.preventDefault();
        const menu = card.querySelector('.mflow-menu');
        document.querySelectorAll('.mflow-menu.open').forEach(m=>m.classList.remove('open'));
        menu.classList.toggle('open');
      });

      card.querySelectorAll('.mflow-menu button').forEach(btn=>{
        btn.addEventListener('click', e=>{
          e.stopPropagation();
          const num = card.dataset.num;
          const st = btn.dataset.st;
          setStatus(num, st);
          const sts = card.querySelector('.sts');
          sts.className = 'sts '+st;
          sts.textContent = statusLabels[st];
          card.querySelector('.mflow-menu').classList.remove('open');
          MaestroCore.journal('flow-status', MOD.id, MOD.version, 'step-'+num+':'+st);
        });
      });
    });

    document.addEventListener('click', ()=>{
      document.querySelectorAll('.mflow-menu.open').forEach(m=>m.classList.remove('open'));
    });
  }

  function teardown(){
    MaestroCore.removeModule(MOD.id);
    const old = document.querySelector('.process')?.closest('section');
    if(old) old.style.display = '';
  }

  if(window.MaestroCore) MaestroCore.register(MOD);
  else window.addEventListener('load', ()=> MaestroCore.register(MOD));
})();
