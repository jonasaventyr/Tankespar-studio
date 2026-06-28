const qs = (s, root=document) => root.querySelector(s);
const qsa = (s, root=document) => [...root.querySelectorAll(s)];
const store = {
  get(key, fallback='') { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } },
  set(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
};

function showView(viewId){
  qsa('.view').forEach(v => v.classList.toggle('active-view', v.id === viewId));
  qsa('[data-view]').forEach(b => b.classList.toggle('active', b.dataset.view === viewId));
  if(viewId === 'tankefangare') setTimeout(() => qs('#thoughtText')?.focus(), 80);
}
qsa('[data-view]').forEach(btn => btn.addEventListener('click', () => showView(btn.dataset.view)));

// Enkel lokal lagring för textfält
['focusInput','videoIdeas','talkIdeas','sources','vision','goals','ideas'].forEach(id => {
  const el = qs('#'+id); if(!el) return;
  el.value = store.get('ts_'+id, el.value || '');
  el.addEventListener('input', () => store.set('ts_'+id, el.value));
});

let focusProgress = store.get('ts_focusProgress', 0);
function renderFocus(){ qs('#focusBar').style.width = Math.min(focusProgress,100)+'%'; }
qs('#focusDone')?.addEventListener('click', () => { focusProgress = Math.min(100, focusProgress + 20); store.set('ts_focusProgress', focusProgress); renderFocus(); });
renderFocus();

function updateBudget(){
  const income = Number(qs('#income')?.value || 0); const costs = Number(qs('#costs')?.value || 0);
  const result = qs('#result'); if(result) result.textContent = (income - costs).toLocaleString('sv-SE');
}
['income','costs'].forEach(id => qs('#'+id)?.addEventListener('input', updateBudget)); updateBudget();

// Tankefångaren
const THOUGHT_KEY = 'ts_thoughts_v1';
function getThoughts(){ return store.get(THOUGHT_KEY, []); }
function setThoughts(thoughts){ store.set(THOUGHT_KEY, thoughts); renderThoughts(); }
function formatDate(iso){ return new Date(iso).toLocaleString('sv-SE', { dateStyle:'short', timeStyle:'short' }); }

function renderThoughts(){
  const thoughts = getThoughts();
  const countHome = qs('#thoughtCountHome'); if(countHome) countHome.textContent = thoughts.length;
  const list = qs('#thoughtList'); if(!list) return;
  const filter = qs('#thoughtFilter')?.value || 'Alla';
  const filtered = filter === 'Alla' ? thoughts : thoughts.filter(t => t.category === filter);
  if(!filtered.length){ list.innerHTML = '<p class="empty">Inga tankar här än. Fånga första gnistan.</p>'; return; }
  list.innerHTML = filtered.map(t => `
    <article class="thought" data-id="${t.id}">
      <div class="thought-meta"><span>${formatDate(t.createdAt)}</span><span class="badge">${escapeHtml(t.category)}</span></div>
      <p>${escapeHtml(t.text)}</p>
      <div class="thought-actions">
        <button data-copy="${t.id}">Kopiera</button>
        <button data-delete="${t.id}" class="danger">Ta bort</button>
      </div>
    </article>`).join('');
}
function escapeHtml(str){ return String(str).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }

qs('#saveThought')?.addEventListener('click', () => {
  const textEl = qs('#thoughtText'); const text = textEl.value.trim();
  if(!text){ textEl.focus(); return; }
  const thought = { id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), text, category: qs('#thoughtCategory').value, createdAt: new Date().toISOString() };
  setThoughts([thought, ...getThoughts()]);
  textEl.value = ''; qs('#thoughtCategory').value = 'Osorterad'; textEl.focus();
});
qs('#thoughtText')?.addEventListener('keydown', (e) => {
  if((e.ctrlKey || e.metaKey) && e.key === 'Enter'){ qs('#saveThought').click(); }
});
qs('#thoughtFilter')?.addEventListener('change', renderThoughts);
qs('#thoughtList')?.addEventListener('click', async (e) => {
  const del = e.target.closest('[data-delete]'); const copy = e.target.closest('[data-copy]');
  if(del){ setThoughts(getThoughts().filter(t => t.id !== del.dataset.delete)); }
  if(copy){ const t = getThoughts().find(x => x.id === copy.dataset.copy); if(t) await navigator.clipboard?.writeText(t.text); }
});
qs('#clearThoughts')?.addEventListener('click', () => {
  if(confirm('Vill du rensa alla sparade tankar i den här webbläsaren?')) setThoughts([]);
});
qs('#exportThoughts')?.addEventListener('click', () => {
  const thoughts = getThoughts();
  const content = thoughts.map(t => `# ${formatDate(t.createdAt)} – ${t.category}\n${t.text}\n`).join('\n---\n\n');
  const blob = new Blob([content || 'Inga tankar sparade.'], {type:'text/plain;charset=utf-8'});
  const url = URL.createObjectURL(blob); const a = document.createElement('a');
  a.href = url; a.download = 'tankefangaren-export.txt'; a.click(); URL.revokeObjectURL(url);
});
renderThoughts();

// PWA-installation
let deferredPrompt;
const installButtons = [qs('#installApp'), qs('#installAppHome')].filter(Boolean);
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredPrompt = e; installButtons.forEach(b => b.classList.remove('hidden')); });
installButtons.forEach(btn => btn.addEventListener('click', async () => { if(!deferredPrompt) return; deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt = null; installButtons.forEach(b => b.classList.add('hidden')); }));
if('serviceWorker' in navigator){ window.addEventListener('load', () => navigator.serviceWorker.register('service-worker.js').catch(()=>{})); }
