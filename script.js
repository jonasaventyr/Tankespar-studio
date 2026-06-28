const views=[...document.querySelectorAll('.view')];
const buttons=[...document.querySelectorAll('[data-view]')];
buttons.forEach(b=>b.addEventListener('click',()=>show(b.dataset.view)));
function show(id){views.forEach(v=>v.classList.toggle('active-view',v.id===id));document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===id));window.scrollTo({top:0,behavior:'smooth'});}
['focusInput','videoIdeas','talkIdeas','sources','vision','goals','ideas','income','costs'].forEach(id=>{const el=document.getElementById(id);if(!el)return;const saved=localStorage.getItem('ts_'+id);if(saved!==null)el.value=saved;el.addEventListener('input',()=>{localStorage.setItem('ts_'+id,el.value);calc();});});
let progress=Number(localStorage.getItem('ts_progress')||50);const bar=document.getElementById('focusBar');function draw(){bar.style.width=Math.min(progress,100)+'%';}draw();document.getElementById('focusDone').addEventListener('click',()=>{progress=Math.min(progress+10,100);localStorage.setItem('ts_progress',progress);draw();});
function calc(){const i=Number(document.getElementById('income').value||0),c=Number(document.getElementById('costs').value||0);document.getElementById('result').textContent=(i-c).toLocaleString('sv-SE');}calc();

// PWA: gör Tankespår Studio installationsbar och tillgänglig offline.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

let deferredInstallPrompt = null;
const installButtons = [document.getElementById('installApp'), document.getElementById('installAppHome')].filter(Boolean);
window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  installButtons.forEach(button => button.classList.remove('hidden'));
});
installButtons.forEach(button => button.addEventListener('click', async () => {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  installButtons.forEach(button => button.classList.add('hidden'));
}));
window.addEventListener('appinstalled', () => {
  localStorage.setItem('ts_app_installed', 'true');
  installButtons.forEach(button => button.classList.add('hidden'));
});
