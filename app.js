const views = [...document.querySelectorAll('.view')];
const navItems = [...document.querySelectorAll('.nav-item')];
const modalBackdrop = document.getElementById('modalBackdrop');
const modalTitle = document.getElementById('modalTitle');
const modalText = document.getElementById('modalText');
const modalIcon = document.getElementById('modalIcon');
const modalClose = document.getElementById('modalClose');
const modalOk = document.getElementById('modalOk');
const installBtn = document.getElementById('installBtn');
const themeBtn = document.getElementById('themeBtn');
const financeSheet = document.getElementById('financeSheet');
const financeForm = document.getElementById('financeForm');
const financeFormTitle = document.getElementById('financeFormTitle');
const financeFormFields = document.getElementById('financeFormFields');
const financeSheetClose = document.getElementById('financeSheetClose');
let deferredPrompt = null;
let currentFinanceAction = null;

const sectionData = {
  finance: { title: 'مالي', kicker: 'الشؤون المالية', icon: '💰', description: 'الدخل، المصروفات، الميزانية، الادخار، الالتزامات والديون والأهداف المالية.' },
  health: { title: 'صحتي', kicker: 'مشروع إنزال الوزن', icon: '🥗', description: 'تقييم البداية، الهدف، الخطة الغذائية، الوجبات والمشروبات والوزن والمتابعة الأسبوعية.' },
  religion: { title: 'ديني', kicker: 'المشاريع الدينية', icon: '🕌', description: 'القرآن، الأذكار، الصيام، التعلم، المواسم والمشاريع الدينية الشخصية.' },
  relationships: { title: 'علاقاتي', kicker: 'العلاقات الحقيقية', icon: '🤝', description: 'الأشخاص والدوائر الاجتماعية والتواصل والمناسبات والوعود والذكريات.' },
  family: { title: 'عائلتي', kicker: 'العائلة والذكريات', icon: '👨‍👩‍👧‍👦', description: 'شجرة العائلة، أفراد الأسرة، الذكريات والألبومات العائلية.' },
  knowledge: { title: 'معرفتي', kicker: 'التعلم والثقافة', icon: '🧠', description: 'حديث اليوم، مشروع الإنجليزية، الكتب، الملاحظات ومشاريع التعلم المستقبلية.' }
};

const FINANCE_KEY = 'hayati-finance-v1';
const TIMELINE_KEY = 'hayati-timeline-v1';
const emptyFinance = () => ({ monthlyIncome: 0, fixedExpenses: [], transactions: [], obligations: [], goals: [] });
let finance = loadJSON(FINANCE_KEY, emptyFinance());

function loadJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function saveFinance() { localStorage.setItem(FINANCE_KEY, JSON.stringify(finance)); renderFinance(); }
function addTimeline(title, meta='مالي', icon='💰') {
  const items = loadJSON(TIMELINE_KEY, []);
  items.unshift({ id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), title, meta, icon, at: new Date().toISOString() });
  localStorage.setItem(TIMELINE_KEY, JSON.stringify(items.slice(0, 200)));
  renderStory();
}

