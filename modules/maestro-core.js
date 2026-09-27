/* maestro-core.js | v2.0.0 | 2026-06-23
   Module registry, version journal, rollback support.
   Loads first — all other modules register through this. */
window.MaestroCore = (function(){
  const VERSION = '2.0.0';
  const JOURNAL_KEY = 'maestro_journal';
  const MODULES_KEY = 'maestro_modules_state';
  const modules = {};

  function now(){ return new Date().toISOString(); }

  function journal(action, id, ver, detail){
    const arr = JSON.parse(localStorage.getItem(JOURNAL_KEY)||'[]');
    arr.push({ts:now(), action, id, ver, detail:detail||''});
    if(arr.length>500) arr.splice(0, arr.length-500);
    localStorage.setItem(JOURNAL_KEY, JSON.stringify(arr));
  }

  function modulesState(){
    return JSON.parse(localStorage.getItem(MODULES_KEY)||'{}');
  }
  function setModuleState(id, enabled){
    const s = modulesState();
    s[id] = enabled;
    localStorage.setItem(MODULES_KEY, JSON.stringify(s));
  }

  function register(mod){
    if(!mod||!mod.id) return;
    modules[mod.id] = mod;
    const state = modulesState();
    if(state[mod.id]===false){
      journal('skip-disabled', mod.id, mod.version);
      return;
    }
    journal('register', mod.id, mod.version);
    if(mod.init) mod.init();
  }

  function disable(id){
    const m = modules[id];
    if(!m) return;
    if(m.destroy) m.destroy();
    setModuleState(id, false);
    journal('disable', id, m.version);
  }

  function enable(id){
    const m = modules[id];
    if(!m) return;
    setModuleState(id, true);
    journal('enable', id, m.version);
    if(m.init) m.init();
  }

  function getJournal(){ return JSON.parse(localStorage.getItem(JOURNAL_KEY)||'[]'); }
  function clearJournal(){ localStorage.removeItem(JOURNAL_KEY); }

  function listModules(){
    return Object.values(modules).map(m=>({id:m.id, version:m.version, name:m.name, enabled: modulesState()[m.id]!==false}));
  }

  function injectCSS(id, css){
    let el = document.getElementById('mcss-'+id);
    if(el) el.remove();
    el = document.createElement('style');
    el.id = 'mcss-'+id;
    el.textContent = css;
    document.head.appendChild(el);
  }

  function injectHTML(id, html, target){
    let el = document.getElementById('mmod-'+id);
    if(el) el.remove();
    el = document.createElement('div');
    el.id = 'mmod-'+id;
    el.innerHTML = html;
    (target||document.body).appendChild(el);
    return el;
  }

  function removeModule(id){
    const css = document.getElementById('mcss-'+id);
    const html = document.getElementById('mmod-'+id);
    if(css) css.remove();
    if(html) html.remove();
  }

  journal('core-load', 'core', VERSION);

  return { VERSION, register, disable, enable, getJournal, clearJournal, listModules, injectCSS, injectHTML, removeModule, journal };
})();
