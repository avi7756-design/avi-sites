/* maestro-guide.js | v1.0.0 | 2026-06-24
   Visual guide overlay + inline tooltips for deal-swot.
   "?" button opens full infographic + dictionary. */
(function(){
  const MOD = {
    id:'guide', version:'1.0.0', name:'מדריך ויזואלי + טולטיפים',
    init: setup, destroy: teardown
  };

  const TIPS = {
    'dealId':       'מספר זיהוי ייחודי לעסקה. לדוגמה: KY-2026-001 (קרית ים, עסקה ראשונה)',
    'address':      'הכתובת המלאה של הנכס. ככל שמדויק יותר - קל יותר לבדוק בטאבו וב-GovMap',
    'city':         'שם העיר או הקריה. חשוב לבחירת מקורות הבדיקה הנכונים',
    'neighborhood': 'שם השכונה. משפיע על מחיר, ביקוש שכירות ופוטנציאל עליית ערך',
    'block':        'מספר הגוש ברשם המקרקעין. מופיע בנסח הטאבו ונדרש לחיפוש תב"ע',
    'parcel':       'מספר החלקה בתוך הגוש. יחד עם הגוש מזהה את הנכס המדויק',
    'subparcel':    'תת-חלקה (אם קיימת). רלוונטי לבתים משותפים עם רישום מפוצל',
    'leadSource':   'מאיפה הגיע הליד? יד2, מדלן, מתווך, חבר - עוזר לעקוב על ערוצים',
    'price':        'המחיר שהמוכר מבקש (לא מה שתשלם). נקודת ההתחלה למו"מ',
    'area':         'השטח הרשום במ"ר לפי נסח/היתר. שטח אמיתי יכול להיות שונה - תמיד למדוד',
    'rent':         'כמה שכירות חודשית צפויה? בדוק במדלן ויד2 דירות דומות באותו רחוב',
    'renovation':   'עלות שיפוץ משוערת. כלל אצבע: 2,000-4,000 ₪ למ"ר תלוי במצב',
    'status':       'באיזה שלב העסקה? עוזר לתעדף ולדעת מה הפעולה הבאה',
    'summary':      'תאר את העסקה במשפט-שניים. למה היא מעניינת? מה עדיין לא ידוע?',
    'strengths':    'מה טוב בעסקה? מיקום, מחיר נמוך, תחבורה, ביקוש שכירות, פוטנציאל התחדשות',
    'weaknesses':   'מה בעייתי? מבנה ישן, חריגות, רישום מסובך, ועד בית גרוע, רעש',
    'opportunities':'מה יכול לשפר את הערך? תב"ע חדשה, מטרו, פינוי-בינוי, שינוי שכונתי',
    'threats':      'מה יכול לפגוע? צו הריסה, עתירות, עלויות בלתי צפויות, שוק יורד',
    'decision':     'ההחלטה הסופית: Go / No-Go / Go בתנאים. פרט תנאים ומסמכים חסרים',
    'evidenceLog':  'לכל טענה חשובה - רשום: מקור, URL, תאריך, מה נמצא. בלי ראיה = בלי SWOT',
    'missingDocs':  'רשימת מסמכים שעדיין חסרים: נסח, תיק בניין, היתר, שומה, חוזה שכירות',
    'updates':      'יומן - כל פעם שמשהו משתנה: תאריך, מה קרה, מה המשמעות לעסקה',
  };

  const SCORE_TIPS = {
    'legal':     'ציון משפטי: רישום נקי? אין עיקולים? בעלות ברורה? 100 = מושלם, 0 = סיכון גבוה',
    'planning':  'ציון תכנון: תב"ע מאושרת? זכויות בנייה? היתרים בסדר? תוכניות עתידיות?',
    'market':    'ציון שוק: המחיר הגיוני? יש ביקוש? עסקאות דומות תומכות במחיר?',
    'mobility':  'ציון תחבורה: קרוב לתחנה? מטרו עתידי? נגישות טובה לעבודה ומסחר?',
    'financial': 'ציון פיננסי: התשואה מספקת? התזרים חיובי? המינוף סביר? יש מרווח ביטחון?',
    'upside':    'ציון השבחה: אפשר לשפר? תוספת בנייה? שיפוץ שמעלה ערך? התחדשות עירונית?',
  };

  function setup(){
    MaestroCore.injectCSS(MOD.id, `
      .mguide-btn{position:fixed;bottom:18px;right:18px;z-index:9995;width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,#c08a3e,#d4a04a);color:#fff;border:none;font-size:24px;cursor:pointer;box-shadow:0 4px 20px rgba(192,138,62,.4);transition:transform .2s}
      .mguide-btn:hover{transform:scale(1.1)}
      .mguide-overlay{position:fixed;inset:0;background:rgba(4,9,15,.88);z-index:9996;display:none;overflow:auto;padding:20px}
      .mguide-overlay.open{display:block}
      .mguide-close{position:fixed;top:16px;left:16px;z-index:9997;background:#ff6b6b;color:#fff;border:none;border-radius:50%;width:38px;height:38px;font-size:20px;cursor:pointer}
      .mguide-wrap{max-width:900px;margin:0 auto;direction:rtl;color:#e8eef5}
      .mguide-wrap h1{text-align:center;font-size:26px;margin:10px 0 6px;color:#ffcc4d}
      .mguide-wrap .sub{text-align:center;color:#8aa0b5;font-size:14px;margin-bottom:28px}
      .mguide-flow{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:32px}
      @media(max-width:700px){.mguide-flow{grid-template-columns:repeat(2,1fr)}}
      .mguide-step{background:#1a2230;border:1px solid #2e3c4f;border-radius:14px;padding:16px;text-align:center;position:relative}
      .mguide-step .num{position:absolute;top:-10px;right:-10px;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:#fff}
      .mguide-step .icon{font-size:30px;margin:6px 0}
      .mguide-step .ttl{font-size:14px;font-weight:700;color:#e8eef5}
      .mguide-step .dsc{font-size:12px;color:#8aa0b5;margin-top:4px}
      .mguide-section{background:#1a2230;border:1px solid #2e3c4f;border-radius:14px;padding:20px;margin-bottom:18px}
      .mguide-section h2{color:#4ea1ff;font-size:18px;margin:0 0 14px}
      .mguide-section h3{color:#ffcc4d;font-size:15px;margin:16px 0 8px}
      .mguide-ex{background:#0c1118;border:1px solid #2e3c4f;border-radius:10px;padding:14px;margin:10px 0;font-size:14px;line-height:1.7}
      .mguide-ex b{color:#4ea1ff}
      .mguide-ex .result{color:#3ddc84;font-weight:700;font-size:16px}
      .mguide-dict{display:grid;grid-template-columns:1fr 1fr;gap:10px}
      @media(max-width:600px){.mguide-dict{grid-template-columns:1fr}}
      .mguide-term{background:#0c1118;border:1px solid #2e3c4f;border-radius:10px;padding:12px}
      .mguide-term b{color:#ffcc4d;font-size:14px}
      .mguide-term p{color:#c8d6e5;font-size:13px;margin:4px 0 0}
      .mguide-kpi-explain{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:12px 0}
      @media(max-width:600px){.mguide-kpi-explain{grid-template-columns:1fr}}
      .mguide-kpi-card{background:#0c1118;border:1px solid #2e3c4f;border-radius:12px;padding:14px;text-align:center}
      .mguide-kpi-card .big{font-size:28px;font-weight:800;margin:6px 0}
      .mguide-kpi-card .lbl{font-size:13px;color:#8aa0b5}
      .mguide-kpi-card .exp{font-size:12px;color:#c8d6e5;margin-top:8px;text-align:right}
      .mtip{position:relative;display:inline-block;cursor:help;margin-inline-start:4px}
      .mtip .mtip-icon{display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:50%;background:rgba(78,161,255,.15);color:#4ea1ff;font-size:11px;font-weight:700}
      .mtip .mtip-text{display:none;position:absolute;bottom:calc(100% + 6px);right:-10px;background:#1a2230;border:1px solid #4ea1ff;border-radius:10px;padding:10px 12px;font-size:12px;color:#e8eef5;width:260px;z-index:100;box-shadow:0 8px 24px rgba(0,0,0,.4);line-height:1.5;font-weight:normal}
      .mtip:hover .mtip-text{display:block}
    `);

    addTooltips();
    addGuideButton();

    if(window.MaestroCore) MaestroCore.journal('guide-init', MOD.id, MOD.version);
  }

  function addTooltips(){
    document.querySelectorAll('[data-field]').forEach(el=>{
      const key = el.dataset.field;
      const tip = TIPS[key];
      if(!tip) return;
      const label = el.closest('label') || el.parentElement;
      if(!label || label.querySelector('.mtip')) return;
      const span = document.createElement('span');
      span.className = 'mtip';
      span.innerHTML = `<span class="mtip-icon">?</span><span class="mtip-text">${tip}</span>`;
      label.appendChild(span);
    });

    document.querySelectorAll('[data-score]').forEach(el=>{
      const key = el.dataset.score;
      const tip = SCORE_TIPS[key];
      if(!tip) return;
      const label = el.closest('label') || el.parentElement;
      if(!label || label.querySelector('.mtip')) return;
      const span = document.createElement('span');
      span.className = 'mtip';
      span.innerHTML = `<span class="mtip-icon">?</span><span class="mtip-text">${tip}</span>`;
      label.appendChild(span);
    });
  }

  function addGuideButton(){
    const btn = document.createElement('button');
    btn.className = 'mguide-btn';
    btn.textContent = '?';
    btn.title = 'מדריך ויזואלי - איך זה עובד?';
    btn.onclick = openGuide;
    document.body.appendChild(btn);
  }

  function openGuide(){
    let ov = document.getElementById('mmod-guide');
    if(ov){ ov.classList.add('open'); return; }

    ov = document.createElement('div');
    ov.className = 'mguide-overlay open';
    ov.id = 'mmod-guide';
    ov.innerHTML = buildGuideHTML();
    document.body.appendChild(ov);

    ov.querySelector('.mguide-close').onclick = ()=> ov.classList.remove('open');
    ov.addEventListener('click', e=>{ if(e.target===ov) ov.classList.remove('open'); });

    if(window.MaestroCore) MaestroCore.journal('guide-open', MOD.id, MOD.version);
  }

  function buildGuideHTML(){
    return `
    <button class="mguide-close">✕</button>
    <div class="mguide-wrap">
      <h1>📖 המדריך המלא לניתוח עסקת נדל"ן</h1>
      <p class="sub">8 שלבים פשוטים - מהרגע שמצאת דירה ועד להחלטת Go / No-Go</p>

      <div class="mguide-flow">
        <div class="mguide-step"><div class="num" style="background:#4ea1ff">1</div><div class="icon">📜</div><div class="ttl">נסח טאבו</div><div class="dsc">בדוק מי הבעלים ואם יש חובות על הדירה</div></div>
        <div class="mguide-step"><div class="num" style="background:#39d3c3">2</div><div class="icon">🗺️</div><div class="ttl">תב"ע ותכנון</div><div class="dsc">מה מותר לבנות? יש תוכניות חדשות?</div></div>
        <div class="mguide-step"><div class="num" style="background:#ffcc4d">3</div><div class="icon">🏗️</div><div class="ttl">התחדשות עירונית</div><div class="dsc">הבניין הולך להיהרס ולהיבנות מחדש?</div></div>
        <div class="mguide-step"><div class="num" style="background:#ff8c42">4</div><div class="icon">🚇</div><div class="ttl">תחבורה</div><div class="dsc">תחנת רכבת/מטרו קרובה = עליית ערך</div></div>
        <div class="mguide-step"><div class="num" style="background:#b57edc">5</div><div class="icon">🏢</div><div class="ttl">תיק בניין</div><div class="dsc">בדוק שאין בנייה לא חוקית או צווי הריסה</div></div>
        <div class="mguide-step"><div class="num" style="background:#ff6b6b">6</div><div class="icon">⚖️</div><div class="ttl">בדיקה משפטית</div><div class="dsc">תביעות? סכסוכים? עתירות נגד תוכנית?</div></div>
        <div class="mguide-step"><div class="num" style="background:#3ddc84">7</div><div class="icon">📊</div><div class="ttl">השוואת שוק</div><div class="dsc">כמה שווה באמת? מה נמכר בסביבה?</div></div>
        <div class="mguide-step"><div class="num" style="background:#c08a3e">8</div><div class="icon">🎯</div><div class="ttl">החלטה</div><div class="dsc">כל המידע מול העיניים - Go או No-Go</div></div>
      </div>

      <div class="mguide-section">
        <h2>📊 הבנת המספרים - בשפה פשוטה</h2>

        <div class="mguide-kpi-explain">
          <div class="mguide-kpi-card">
            <div class="lbl">תשואה שנתית ברוטו</div>
            <div class="big" style="color:#3ddc84">6%</div>
            <div class="exp">כמה כסף הדירה מחזירה לך בשנה, כאחוז ממה ששילמת. ככל שיותר גבוה = יותר טוב.</div>
          </div>
          <div class="mguide-kpi-card">
            <div class="lbl">מחיר למ"ר</div>
            <div class="big" style="color:#4ea1ff">₪12,500</div>
            <div class="exp">מחיר הדירה חלקי השטח. משווים לדירות דומות - אם יותר זול = אולי הזדמנות, אולי בעיה.</div>
          </div>
          <div class="mguide-kpi-card">
            <div class="lbl">ציון ועדה</div>
            <div class="big" style="color:#ffcc4d">78/100</div>
            <div class="exp">ממוצע משוקלל של 6 בדיקות. מעל 80 = Go, מתחת 60 = דחייה. Hard Stop פתוח = מקסימום 59.</div>
          </div>
        </div>

        <h3>💡 דוגמה מספרית מלאה</h3>
        <div class="mguide-ex">
          נניח שמצאת דירה:<br>
          <b>מחיר מבוקש:</b> 500,000 ₪<br>
          <b>שטח:</b> 50 מ"ר<br>
          <b>שכירות צפויה:</b> 2,500 ₪ לחודש<br><br>

          <b>תשואה שנתית</b> = שכירות × 12 / מחיר × 100<br>
          = 2,500 × 12 / 500,000 × 100 = <span class="result">6% ברוטו</span><br><br>

          <b>מחיר למ"ר</b> = מחיר / שטח<br>
          = 500,000 / 50 = <span class="result">₪10,000 למ"ר</span><br><br>

          <b>מה זה אומר?</b><br>
          6% תשואה = סביר עד טוב (מעל 7% = מצוין, מתחת 4% = חלש)<br>
          10,000 למ"ר = זול ביחס לקריות (ממוצע ~15,000) = שווה לבדוק למה
        </div>

        <h3>🚦 מתי Go ומתי No-Go?</h3>
        <div class="mguide-ex">
          <span style="color:#3ddc84;font-size:16px">🟢 Go</span> - ציון מעל 80, אין Hard Stop פתוח, מחיר נתמך בעסקאות דומות, יש אפסייד<br><br>
          <span style="color:#ffcc4d;font-size:16px">🟡 Go בתנאים</span> - ציון 70-79. להתקדם רק עם: הורדת מחיר, חוות דעת שמאי, או תנאי מתלה בחוזה<br><br>
          <span style="color:#ff6b6b;font-size:16px">🔴 No-Go</span> - ציון מתחת 60, או Hard Stop פתוח. דחייה עד שהבעיה נפתרת<br><br>
          <b>שאלת הזהב:</b> "איזה מידע חדש יגרום לי לשנות החלטה?" אם אין תשובה - חסר לך נתון קריטי.
        </div>
      </div>

      <div class="mguide-section">
        <h2>📖 מילון מושגים</h2>
        <div class="mguide-dict">
          <div class="mguide-term"><b>נסח טאבו</b><p>מסמך רשמי שמראה מי הבעלים של הנכס, אם יש חובות (שעבודים), עיקולים, או הערות אזהרה. כמו "תעודת זהות" של הדירה.</p></div>
          <div class="mguide-term"><b>תב"ע (תוכנית בניין עיר)</b><p>מסמך שקובע מה מותר לבנות על המגרש: כמה קומות, כמה מ"ר, ייעוד (מגורים/מסחר). תב"ע חדשה יכולה להעלות ערך.</p></div>
          <div class="mguide-term"><b>גוש וחלקה</b><p>מספרי זיהוי של הקרקע במרשם המקרקעין. כמו "כתובת רשמית" של הקרקע - צריך אותם לכל בדיקה.</p></div>
          <div class="mguide-term"><b>שעבוד</b><p>משכנתא או חוב שרשום על הנכס. אם הבעלים לא שילם - הבנק יכול לקחת את הדירה. חייב להיות נקי לפני קנייה.</p></div>
          <div class="mguide-term"><b>הערת אזהרה</b><p>רישום שמזהיר שמישהו טוען לזכויות על הנכס. יכולה להיות חיובית (שומרת על הקונה) או שלילית (סכסוך).</p></div>
          <div class="mguide-term"><b>Hard Stop</b><p>"דגל אדום" - בעיה כל כך חמורה שעוצרים הכל עד שהיא נפתרת. לדוגמה: צו הריסה, עיקול, בעלות לא ברורה.</p></div>
          <div class="mguide-term"><b>תשואה ברוטו</b><p>כמה הדירה מחזירה בשנה לפני הוצאות (ועד, תיקונים, מס). חישוב: שכירות × 12 / מחיר קנייה × 100.</p></div>
          <div class="mguide-term"><b>פינוי-בינוי</b><p>הורסים בניין ישן ובונים חדש. הדיירים מקבלים דירה חדשה + לפעמים כסף. יכול להכפיל את ערך ההשקעה.</p></div>
          <div class="mguide-term"><b>SWOT</b><p>מסגרת חשיבה: חוזקות (Strengths), חולשות (Weaknesses), הזדמנויות (Opportunities), איומים (Threats). עוזר לראות את התמונה המלאה.</p></div>
          <div class="mguide-term"><b>ARV (After Repair Value)</b><p>כמה הדירה תשווה אחרי שיפוץ. אם קונים ב-400K, משפצים ב-100K, ו-ARV = 650K, הרווח הפוטנציאלי = 150K.</p></div>
          <div class="mguide-term"><b>GovMap</b><p>מפה ממשלתית אינטראקטיבית שמראה ייעוד קרקע, תוכניות בנייה, תשתיות ותחבורה. כלי חובה לכל בדיקה.</p></div>
          <div class="mguide-term"><b>IRR (שיעור תשואה פנימי)</b><p>חישוב מתקדם שלוקח בחשבון את הזמן. אם השקעת 500K והרווחת 100K אחרי שנתיים - ה-IRR מביא בחשבון שהכסף היה "תקוע".</p></div>
        </div>
      </div>

      <div class="mguide-section">
        <h2>⚡ טיפים מהשטח</h2>
        <div class="mguide-ex">
          <b>1. תמיד תתחיל מנסח טאבו.</b> אם הרישום בעייתי - כל השאר לא רלוונטי.<br><br>
          <b>2. אל תסמוך על מילים.</b> כל טענה של מתווך או מוכר - בדוק במקור רשמי ורשום בראיות.<br><br>
          <b>3. שכירות - תמיד שמרני.</b> קח את השכירות הנמוכה שמצאת, לא הגבוהה. הפתעות תמיד כלפי מטה.<br><br>
          <b>4. אם יש Hard Stop אחד - עצור.</b> לא משנה כמה העסקה "מריחה טוב". פתור את הבעיה קודם.<br><br>
          <b>5. שאלת הזהב.</b> לפני כל החלטה שאל: "מה אני עדיין לא יודע?" אם יש משהו - לך לברר.
        </div>
      </div>

      <p style="text-align:center;color:#5f6f86;font-size:12px;margin:20px 0">מדריך ויזואלי · מאסטרו נדל"ן · v1.0 · 24.06.2026</p>
    </div>`;
  }

  function teardown(){
    MaestroCore.removeModule(MOD.id);
    document.querySelector('.mguide-btn')?.remove();
    document.querySelectorAll('.mtip').forEach(el=>el.remove());
  }

  if(window.MaestroCore) MaestroCore.register(MOD);
  else window.addEventListener('load', ()=> MaestroCore.register(MOD));
})();