function showView(name) {
  views.forEach(v => v.classList.toggle('active', v.dataset.view === name));
  navItems.forEach(item => item.classList.toggle('active', item.dataset.nav === name));
  if (name === 'finance') renderFinance();
  if (name === 'story') renderStory();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openSection(key) {
  if (key === 'finance') { showView('finance'); navItems.forEach(i => i.classList.remove('active')); return; }
  const data = sectionData[key];
  if (!data) return;
  document.getElementById('sectionIcon').textContent = data.icon;
  document.getElementById('sectionKicker').textContent = data.kicker;
  document.getElementById('sectionTitle').textContent = data.title;
  document.getElementById('sectionDescription').textContent = data.description;
  showView('section');
  navItems.forEach(item => item.classList.remove('active'));
}

function openModal(title, text, icon='✓') {
  modalTitle.textContent = title; modalText.textContent = text; modalIcon.textContent = icon; modalBackdrop.hidden = false;
}
function closeModal() { modalBackdrop.hidden = true; }
function isIOS() { return /iphone|ipad|ipod/i.test(navigator.userAgent); }
function isStandalone() { return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true; }
async function installApp() {
  if (isStandalone()) return openModal('حياتي مثبت بالفعل', 'أنت تستخدم التطبيق من وضع الشاشة الرئيسية.', '✓');
  if (deferredPrompt) { deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt = null; return; }
  if (isIOS()) openModal('تثبيت حياتي على الآيفون', 'من Safari اضغط زر المشاركة، ثم اختر «إضافة إلى الشاشة الرئيسية / Add to Home Screen»، وبعدها «إضافة».', '📲');
  else openModal('تثبيت التطبيق', 'افتح قائمة المتصفح وابحث عن خيار Install app أو Add to Home Screen.', '📲');
}
function setTheme(theme) { document.documentElement.dataset.theme = theme; localStorage.setItem('hayati-theme', theme); themeBtn.textContent = theme === 'light' ? '☀' : '☾'; }
function toggleTheme() { setTheme(document.documentElement.dataset.theme === 'light' ? 'dark' : 'light'); }
function formatArabicDate() { try { return new Intl.DateTimeFormat('ar-BH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date()); } catch { return 'اليوم'; } }
function money(n) { return `${Number(n || 0).toLocaleString('ar-BH', {minimumFractionDigits:3, maximumFractionDigits:3})} د.ب`; }
function arabicDate(v) { if (!v) return 'بدون تاريخ'; try { return new Intl.DateTimeFormat('ar-BH',{day:'numeric',month:'short',year:'numeric'}).format(new Date(v+'T12:00:00')); } catch { return v; } }
function currentMonthKey(d=new Date()) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; }
function monthsUntil(dateStr) {
  if (!dateStr) return 1;
  const now = new Date(); const end = new Date(dateStr+'T12:00:00');
  const months = (end.getFullYear()-now.getFullYear())*12 + (end.getMonth()-now.getMonth()) + (end.getDate() >= now.getDate() ? 1 : 0);
  return Math.max(1, months);
}

function renderFinance() {
  const fixed = finance.fixedExpenses.reduce((s,x)=>s+Number(x.amount||0),0);
  const surplus = Number(finance.monthlyIncome||0) - fixed;
  const month = currentMonthKey();
  const monthTx = finance.transactions.filter(t => (t.date||'').slice(0,7) === month);
  const spent = monthTx.filter(t=>t.type==='expense').reduce((s,x)=>s+Number(x.amount||0),0);
  const extraIncome = monthTx.filter(t=>t.type==='income').reduce((s,x)=>s+Number(x.amount||0),0);
  const available = surplus + extraIncome - spent;
  const goalNeed = finance.goals.filter(g=>!g.done).reduce((s,g)=>s + Math.max(0, Number(g.target||0)-Number(g.saved||0))/monthsUntil(g.deadline),0);
  setText('finIncome', money(finance.monthlyIncome)); setText('finFixed',money(fixed)); setText('finSurplus',money(surplus)); setText('finSpent',money(spent)); setText('finAvailable',money(available)); setText('finGoalNeed',money(goalNeed));
  const pct = surplus > 0 ? Math.min(100, Math.max(0, spent/surplus*100)) : (spent>0?100:0);
  document.getElementById('finSpendBar').style.width = `${pct}%`; setText('finSpendPct', `${Math.round(pct).toLocaleString('ar-BH')}٪`);
  const status = document.getElementById('finGoalStatus');
  if (!finance.goals.length) status.textContent = 'أضف أهدافك المالية حتى تظهر الخطة الشهرية.';
  else if (surplus <= 0) status.textContent = 'لا يوجد فائض أساسي حاليًا لتغطية الأهداف. راجع الدخل والمصاريف الثابتة.';
  else if (goalNeed <= surplus) status.textContent = 'الفائض الشهري يغطي الاحتياج الشهري الحالي لجميع الأهداف النشطة.';
  else status.textContent = 'الفائض الحالي غير كافٍ لتغطية الاحتياج الكامل. بحسب القاعدة المعتمدة يجب أن يستمر التقدم في جميع الأهداف النشطة بدل تجميد بعضها.';

  renderList('fixedList', finance.fixedExpenses, x => financeRow(x.title, x.category||'مصروف ثابت', money(x.amount), 'expense', x.id, 'fixed'));
  const sortedTx = [...finance.transactions].sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  renderList('transactionList', sortedTx, x => financeRow(x.note||x.category|| (x.type==='income'?'دخل إضافي':'مصروف'), `${x.category||''} • ${arabicDate(x.date)}`, `${x.type==='income'?'+':'−'} ${money(x.amount)}`, x.type, x.id, 'transaction'));
  const sortedOb = [...finance.obligations].sort((a,b)=>(a.dueDate||'9999').localeCompare(b.dueDate||'9999'));
  renderList('obligationList', sortedOb, x => financeRow(x.title, `الاستحقاق: ${arabicDate(x.dueDate)}`, money(x.amount), 'expense', x.id, 'obligation'));
  const goals = document.getElementById('goalList'); goals.innerHTML='';
  if (!finance.goals.length) goals.innerHTML = emptyRow('لم تضف أهدافًا مالية بعد.');
  else finance.goals.forEach(g => {
    const remaining = Math.max(0, Number(g.target||0)-Number(g.saved||0)); const need = remaining/monthsUntil(g.deadline); const pctg = Number(g.target)>0 ? Math.min(100, Number(g.saved||0)/Number(g.target)*100) : 0;
    const el=document.createElement('div'); el.className='finance-row';
    el.innerHTML=`<div><div class="row-title">${escapeHTML(g.title)}</div><div class="row-meta">الهدف ${money(g.target)} • ${arabicDate(g.deadline)}</div></div><div class="row-amount income">${Math.round(pctg).toLocaleString('ar-BH')}٪</div><div class="goal-progress"><span style="width:${pctg}%"></span></div><div class="goal-detail"><span>المتبقي ${money(remaining)}</span><span>المطلوب شهريًا ${money(need)}</span></div><div class="row-actions"><button data-fin-delete="goal" data-id="${g.id}">حذف</button></div>`;
    goals.appendChild(el);
  });
}
function setText(id,v){ const el=document.getElementById(id); if(el) el.textContent=v; }
function renderList(id, items, rowFn){ const el=document.getElementById(id); el.innerHTML=''; if(!items.length){el.innerHTML=emptyRow('لا توجد بيانات بعد.');return;} items.forEach(x=>el.insertAdjacentHTML('beforeend',rowFn(x))); }
function emptyRow(text){ return `<div class="finance-empty">${text}</div>`; }
function financeRow(title, meta, amount, type, id, kind){ return `<div class="finance-row"><div><div class="row-title">${escapeHTML(title)}</div><div class="row-meta">${escapeHTML(meta)}</div></div><div class="row-amount ${type}">${amount}</div><div class="row-actions"><button data-fin-delete="${kind}" data-id="${id}">حذف</button></div></div>`; }
function escapeHTML(s=''){ return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }

function field(label,name,type='text',extra='') { return `<div class="form-field"><label for="ff-${name}">${label}</label><input id="ff-${name}" name="${name}" type="${type}" ${extra} required></div>`; }
function selectField(label,name,options){ return `<div class="form-field"><label for="ff-${name}">${label}</label><select id="ff-${name}" name="${name}">${options.map(o=>`<option value="${o}">${o}</option>`).join('')}</select></div>`; }
function openFinanceForm(action){
  currentFinanceAction=action; let title='', html=''; const today=new Date().toISOString().slice(0,10);
  if(action==='income'){ title='تحديث الدخل الشهري'; html=field('الدخل الشهري بالدينار البحريني','amount','number',`step="0.001" min="0" value="${finance.monthlyIncome||''}"`); }
  if(action==='expense'){ title='تسجيل مصروف'; html=field('المبلغ','amount','number','step="0.001" min="0"')+selectField('التصنيف','category',['طعام','مواصلات','فواتير','تسوق','منزل','ترفيه','صدقة','أخرى'])+field('ملاحظة','note','text','placeholder="اختياري"')+field('التاريخ','date','date',`value="${today}"`); }
  if(action==='extraIncome'){ title='تسجيل دخل إضافي'; html=field('المبلغ','amount','number','step="0.001" min="0"')+selectField('التصنيف','category',['دخل إضافي','مكافأة','هدية','استرداد','أخرى'])+field('ملاحظة','note','text','placeholder="اختياري"')+field('التاريخ','date','date',`value="${today}"`); }
  if(action==='fixed'){ title='إضافة مصروف ثابت'; html=field('اسم المصروف','title','text','placeholder="مثال: إيجار أو اشتراك"')+field('المبلغ الشهري','amount','number','step="0.001" min="0"')+selectField('التصنيف','category',['سكن','فواتير','قسط','اشتراك','مواصلات','أخرى']); }
  if(action==='obligation'){ title='إضافة التزام مالي'; html=field('اسم الالتزام','title','text','placeholder="مثال: قسط أو مبلغ مستحق"')+field('المبلغ','amount','number','step="0.001" min="0"')+field('تاريخ الاستحقاق','dueDate','date'); }
  if(action==='goal'){ title='إضافة هدف مالي'; html=field('اسم الهدف','title','text','placeholder="مثال: سداد دين أو سفر"')+field('مبلغ الهدف','target','number','step="0.001" min="0"')+field('المبلغ المحقق حاليًا','saved','number','step="0.001" min="0" value="0"')+field('موعد الإنجاز','deadline','date'); }
  financeFormTitle.textContent=title; financeFormFields.innerHTML=html; financeSheet.hidden=false;
}
function closeFinanceForm(){ financeSheet.hidden=true; currentFinanceAction=null; financeForm.reset(); }
function makeId(){ return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`; }
financeForm.addEventListener('submit',e=>{
  e.preventDefault(); const fd=Object.fromEntries(new FormData(financeForm).entries());
  if(currentFinanceAction==='income'){ finance.monthlyIncome=Number(fd.amount||0); addTimeline(`حدّثت الدخل الشهري إلى ${money(finance.monthlyIncome)}`); }
  if(currentFinanceAction==='expense'){ finance.transactions.push({id:makeId(),type:'expense',amount:Number(fd.amount),category:fd.category,note:fd.note,date:fd.date}); addTimeline(`سجلت مصروفًا بقيمة ${money(fd.amount)}`,fd.category,'💳'); }
  if(currentFinanceAction==='extraIncome'){ finance.transactions.push({id:makeId(),type:'income',amount:Number(fd.amount),category:fd.category,note:fd.note,date:fd.date}); addTimeline(`سجلت دخلًا إضافيًا بقيمة ${money(fd.amount)}`,fd.category,'💵'); }
  if(currentFinanceAction==='fixed'){ finance.fixedExpenses.push({id:makeId(),title:fd.title,amount:Number(fd.amount),category:fd.category}); addTimeline(`أضفت مصروفًا ثابتًا: ${fd.title}`); }
  if(currentFinanceAction==='obligation'){ finance.obligations.push({id:makeId(),title:fd.title,amount:Number(fd.amount),dueDate:fd.dueDate}); addTimeline(`أضفت التزامًا ماليًا: ${fd.title}`,'التزامات','🗓️'); }
  if(currentFinanceAction==='goal'){ finance.goals.push({id:makeId(),title:fd.title,target:Number(fd.target),saved:Number(fd.saved||0),deadline:fd.deadline,done:false}); addTimeline(`أنشأت هدفًا ماليًا: ${fd.title}`,'أهداف مالية','🎯'); }
  saveFinance(); closeFinanceForm();
});
financeSheetClose.addEventListener('click',closeFinanceForm);
financeSheet.addEventListener('click',e=>{if(e.target===financeSheet) closeFinanceForm();});

function deleteFinance(kind,id){
  const map={fixed:'fixedExpenses',transaction:'transactions',obligation:'obligations',goal:'goals'}; const key=map[kind]; if(!key)return;
  finance[key]=finance[key].filter(x=>x.id!==id); saveFinance();
}

function renderStory(){
  const view=document.getElementById('view-story'); const items=loadJSON(TIMELINE_KEY,[]);
  const old=view.querySelector('.story-live'); if(old) old.remove();
  const empty=view.querySelector('.empty-state');
  if(!items.length){ if(empty) empty.style.display=''; return; }
  if(empty) empty.style.display='none';
  const wrap=document.createElement('div'); wrap.className='timeline-preview story-live';
  items.slice(0,30).forEach(item=>{ const d=new Date(item.at); const time=new Intl.DateTimeFormat('ar-BH',{hour:'numeric',minute:'2-digit'}).format(d); wrap.insertAdjacentHTML('beforeend',`<div class="timeline-item"><span class="dot blue"></span><div><b>${escapeHTML(item.icon+' '+item.title)}</b><small>${escapeHTML(item.meta)} • ${time}</small></div></div>`); });
  view.appendChild(wrap);
}

document.addEventListener('click', (event) => {
  const nav = event.target.closest('[data-nav]'); if (nav) { showView(nav.dataset.nav); return; }
  const section = event.target.closest('[data-section]'); if (section && !event.target.closest('[data-action]')) { openSection(section.dataset.section); return; }
  const finAction=event.target.closest('[data-fin-action]'); if(finAction){ openFinanceForm(finAction.dataset.finAction); return; }
  const finTab=event.target.closest('[data-fin-tab]'); if(finTab){ document.querySelectorAll('[data-fin-tab]').forEach(x=>x.classList.toggle('active',x===finTab)); document.querySelectorAll('[data-fin-panel]').forEach(x=>x.classList.toggle('active',x.dataset.finPanel===finTab.dataset.finTab)); return; }
  const finDel=event.target.closest('[data-fin-delete]'); if(finDel){ if(confirm('حذف هذا العنصر؟')) deleteFinance(finDel.dataset.finDelete,finDel.dataset.id); return; }
  const action = event.target.closest('[data-action]');
  if (action) {
    if(action.dataset.action==='expense'){ showView('finance'); navItems.forEach(i=>i.classList.remove('active')); openFinanceForm('expense'); return; }
    const labels = {
      meal: ['تسجيل وجبة', 'سيُبنى هذا الإجراء داخل قسم «صحتي» في المرحلة التالية. تحليل الصورة بالذكاء الاصطناعي لاحقًا.', '🍲'],
      weight: ['تسجيل الوزن', 'سيُضاف سجل الوزن ومتوسط 7 أيام عند بناء مشروع إنزال الوزن.', '⚖️'],
      contact: ['تسجيل تواصل', 'سيُبنى هذا الإجراء داخل قسم «علاقاتي».', '☎️'],
      reading: ['تسجيل قراءة', 'سيُبنى هذا الإجراء داخل قسم «معرفتي».', '📚'],
      note: ['إضافة ملاحظة', 'ستدخل الملاحظة لاحقًا في «قصتي اليوم» والـTimeline.', '✍️'],
      learn: ['مشروع الإنجليزية', 'سيتم بناء اختبار المستوى والخطة الأسبوعية والاختبار الأسبوعي في «معرفتي».', '📘'],
      religion: ['المشروع الديني', 'سيتم بناء المشاريع الدينية والقرآن والأذكار والتذكيرات تدريجيًا.', '🕌']
    };
    const [title, text, icon] = labels[action.dataset.action] || ['قريبًا', 'سيتم بناء هذه الميزة في قسمها.', '✓']; openModal(title, text, icon);
  }
});

document.getElementById('sectionBack').addEventListener('click', () => showView('domains'));
document.getElementById('sectionAction').addEventListener('click', () => showView('today'));
modalClose.addEventListener('click', closeModal); modalOk.addEventListener('click', closeModal); modalBackdrop.addEventListener('click', (e) => { if (e.target === modalBackdrop) closeModal(); });
installBtn.addEventListener('click', installApp); document.getElementById('settingInstall').addEventListener('click', installApp); themeBtn.addEventListener('click', toggleTheme); document.getElementById('settingTheme').addEventListener('click', toggleTheme);
window.addEventListener('beforeinstallprompt', (event) => { event.preventDefault(); deferredPrompt = event; });
const savedTheme = localStorage.getItem('hayati-theme'); setTheme(savedTheme || 'dark'); document.getElementById('todayDate').textContent = formatArabicDate(); renderFinance(); renderStory();
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js').catch(() => {}));
