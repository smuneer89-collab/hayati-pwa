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

const domainSheet = document.getElementById('domainSheet');
const domainForm = document.getElementById('domainForm');
const domainFormKicker = document.getElementById('domainFormKicker');
const domainFormTitle = document.getElementById('domainFormTitle');
const domainFormFields = document.getElementById('domainFormFields');
const domainSheetClose = document.getElementById('domainSheetClose');

let deferredPrompt = null;
let currentFinanceAction = null;
let currentDomainAction = null;

const sectionData = {
  finance: { title: 'مالي', kicker: 'الشؤون المالية', icon: '💰', description: 'الدخل، المصروفات، الميزانية، الادخار، الالتزامات والديون والأهداف المالية.' },
  health: { title: 'صحتي', kicker: 'مشروع إنزال الوزن', icon: '🥗', description: 'تقييم البداية، الهدف، الخطة الغذائية، الوجبات والمشروبات والوزن والمتابعة الأسبوعية.' },
  religion: { title: 'ديني', kicker: 'المشاريع الدينية', icon: '🕌', description: 'القرآن، الأذكار، الصيام، التعلم، المواسم والمشاريع الدينية الشخصية.' },
  relationships: { title: 'علاقاتي', kicker: 'العلاقات الحقيقية', icon: '🤝', description: 'الأشخاص والدوائر الاجتماعية والتواصل والمناسبات والوعود والذكريات.' },
  family: { title: 'عائلتي', kicker: 'العائلة والذكريات', icon: '👨‍👩‍👧‍👦', description: 'شجرة العائلة، أفراد الأسرة، الذكريات والألبومات العائلية.' },
  knowledge: { title: 'معرفتي', kicker: 'التعلم والثقافة', icon: '🧠', description: 'حديث اليوم، مشروع الإنجليزية، الكتب، الملاحظات ومشاريع التعلم المستقبلية.' }
};

const FINANCE_KEY = 'hayati-finance-v1';
const HEALTH_KEY = 'hayati-health-v1';
const RELIGION_KEY = 'hayati-religion-v1';
const KNOWLEDGE_KEY = 'hayati-knowledge-v1';
const TIMELINE_KEY = 'hayati-timeline-v1';

const emptyFinance = () => ({ monthlyIncome: 0, fixedExpenses: [], transactions: [], obligations: [], goals: [] });
const emptyHealth = () => ({
  profile: { startWeight: 0, height: 0, age: 0, sex: '', activity: '', targetWeight: 0, targetDate: '', dailyCalories: 0, waterTarget: 2000 },
  weights: [], meals: [], drinks: [], water: []
});
const emptyReligion = () => ({
  projects: [],
  quran: { mode: 'قراءة', lastPosition: '', dailyTarget: '', note: '' },
  adhkar: [],
  fasting: []
});
const emptyKnowledge = () => ({
  hadiths: [],
  english: { level: '', goal: '', weeklyExamDay: '', tasks: [], tests: [] },
  books: [],
  projects: [{ id: 'english-project', title: 'تطوير اللغة الإنجليزية', status: 'أتعلمه الآن', note: 'المشروع التعليمي النشط حاليًا.' }]
});

let finance = loadJSON(FINANCE_KEY, emptyFinance());
let health = loadJSON(HEALTH_KEY, emptyHealth());
let religion = loadJSON(RELIGION_KEY, emptyReligion());
let knowledge = loadJSON(KNOWLEDGE_KEY, emptyKnowledge());

function loadJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function saveFinance() { localStorage.setItem(FINANCE_KEY, JSON.stringify(finance)); renderFinance(); renderDashboard(); }
function saveHealth() { localStorage.setItem(HEALTH_KEY, JSON.stringify(health)); renderHealth(); renderDashboard(); }
function saveReligion() { localStorage.setItem(RELIGION_KEY, JSON.stringify(religion)); renderReligion(); renderDashboard(); }
function saveKnowledge() { localStorage.setItem(KNOWLEDGE_KEY, JSON.stringify(knowledge)); renderKnowledge(); renderDashboard(); }
function saveTimeline(items) { localStorage.setItem(TIMELINE_KEY, JSON.stringify(items.slice(0, 300))); }
function addTimeline(title, meta='حياتي', icon='✓') {
  const items = loadJSON(TIMELINE_KEY, []);
  items.unshift({ id: makeId(), title, meta, icon, at: new Date().toISOString() });
  saveTimeline(items);
  renderStory();
}

function showView(name) {
  views.forEach(v => v.classList.toggle('active', v.dataset.view === name));
  navItems.forEach(item => item.classList.toggle('active', item.dataset.nav === name));
  if (name === 'finance') renderFinance();
  if (name === 'health') renderHealth();
  if (name === 'religion') renderReligion();
  if (name === 'knowledge') renderKnowledge();
  if (name === 'story') renderStory();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openSection(key) {
  if (['finance','health','religion','knowledge'].includes(key)) {
    showView(key);
    navItems.forEach(i => i.classList.remove('active'));
    return;
  }
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
  modalTitle.textContent = title;
  modalText.textContent = text;
  modalIcon.textContent = icon;
  modalBackdrop.hidden = false;
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
function todayKey() { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function currentMonthKey(d=new Date()) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; }
function monthsUntil(dateStr) {
  if (!dateStr) return 1;
  const now = new Date(); const end = new Date(dateStr+'T12:00:00');
  const months = (end.getFullYear()-now.getFullYear())*12 + (end.getMonth()-now.getMonth()) + (end.getDate() >= now.getDate() ? 1 : 0);
  return Math.max(1, months);
}
function setText(id,v){ const el=document.getElementById(id); if(el) el.textContent=v; }
function escapeHTML(s=''){ return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function makeId(){ return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`; }
function emptyRow(text){ return `<div class="finance-empty">${escapeHTML(text)}</div>`; }
function renderList(id, items, rowFn, empty='لا توجد بيانات بعد.') { const el=document.getElementById(id); if(!el) return; el.innerHTML=''; if(!items.length){el.innerHTML=emptyRow(empty);return;} items.forEach(x=>el.insertAdjacentHTML('beforeend',rowFn(x))); }
function field(label,name,type='text',extra='') { return `<div class="form-field"><label for="ff-${name}">${label}</label><input id="ff-${name}" name="${name}" type="${type}" ${extra} required></div>`; }
function optionalField(label,name,type='text',extra='') { return `<div class="form-field"><label for="ff-${name}">${label}</label><input id="ff-${name}" name="${name}" type="${type}" ${extra}></div>`; }
function textareaField(label,name,extra='') { return `<div class="form-field"><label for="ff-${name}">${label}</label><textarea id="ff-${name}" name="${name}" ${extra}></textarea></div>`; }
function selectField(label,name,options,selected=''){ return `<div class="form-field"><label for="ff-${name}">${label}</label><select id="ff-${name}" name="${name}">${options.map(o=>`<option value="${escapeHTML(o)}" ${o===selected?'selected':''}>${escapeHTML(o)}</option>`).join('')}</select></div>`; }
function checkboxField(label,name,checked=false){ return `<label class="check-field"><input type="checkbox" name="${name}" ${checked?'checked':''}><span>${label}</span></label>`; }

// ---------------- Finance ----------------
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
  const spendBar=document.getElementById('finSpendBar'); if(spendBar) spendBar.style.width = `${pct}%`; setText('finSpendPct', `${Math.round(pct).toLocaleString('ar-BH')}٪`);
  const status = document.getElementById('finGoalStatus');
  if (status) {
    if (!finance.goals.length) status.textContent = 'أضف أهدافك المالية حتى تظهر الخطة الشهرية.';
    else if (surplus <= 0) status.textContent = 'لا يوجد فائض أساسي حاليًا لتغطية الأهداف. راجع الدخل والمصاريف الثابتة.';
    else if (goalNeed <= surplus) status.textContent = 'الفائض الشهري يغطي الاحتياج الشهري الحالي لجميع الأهداف النشطة.';
    else status.textContent = 'الفائض الحالي غير كافٍ لتغطية الاحتياج الكامل. بحسب القاعدة المعتمدة يجب أن يستمر التقدم في جميع الأهداف النشطة بدل تجميد بعضها.';
  }
  renderList('fixedList', finance.fixedExpenses, x => financeRow(x.title, x.category||'مصروف ثابت', money(x.amount), 'expense', x.id, 'fixed'));
  const sortedTx = [...finance.transactions].sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  renderList('transactionList', sortedTx, x => financeRow(x.note||x.category|| (x.type==='income'?'دخل إضافي':'مصروف'), `${x.category||''} • ${arabicDate(x.date)}`, `${x.type==='income'?'+':'−'} ${money(x.amount)}`, x.type, x.id, 'transaction'));
  const sortedOb = [...finance.obligations].sort((a,b)=>(a.dueDate||'9999').localeCompare(b.dueDate||'9999'));
  renderList('obligationList', sortedOb, x => financeRow(x.title, `الاستحقاق: ${arabicDate(x.dueDate)}`, money(x.amount), 'expense', x.id, 'obligation'));
  const goals = document.getElementById('goalList'); if(!goals) return; goals.innerHTML='';
  if (!finance.goals.length) goals.innerHTML = emptyRow('لم تضف أهدافًا مالية بعد.');
  else finance.goals.forEach(g => {
    const remaining = Math.max(0, Number(g.target||0)-Number(g.saved||0)); const need = remaining/monthsUntil(g.deadline); const pctg = Number(g.target)>0 ? Math.min(100, Number(g.saved||0)/Number(g.target)*100) : 0;
    const el=document.createElement('div'); el.className='finance-row';
    el.innerHTML=`<div><div class="row-title">${escapeHTML(g.title)}</div><div class="row-meta">الهدف ${money(g.target)} • ${arabicDate(g.deadline)}</div></div><div class="row-amount income">${Math.round(pctg).toLocaleString('ar-BH')}٪</div><div class="goal-progress"><span style="width:${pctg}%"></span></div><div class="goal-detail"><span>المتبقي ${money(remaining)}</span><span>المطلوب شهريًا ${money(need)}</span></div><div class="row-actions"><button data-fin-delete="goal" data-id="${g.id}">حذف</button></div>`;
    goals.appendChild(el);
  });
}
function financeRow(title, meta, amount, type, id, kind){ return `<div class="finance-row"><div><div class="row-title">${escapeHTML(title)}</div><div class="row-meta">${escapeHTML(meta)}</div></div><div class="row-amount ${type}">${amount}</div><div class="row-actions"><button data-fin-delete="${kind}" data-id="${id}">حذف</button></div></div>`; }
function openFinanceForm(action){
  currentFinanceAction=action; let title='', html=''; const today=todayKey();
  if(action==='income'){ title='تحديث الدخل الشهري'; html=field('الدخل الشهري بالدينار البحريني','amount','number',`step="0.001" min="0" value="${finance.monthlyIncome||''}"`); }
  if(action==='expense'){ title='تسجيل مصروف'; html=field('المبلغ','amount','number','step="0.001" min="0"')+selectField('التصنيف','category',['طعام','مواصلات','فواتير','تسوق','منزل','ترفيه','صدقة','أخرى'])+optionalField('ملاحظة','note','text','placeholder="اختياري"')+field('التاريخ','date','date',`value="${today}"`); }
  if(action==='extraIncome'){ title='تسجيل دخل إضافي'; html=field('المبلغ','amount','number','step="0.001" min="0"')+selectField('التصنيف','category',['دخل إضافي','مكافأة','هدية','استرداد','أخرى'])+optionalField('ملاحظة','note','text','placeholder="اختياري"')+field('التاريخ','date','date',`value="${today}"`); }
  if(action==='fixed'){ title='إضافة مصروف ثابت'; html=field('اسم المصروف','title','text','placeholder="مثال: إيجار أو اشتراك"')+field('المبلغ الشهري','amount','number','step="0.001" min="0"')+selectField('التصنيف','category',['سكن','فواتير','قسط','اشتراك','مواصلات','أخرى']); }
  if(action==='obligation'){ title='إضافة التزام مالي'; html=field('اسم الالتزام','title','text','placeholder="مثال: قسط أو مبلغ مستحق"')+field('المبلغ','amount','number','step="0.001" min="0"')+field('تاريخ الاستحقاق','dueDate','date'); }
  if(action==='goal'){ title='إضافة هدف مالي'; html=field('اسم الهدف','title','text','placeholder="مثال: سداد دين أو سفر"')+field('مبلغ الهدف','target','number','step="0.001" min="0"')+field('المبلغ المحقق حاليًا','saved','number','step="0.001" min="0" value="0"')+field('موعد الإنجاز','deadline','date'); }
  financeFormTitle.textContent=title; financeFormFields.innerHTML=html; financeSheet.hidden=false;
}
function closeFinanceForm(){ financeSheet.hidden=true; currentFinanceAction=null; financeForm.reset(); }
function deleteFinance(kind,id){ const map={fixed:'fixedExpenses',transaction:'transactions',obligation:'obligations',goal:'goals'}; const key=map[kind]; if(!key)return; finance[key]=finance[key].filter(x=>x.id!==id); saveFinance(); }
financeForm.addEventListener('submit',e=>{
  e.preventDefault(); const fd=Object.fromEntries(new FormData(financeForm).entries());
  if(currentFinanceAction==='income'){ finance.monthlyIncome=Number(fd.amount||0); addTimeline(`حدّثت الدخل الشهري إلى ${money(finance.monthlyIncome)}`,'مالي','💰'); }
  if(currentFinanceAction==='expense'){ finance.transactions.push({id:makeId(),type:'expense',amount:Number(fd.amount),category:fd.category,note:fd.note,date:fd.date}); addTimeline(`سجلت مصروفًا بقيمة ${money(fd.amount)}`,fd.category,'💳'); }
  if(currentFinanceAction==='extraIncome'){ finance.transactions.push({id:makeId(),type:'income',amount:Number(fd.amount),category:fd.category,note:fd.note,date:fd.date}); addTimeline(`سجلت دخلًا إضافيًا بقيمة ${money(fd.amount)}`,fd.category,'💵'); }
  if(currentFinanceAction==='fixed'){ finance.fixedExpenses.push({id:makeId(),title:fd.title,amount:Number(fd.amount),category:fd.category}); addTimeline(`أضفت مصروفًا ثابتًا: ${fd.title}`,'مالي','📌'); }
  if(currentFinanceAction==='obligation'){ finance.obligations.push({id:makeId(),title:fd.title,amount:Number(fd.amount),dueDate:fd.dueDate}); addTimeline(`أضفت التزامًا ماليًا: ${fd.title}`,'التزامات','🗓️'); }
  if(currentFinanceAction==='goal'){ finance.goals.push({id:makeId(),title:fd.title,target:Number(fd.target),saved:Number(fd.saved||0),deadline:fd.deadline,done:false}); addTimeline(`أنشأت هدفًا ماليًا: ${fd.title}`,'أهداف مالية','🎯'); }
  saveFinance(); closeFinanceForm();
});
financeSheetClose.addEventListener('click',closeFinanceForm);
financeSheet.addEventListener('click',e=>{if(e.target===financeSheet) closeFinanceForm();});

// ---------------- Generic sheet ----------------
function openDomainForm(kicker,title,html,action){ currentDomainAction=action; domainFormKicker.textContent=kicker; domainFormTitle.textContent=title; domainFormFields.innerHTML=html; domainSheet.hidden=false; }
function closeDomainForm(){ domainSheet.hidden=true; currentDomainAction=null; domainForm.reset(); }
domainSheetClose.addEventListener('click',closeDomainForm);
domainSheet.addEventListener('click',e=>{if(e.target===domainSheet) closeDomainForm();});

// ---------------- Health ----------------
function healthTodayCalories(){ const t=todayKey(); return health.meals.filter(x=>x.date===t).reduce((s,x)=>s+Number(x.calories||0),0)+health.drinks.filter(x=>x.date===t).reduce((s,x)=>s+Number(x.calories||0),0); }
function healthTodayWater(){ const t=todayKey(); return health.water.filter(x=>x.date===t).reduce((s,x)=>s+Number(x.ml||0),0); }
function latestWeightRecord(){ return [...health.weights].sort((a,b)=>(b.date||'').localeCompare(a.date||''))[0] || null; }
function bmiValue(){ const w=latestWeightRecord()?.weight || health.profile.startWeight; const h=Number(health.profile.height||0)/100; return w>0&&h>0 ? w/(h*h) : 0; }
function avg7Weight(){ const cut=new Date(); cut.setDate(cut.getDate()-6); const items=health.weights.filter(x=>new Date(x.date+'T12:00:00')>=cut); if(!items.length)return 0; return items.reduce((s,x)=>s+Number(x.weight||0),0)/items.length; }
function renderHealth(){
  const latest=latestWeightRecord(); const current=latest?.weight || health.profile.startWeight || 0; const target=Number(health.profile.targetWeight||0); const caloriesGoal=Number(health.profile.dailyCalories||0); const consumed=healthTodayCalories(); const left=Math.max(0,caloriesGoal-consumed); const water=healthTodayWater(); const waterGoal=Number(health.profile.waterTarget||0);
  setText('healthCurrentWeight', current?`${Number(current).toLocaleString('ar-BH',{maximumFractionDigits:1})} كجم`:'— كجم');
  setText('healthTargetWeight', target?`${target.toLocaleString('ar-BH',{maximumFractionDigits:1})} كجم`:'— كجم');
  setText('healthCaloriesLeft', caloriesGoal?`${left.toLocaleString('ar-BH')} سعرة`:'—');
  setText('healthWaterToday', `${water.toLocaleString('ar-BH')} مل`);
  const configured=Number(health.profile.startWeight)>0;
  setText('healthProjectTitle', configured?'مشروع إنزال الوزن نشط':'ابدأ مشروع إنزال الوزن');
  const bmi=bmiValue();
  setText('healthProjectSummary', configured?`من ${health.profile.startWeight} كجم إلى ${health.profile.targetWeight||'—'} كجم • BMI مبدئي ${bmi?bmi.toFixed(1):'—'} • الهدف ${health.profile.targetDate?arabicDate(health.profile.targetDate):'بدون موعد'}`:'أدخل بيانات البداية والهدف لتظهر لك لوحة متابعة يومية.');
  setText('healthCaloriesSummary', caloriesGoal?`${consumed.toLocaleString('ar-BH')} / ${caloriesGoal.toLocaleString('ar-BH')}`:'لم تحدد');
  const cpct=caloriesGoal?Math.min(100,consumed/caloriesGoal*100):0; const cb=document.getElementById('healthCaloriesBar'); if(cb)cb.style.width=`${cpct}%`; setText('healthCaloriesPct',`${Math.round(cpct).toLocaleString('ar-BH')}٪`);
  setText('healthWaterGoalText',`${water.toLocaleString('ar-BH')} / ${waterGoal.toLocaleString('ar-BH')} مل`); const wpct=waterGoal?Math.min(100,water/waterGoal*100):0; const wb=document.getElementById('healthWaterBar'); if(wb)wb.style.width=`${wpct}%`;
  const today=todayKey(); const combined=[...health.meals.filter(x=>x.date===today).map(x=>({...x,kind:'meal'})),...health.drinks.filter(x=>x.date===today).map(x=>({...x,kind:'drink'}))].sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||''));
  renderList('healthTodayList',combined,x=>`<div class="domain-row"><div><b>${escapeHTML((x.kind==='drink'?'🥤 ':'🍲 ')+(x.name||x.type||'عنصر'))}</b><small>${escapeHTML(x.type||'')} ${x.sugar?`• سكر ${x.sugar}غ`:''}</small></div><strong>${Number(x.calories||0).toLocaleString('ar-BH')} سعرة</strong><button class="row-delete" data-health-delete="${x.kind}" data-id="${x.id}">حذف</button></div>`,'لا توجد وجبات أو مشروبات مسجلة اليوم.');
  const weights=[...health.weights].sort((a,b)=>(b.date||'').localeCompare(a.date||'')); const avg=avg7Weight(); const change=current&&health.profile.startWeight?current-Number(health.profile.startWeight):0;
  setText('healthLatestWeight',current?`${current.toLocaleString('ar-BH',{maximumFractionDigits:1})} كجم`:'—'); setText('healthAvg7',avg?`${avg.toLocaleString('ar-BH',{maximumFractionDigits:1})} كجم`:'—'); setText('healthChange',current&&health.profile.startWeight?`${change>0?'+':''}${change.toLocaleString('ar-BH',{maximumFractionDigits:1})} كجم`:'—');
  renderList('healthWeightList',weights,x=>`<div class="domain-row"><div><b>⚖️ ${Number(x.weight).toLocaleString('ar-BH',{maximumFractionDigits:1})} كجم</b><small>${arabicDate(x.date)}</small></div><button class="row-delete" data-health-delete="weight" data-id="${x.id}">حذف</button></div>`,'لم تسجل وزنًا بعد.');
  const pg=document.getElementById('healthProfileGrid'); if(pg){ const p=health.profile; pg.innerHTML=[['وزن البداية',p.startWeight?`${p.startWeight} كجم`:'—'],['الطول',p.height?`${p.height} سم`:'—'],['العمر',p.age||'—'],['النشاط',p.activity||'—'],['السعرات اليومية',p.dailyCalories?`${p.dailyCalories} سعرة`:'—'],['هدف الماء',p.waterTarget?`${p.waterTarget} مل`:'—']].map(([a,b])=>`<div><span>${a}</span><b>${escapeHTML(b)}</b></div>`).join(''); }
}
function openHealthForm(action){ const p=health.profile; const today=todayKey();
  if(action==='setup') return openDomainForm('صحتي','إعداد مشروع إنزال الوزن',field('وزن البداية (كجم)','startWeight','number',`step="0.1" min="1" value="${p.startWeight||''}"`)+field('الطول (سم)','height','number',`step="0.1" min="50" value="${p.height||''}"`)+field('العمر','age','number',`min="1" value="${p.age||''}"`)+selectField('الجنس','sex',['ذكر','أنثى','أفضل عدم التحديد'],p.sex)+selectField('مستوى النشاط','activity',['قليل','خفيف','متوسط','عالٍ'],p.activity)+field('الوزن المستهدف (كجم)','targetWeight','number',`step="0.1" min="1" value="${p.targetWeight||''}"`)+optionalField('موعد الهدف','targetDate','date',`value="${p.targetDate||''}"`)+field('ميزانية السعرات اليومية','dailyCalories','number',`min="1" value="${p.dailyCalories||''}"`)+field('هدف الماء اليومي (مل)','waterTarget','number',`step="50" min="250" value="${p.waterTarget||2000}"`),'health:setup');
  if(action==='weight') return openDomainForm('صحتي','تسجيل الوزن',field('الوزن (كجم)','weight','number','step="0.1" min="1"')+field('التاريخ','date','date',`value="${today}"`),'health:weight');
  if(action==='meal') return openDomainForm('صحتي','تسجيل وجبة',field('اسم الوجبة','name','text','placeholder="مثال: مجبوس دجاج"')+selectField('النوع','type',['فطور','غداء','عشاء','سناك','أخرى'])+field('السعرات التقديرية','calories','number','min="0"')+optionalField('ملاحظة','note','text','placeholder="الكمية أو مكونات مهمة"')+field('التاريخ','date','date',`value="${today}"`),'health:meal');
  if(action==='drink') return openDomainForm('صحتي','تسجيل مشروب',field('اسم المشروب','name','text','placeholder="مثال: قهوة بالحليب"')+field('السعرات','calories','number','min="0" value="0"')+optionalField('السكر بالجرام','sugar','number','step="0.1" min="0" placeholder="اختياري"')+field('التاريخ','date','date',`value="${today}"`),'health:drink');
  if(action==='water') return openDomainForm('صحتي','إضافة ماء',field('الكمية بالمل','ml','number','step="50" min="50" value="250"')+field('التاريخ','date','date',`value="${today}"`),'health:water');
}
function deleteHealth(kind,id){ const map={meal:'meals',drink:'drinks',weight:'weights',water:'water'}; const key=map[kind]; if(!key)return; health[key]=health[key].filter(x=>x.id!==id); saveHealth(); }

// ---------------- Religion ----------------
function renderReligion(){
  const active=religion.projects.filter(x=>x.status!=='مكتمل'); setText('religionProjectsCount',active.length.toLocaleString('ar-BH')); setText('religionQuranPos',religion.quran.lastPosition||'—'); const t=todayKey(); const done=religion.adhkar.filter(x=>(x.doneDates||[]).includes(t)).length; setText('religionDhikrDone',done.toLocaleString('ar-BH')); const month=currentMonthKey(); const fastCount=religion.fasting.filter(x=>(x.date||'').slice(0,7)===month).length; setText('religionFastCount',`${fastCount.toLocaleString('ar-BH')} يوم`);
  const focus=active[0]; setText('religionFocusTitle',focus?focus.title:'اختر مشروعًا أو هدفًا دينيًا'); setText('religionFocusSummary',focus?`${focus.type||'مشروع ديني'}${focus.deadline?` • حتى ${arabicDate(focus.deadline)}`:''}${focus.why?` • ${focus.why}`:''}`:'يمكن أن يكون ختمة، وردًا يوميًا، حفظًا، مراجعة أو مشروع تعلم ديني.');
  const suggestions=[]; if(religion.quran.lastPosition||religion.quran.dailyTarget)suggestions.push({icon:'📖',title:religion.quran.dailyTarget?`أكمل هدف القرآن: ${religion.quran.dailyTarget}`:'تابع القرآن من آخر موضع',meta:religion.quran.lastPosition||'لم تحدد موضعًا'}); const pendingDhikr=religion.adhkar.find(x=>!(x.doneDates||[]).includes(t)); if(pendingDhikr)suggestions.push({icon:'🤲',title:pendingDhikr.title,meta:'ذكر/دعاء لم يكتمل اليوم'}); if(focus)suggestions.push({icon:'🎯',title:focus.title,meta:'المشروع الديني النشط'});
  renderList('religionTodayList',suggestions,x=>`<div class="domain-row"><div><b>${x.icon} ${escapeHTML(x.title)}</b><small>${escapeHTML(x.meta)}</small></div></div>`,'لا توجد أعمال محددة من بياناتك اليوم. أضف مشروعًا أو وردًا أو ذكرًا.');
  renderList('religionProjectList',religion.projects,x=>`<div class="domain-row"><div><b>🎯 ${escapeHTML(x.title)}</b><small>${escapeHTML(x.type||'مشروع ديني')} • ${escapeHTML(x.status||'نشط')}${x.deadline?` • ${arabicDate(x.deadline)}`:''}</small></div><button class="row-delete" data-religion-toggle-project="${x.id}">${x.status==='مكتمل'?'إعادة فتح':'تم'}</button><button class="row-delete" data-religion-delete="project" data-id="${x.id}">حذف</button></div>`,'لم تضف مشروعًا دينيًا بعد.');
  const qg=document.getElementById('religionQuranGrid'); if(qg){ const q=religion.quran; qg.innerHTML=[['المسار',q.mode||'—'],['آخر موضع',q.lastPosition||'—'],['الهدف اليومي',q.dailyTarget||'—'],['ملاحظة',q.note||'—']].map(([a,b])=>`<div><span>${a}</span><b>${escapeHTML(b)}</b></div>`).join(''); }
  renderList('religionDhikrList',religion.adhkar,x=>{ const isDone=(x.doneDates||[]).includes(t); return `<div class="domain-row ${isDone?'done-row':''}"><div><b>🤲 ${escapeHTML(x.title)}</b><small>${x.target?`الهدف ${escapeHTML(x.target)}`:'قائمة شخصية'}${isDone?' • اكتمل اليوم':''}</small></div><button class="row-toggle" data-religion-toggle-dhikr="${x.id}">${isDone?'↺':'✓'}</button><button class="row-delete" data-religion-delete="dhikr" data-id="${x.id}">حذف</button></div>`;},'لم تضف أذكارًا أو أدعية بعد.');
  const fast=[...religion.fasting].sort((a,b)=>(b.date||'').localeCompare(a.date||'')); renderList('religionFastList',fast,x=>`<div class="domain-row"><div><b>🌙 ${arabicDate(x.date)}</b><small>${escapeHTML(x.note||'يوم صيام مسجل')}</small></div><button class="row-delete" data-religion-delete="fast" data-id="${x.id}">حذف</button></div>`,'لم تسجل أيام صيام بعد.');
}
function openReligionForm(action){ const q=religion.quran;
  if(action==='project') return openDomainForm('ديني','إضافة مشروع ديني',field('اسم المشروع','title','text','placeholder="مثال: ختم القرآن خلال 3 أشهر"')+selectField('النوع','type',['قرآن','حفظ ومراجعة','أذكار','صيام','تعلم ديني','صدقة','هدف خاص'])+optionalField('موعد النهاية','deadline','date')+optionalField('لماذا هذا الهدف مهم؟','why','text','placeholder="اختياري"')+selectField('الحالة','status',['نشط','في الانتظار','مكتمل']),'religion:project');
  if(action==='quran') return openDomainForm('ديني','تحديث متابعة القرآن',selectField('المسار','mode',['قراءة','ختمة','حفظ','مراجعة'],q.mode)+field('آخر موضع وصلت إليه','lastPosition','text',`placeholder="مثال: سورة النور ص ٣٥٢" value="${escapeHTML(q.lastPosition||'')}"`)+optionalField('الهدف اليومي','dailyTarget','text',`placeholder="مثال: 10 صفحات" value="${escapeHTML(q.dailyTarget||'')}"`)+optionalField('ملاحظة','note','text',`value="${escapeHTML(q.note||'')}"`),'religion:quran');
  if(action==='dhikr') return openDomainForm('ديني','إضافة ذكر أو دعاء',field('العنوان','title','text','placeholder="مثال: أذكار المساء"')+optionalField('الهدف أو العدد','target','text','placeholder="اختياري"'),'religion:dhikr');
  if(action==='fast') return openDomainForm('ديني','تسجيل يوم صيام',field('التاريخ','date','date',`value="${todayKey()}"`)+optionalField('ملاحظة','note','text','placeholder="اختياري"'),'religion:fast');
}
function deleteReligion(kind,id){ const map={project:'projects',dhikr:'adhkar',fast:'fasting'}; const key=map[kind]; if(!key)return; religion[key]=religion[key].filter(x=>x.id!==id); saveReligion(); }
function toggleReligionProject(id){ const x=religion.projects.find(x=>x.id===id); if(!x)return; x.status=x.status==='مكتمل'?'نشط':'مكتمل'; addTimeline(`${x.status==='مكتمل'?'أكملت':'أعدت فتح'} مشروعًا دينيًا: ${x.title}`,'ديني','🎯'); saveReligion(); }
function toggleDhikr(id){ const x=religion.adhkar.find(x=>x.id===id); if(!x)return; const t=todayKey(); x.doneDates=x.doneDates||[]; if(x.doneDates.includes(t))x.doneDates=x.doneDates.filter(d=>d!==t); else {x.doneDates.push(t); addTimeline(`أكملت: ${x.title}`,'ديني','🤲');} saveReligion(); }

// ---------------- Knowledge ----------------
function dailyHadith(){ if(!knowledge.hadiths.length)return null; const d=new Date(); const seed=Math.floor(new Date(d.getFullYear(),d.getMonth(),d.getDate()).getTime()/86400000); return knowledge.hadiths[seed%knowledge.hadiths.length]; }
function renderKnowledge(){
  const had=dailyHadith(); setText('knowledgeHadithCount',knowledge.hadiths.length.toLocaleString('ar-BH')); const t=todayKey(); const todayTasks=knowledge.english.tasks.filter(x=>x.date===t); const done=todayTasks.filter(x=>x.done).length; setText('knowledgeEnglishDone',`${done.toLocaleString('ar-BH')} / ${todayTasks.length.toLocaleString('ar-BH')}`); setText('knowledgeNextExam',knowledge.english.weeklyExamDay||'غير محدد'); setText('knowledgeReadingBooks',knowledge.books.filter(x=>x.status==='أقرأ الآن').length.toLocaleString('ar-BH'));
  setText('dailyHadithText',had?had.text:'أضف أحاديثك ليظهر هنا حديث اليوم.'); setText('dailyHadithSource',had?(had.source||'المصدر غير مضاف'):'المصدر اختياري'); const fav=document.getElementById('hadithFavoriteBtn'); if(fav)fav.textContent=had?.favorite?'★':'☆'; const read=document.getElementById('hadithReadBtn'); if(read) read.textContent=had?.readDates?.includes(t)?'تمت القراءة ✓':'تمت القراءة';
  renderList('knowledgeHadithList',knowledge.hadiths,x=>`<div class="domain-row hadith-row"><div><b>${escapeHTML(x.text)}</b><small>${escapeHTML(x.source||'بدون مصدر')} ${x.category?`• ${escapeHTML(x.category)}`:''}${x.favorite?' • ★ مفضلة':''}</small></div><button class="row-delete" data-knowledge-favorite="${x.id}">${x.favorite?'★':'☆'}</button><button class="row-delete" data-knowledge-delete="hadith" data-id="${x.id}">حذف</button></div>`,'لم تضف أحاديث بعد.');
  const e=knowledge.english; setText('englishSummary',e.level||e.goal||e.weeklyExamDay?`المستوى: ${e.level||'غير محدد'} • الهدف: ${e.goal||'غير محدد'} • الاختبار: ${e.weeklyExamDay||'غير محدد'}`:'حدد المستوى والهدف وموعد الاختبار الأسبوعي.');
  const tasks=[...e.tasks].sort((a,b)=>(b.date||'').localeCompare(a.date||'')); renderList('englishTaskList',tasks,x=>`<div class="domain-row ${x.done?'done-row':''}"><div><b>📘 ${escapeHTML(x.title)}</b><small>${escapeHTML(x.type||'مهمة')} • ${arabicDate(x.date)}</small></div><button class="row-toggle" data-english-toggle="${x.id}">${x.done?'↺':'✓'}</button><button class="row-delete" data-knowledge-delete="englishTask" data-id="${x.id}">حذف</button></div>`,'لا توجد مهام إنجليزية بعد.');
  const tests=[...e.tests].sort((a,b)=>(b.date||'').localeCompare(a.date||'')); renderList('englishTestList',tests,x=>`<div class="domain-row"><div><b>📝 ${Number(x.score).toLocaleString('ar-BH')} / ${Number(x.outOf).toLocaleString('ar-BH')}</b><small>${arabicDate(x.date)}${x.note?` • ${escapeHTML(x.note)}`:''}</small></div><button class="row-delete" data-knowledge-delete="englishTest" data-id="${x.id}">حذف</button></div>`,'لم تسجل نتائج اختبارات بعد.');
  renderList('knowledgeBookList',knowledge.books,x=>{ const pct=x.totalPages?Math.min(100,Number(x.currentPage||0)/Number(x.totalPages)*100):0; return `<div class="domain-row book-row"><div><b>📚 ${escapeHTML(x.title)}</b><small>${escapeHTML(x.author||'بدون مؤلف')} • ${escapeHTML(x.status)}${x.totalPages?` • ص ${x.currentPage||0}/${x.totalPages}`:''}</small>${x.totalPages?`<div class="mini-progress"><span style="width:${pct}%"></span></div>`:''}${x.notes?`<small>${escapeHTML(x.notes)}</small>`:''}</div><button class="row-delete" data-knowledge-delete="book" data-id="${x.id}">حذف</button></div>`;},'لم تضف كتبًا بعد.');
  renderList('knowledgeProjectList',knowledge.projects,x=>`<div class="domain-row"><div><b>🎓 ${escapeHTML(x.title)}</b><small>${escapeHTML(x.status)}${x.note?` • ${escapeHTML(x.note)}`:''}</small></div><button class="row-delete" data-knowledge-delete="project" data-id="${x.id}" ${x.id==='english-project'?'disabled':''}>حذف</button></div>`,'لا توجد مشاريع تعلم.');
}
function openKnowledgeForm(action){ const e=knowledge.english;
  if(action==='hadith') return openDomainForm('معرفتي','إضافة حديث',textareaField('نص الحديث','text','rows="4" placeholder="نص الحديث هو الحقل الأساسي" required')+optionalField('المصدر','source','text','placeholder="اختياري"')+optionalField('التصنيف','category','text','placeholder="مثال: الأخلاق، العلم، الصبر"'),'knowledge:hadith');
  if(action==='englishSetup') return openDomainForm('معرفتي','إعداد مشروع الإنجليزية',selectField('المستوى الحالي','level',['مبتدئ','A1','A2','B1','B2','C1','C2','غير محدد'],e.level)+field('الهدف','goal','text',`placeholder="مثال: محادثة للعمل" value="${escapeHTML(e.goal||'')}"`)+selectField('موعد الاختبار الأسبوعي','weeklyExamDay',['السبت','الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','غير محدد'],e.weeklyExamDay),'knowledge:englishSetup');
  if(action==='englishTask') return openDomainForm('معرفتي','إضافة مهمة إنجليزية',field('المهمة','title','text','placeholder="مثال: قراءة نص قصير"')+selectField('النوع','type',['مفردات','قواعد','قراءة','كتابة','استماع','محادثة','مراجعة'])+field('التاريخ','date','date',`value="${todayKey()}"`),'knowledge:englishTask');
  if(action==='englishTest') return openDomainForm('معرفتي','تسجيل نتيجة اختبار أسبوعي',field('الدرجة','score','number','min="0"')+field('من','outOf','number','min="1" value="100"')+field('التاريخ','date','date',`value="${todayKey()}"`)+optionalField('ملاحظة','note','text','placeholder="نقطة قوة أو ضعف"'),'knowledge:englishTest');
  if(action==='book') return openDomainForm('معرفتي','إضافة كتاب',field('عنوان الكتاب','title','text')+optionalField('المؤلف','author','text')+selectField('الحالة','status',['أريد قراءته','أقرأ الآن','أنهيته','توقفت'])+optionalField('الصفحة الحالية','currentPage','number','min="0" value="0"')+optionalField('عدد الصفحات','totalPages','number','min="1"')+textareaField('ملاحظاتي / ماذا استفدت؟','notes','rows="3"'),'knowledge:book');
  if(action==='project') return openDomainForm('معرفتي','إضافة مشروع تعلم',field('اسم المشروع','title','text','placeholder="مثال: احتراف الذكاء الاصطناعي"')+selectField('الحالة','status',['أتعلمه الآن','في قائمة الانتظار','أنجزته','أريد العودة إليه لاحقًا'])+optionalField('ملاحظة','note','text','placeholder="الهدف أو سبب التعلم"'),'knowledge:project');
}
function deleteKnowledge(kind,id){ if(kind==='hadith')knowledge.hadiths=knowledge.hadiths.filter(x=>x.id!==id); if(kind==='englishTask')knowledge.english.tasks=knowledge.english.tasks.filter(x=>x.id!==id); if(kind==='englishTest')knowledge.english.tests=knowledge.english.tests.filter(x=>x.id!==id); if(kind==='book')knowledge.books=knowledge.books.filter(x=>x.id!==id); if(kind==='project')knowledge.projects=knowledge.projects.filter(x=>x.id!==id); saveKnowledge(); }
function toggleEnglishTask(id){ const x=knowledge.english.tasks.find(x=>x.id===id); if(!x)return; x.done=!x.done; if(x.done)addTimeline(`أنجزت مهمة إنجليزية: ${x.title}`,'معرفتي','📘'); saveKnowledge(); }
function toggleHadithFavorite(id){ const x=knowledge.hadiths.find(x=>x.id===id); if(!x)return; x.favorite=!x.favorite; saveKnowledge(); }
function markDailyHadithRead(){ const x=dailyHadith(); if(!x)return openKnowledgeForm('hadith'); const t=todayKey(); x.readDates=x.readDates||[]; if(!x.readDates.includes(t)){x.readDates.push(t); addTimeline('قرأت حديث اليوم','معرفتي','📜');} saveKnowledge(); }
function toggleDailyHadithFavorite(){ const x=dailyHadith(); if(!x)return; x.favorite=!x.favorite; saveKnowledge(); }

// ---------------- Domain form submit ----------------
domainForm.addEventListener('submit',e=>{
  e.preventDefault(); const fd=Object.fromEntries(new FormData(domainForm).entries()); const action=currentDomainAction;
  if(action==='health:setup'){ health.profile={...health.profile,startWeight:Number(fd.startWeight),height:Number(fd.height),age:Number(fd.age),sex:fd.sex,activity:fd.activity,targetWeight:Number(fd.targetWeight),targetDate:fd.targetDate,dailyCalories:Number(fd.dailyCalories),waterTarget:Number(fd.waterTarget)}; if(!health.weights.length)health.weights.push({id:makeId(),weight:Number(fd.startWeight),date:todayKey()}); addTimeline('أعددت مشروع إنزال الوزن','صحتي','🥗'); saveHealth(); }
  if(action==='health:weight'){ health.weights.push({id:makeId(),weight:Number(fd.weight),date:fd.date}); addTimeline(`سجلت وزني: ${fd.weight} كجم`,'صحتي','⚖️'); saveHealth(); }
  if(action==='health:meal'){ health.meals.push({id:makeId(),name:fd.name,type:fd.type,calories:Number(fd.calories),note:fd.note,date:fd.date,createdAt:new Date().toISOString()}); addTimeline(`سجلت وجبة: ${fd.name}`,'صحتي','🍲'); saveHealth(); }
  if(action==='health:drink'){ health.drinks.push({id:makeId(),name:fd.name,calories:Number(fd.calories),sugar:Number(fd.sugar||0),date:fd.date,createdAt:new Date().toISOString()}); addTimeline(`سجلت مشروبًا: ${fd.name}`,'صحتي','🥤'); saveHealth(); }
  if(action==='health:water'){ health.water.push({id:makeId(),ml:Number(fd.ml),date:fd.date}); addTimeline(`شربت ${fd.ml} مل ماء`,'صحتي','💧'); saveHealth(); }

  if(action==='religion:project'){ religion.projects.push({id:makeId(),title:fd.title,type:fd.type,deadline:fd.deadline,why:fd.why,status:fd.status}); addTimeline(`أنشأت مشروعًا دينيًا: ${fd.title}`,'ديني','🎯'); saveReligion(); }
  if(action==='religion:quran'){ religion.quran={mode:fd.mode,lastPosition:fd.lastPosition,dailyTarget:fd.dailyTarget,note:fd.note}; addTimeline(`حدّثت متابعة القرآن: ${fd.lastPosition}`,'ديني','📖'); saveReligion(); }
  if(action==='religion:dhikr'){ religion.adhkar.push({id:makeId(),title:fd.title,target:fd.target,doneDates:[]}); addTimeline(`أضفت إلى الأذكار: ${fd.title}`,'ديني','🤲'); saveReligion(); }
  if(action==='religion:fast'){ religion.fasting.push({id:makeId(),date:fd.date,note:fd.note}); addTimeline(`سجلت يوم صيام: ${arabicDate(fd.date)}`,'ديني','🌙'); saveReligion(); }

  if(action==='knowledge:hadith'){ knowledge.hadiths.push({id:makeId(),text:fd.text,source:fd.source,category:fd.category,favorite:false,readDates:[]}); addTimeline('أضفت حديثًا إلى معرفتي','معرفتي','📜'); saveKnowledge(); }
  if(action==='knowledge:englishSetup'){ knowledge.english.level=fd.level; knowledge.english.goal=fd.goal; knowledge.english.weeklyExamDay=fd.weeklyExamDay; addTimeline('حدّثت مشروع الإنجليزية','معرفتي','📘'); saveKnowledge(); }
  if(action==='knowledge:englishTask'){ knowledge.english.tasks.push({id:makeId(),title:fd.title,type:fd.type,date:fd.date,done:false}); addTimeline(`أضفت مهمة إنجليزية: ${fd.title}`,'معرفتي','📘'); saveKnowledge(); }
  if(action==='knowledge:englishTest'){ knowledge.english.tests.push({id:makeId(),score:Number(fd.score),outOf:Number(fd.outOf),date:fd.date,note:fd.note}); addTimeline(`سجلت نتيجة اختبار الإنجليزية: ${fd.score}/${fd.outOf}`,'معرفتي','📝'); saveKnowledge(); }
  if(action==='knowledge:book'){ knowledge.books.push({id:makeId(),title:fd.title,author:fd.author,status:fd.status,currentPage:Number(fd.currentPage||0),totalPages:Number(fd.totalPages||0),notes:fd.notes}); addTimeline(`أضفت كتابًا: ${fd.title}`,'معرفتي','📚'); saveKnowledge(); }
  if(action==='knowledge:project'){ knowledge.projects.push({id:makeId(),title:fd.title,status:fd.status,note:fd.note}); addTimeline(`أضفت مشروع تعلم: ${fd.title}`,'معرفتي','🎓'); saveKnowledge(); }
  closeDomainForm();
});

// ---------------- Dashboard + Story ----------------
function renderDashboard(){
  const healthCard=document.querySelector('.priority-card.health .priority-body'); if(healthCard){ const calGoal=Number(health.profile.dailyCalories||0), consumed=healthTodayCalories(), current=latestWeightRecord()?.weight||health.profile.startWeight; healthCard.querySelector('h3').textContent=health.profile.startWeight?'مشروع إنزال الوزن':'مشروع إنزال الوزن'; healthCard.querySelector('p').textContent=calGoal?`متبقي ${Math.max(0,calGoal-consumed).toLocaleString('ar-BH')} سعرة اليوم${current?` • الوزن ${current} كجم`:''}`:'ابدأ بإعداد مشروعك أو سجّل وجبتك ووزنك.'; }
  const religionCard=document.querySelector('.priority-card.religion .priority-body'); if(religionCard){ const focus=religion.projects.find(x=>x.status!=='مكتمل'); religionCard.querySelector('h3').textContent=focus?focus.title:'ورد اليوم'; religionCard.querySelector('p').textContent=religion.quran.dailyTarget?`هدف القرآن: ${religion.quran.dailyTarget}`:(focus?'تابع مشروعك الديني النشط.':'أضف مشروعًا أو هدف قرآن أو ذكرًا.'); }
  const knowledgeCard=document.querySelector('.priority-card.knowledge .priority-body'); if(knowledgeCard){ const had=dailyHadith(); const todayTasks=knowledge.english.tasks.filter(x=>x.date===todayKey()); knowledgeCard.querySelector('h3').textContent=had?'حديث اليوم':'مشروع الإنجليزية'; knowledgeCard.querySelector('p').textContent=had?`${had.text.slice(0,68)}${had.text.length>68?'…':''}`:(todayTasks.length?`${todayTasks.filter(x=>!x.done).length} مهمة إنجليزية متبقية اليوم`:'أضف أحاديثك أو مهام الإنجليزية.'); }
}
function renderStory(){
  const view=document.getElementById('view-story'); const items=loadJSON(TIMELINE_KEY,[]); const old=view.querySelector('.story-live'); if(old) old.remove(); const empty=view.querySelector('.empty-state'); if(!items.length){ if(empty) empty.style.display=''; return; } if(empty) empty.style.display='none'; const wrap=document.createElement('div'); wrap.className='timeline-preview story-live';
  items.slice(0,50).forEach(item=>{ const d=new Date(item.at); const time=new Intl.DateTimeFormat('ar-BH',{hour:'numeric',minute:'2-digit'}).format(d); wrap.insertAdjacentHTML('beforeend',`<div class="timeline-item"><span class="dot blue"></span><div><b>${escapeHTML(item.icon+' '+item.title)}</b><small>${escapeHTML(item.meta)} • ${time}</small></div></div>`); }); view.appendChild(wrap);
}

// ---------------- Events ----------------
document.addEventListener('click', (event) => {
  const nav = event.target.closest('[data-nav]'); if (nav) { showView(nav.dataset.nav); return; }
  const section = event.target.closest('[data-section]'); if (section && !event.target.closest('[data-action]')) { openSection(section.dataset.section); return; }

  const finAction=event.target.closest('[data-fin-action]'); if(finAction){ openFinanceForm(finAction.dataset.finAction); return; }
  const finTab=event.target.closest('[data-fin-tab]'); if(finTab){ document.querySelectorAll('[data-fin-tab]').forEach(x=>x.classList.toggle('active',x===finTab)); document.querySelectorAll('[data-fin-panel]').forEach(x=>x.classList.toggle('active',x.dataset.finPanel===finTab.dataset.finTab)); return; }
  const finDel=event.target.closest('[data-fin-delete]'); if(finDel){ if(confirm('حذف هذا العنصر؟')) deleteFinance(finDel.dataset.finDelete,finDel.dataset.id); return; }

  const healthAction=event.target.closest('[data-health-action]'); if(healthAction){ openHealthForm(healthAction.dataset.healthAction); return; }
  const healthTab=event.target.closest('[data-health-tab]'); if(healthTab){ document.querySelectorAll('[data-health-tab]').forEach(x=>x.classList.toggle('active',x===healthTab)); document.querySelectorAll('[data-health-panel]').forEach(x=>x.classList.toggle('active',x.dataset.healthPanel===healthTab.dataset.healthTab)); return; }
  const healthWater=event.target.closest('[data-health-water]'); if(healthWater){ const ml=Number(healthWater.dataset.healthWater); health.water.push({id:makeId(),ml,date:todayKey()}); addTimeline(`شربت ${ml} مل ماء`,'صحتي','💧'); saveHealth(); return; }
  const healthDel=event.target.closest('[data-health-delete]'); if(healthDel){ if(confirm('حذف هذا العنصر؟')) deleteHealth(healthDel.dataset.healthDelete,healthDel.dataset.id); return; }

  const religionAction=event.target.closest('[data-religion-action]'); if(religionAction){ openReligionForm(religionAction.dataset.religionAction); return; }
  const religionTab=event.target.closest('[data-religion-tab]'); if(religionTab){ document.querySelectorAll('[data-religion-tab]').forEach(x=>x.classList.toggle('active',x===religionTab)); document.querySelectorAll('[data-religion-panel]').forEach(x=>x.classList.toggle('active',x.dataset.religionPanel===religionTab.dataset.religionTab)); return; }
  const rd=event.target.closest('[data-religion-delete]'); if(rd){ if(confirm('حذف هذا العنصر؟'))deleteReligion(rd.dataset.religionDelete,rd.dataset.id); return; }
  const rp=event.target.closest('[data-religion-toggle-project]'); if(rp){toggleReligionProject(rp.dataset.religionToggleProject);return;}
  const rdh=event.target.closest('[data-religion-toggle-dhikr]'); if(rdh){toggleDhikr(rdh.dataset.religionToggleDhikr);return;}

  const knowledgeAction=event.target.closest('[data-knowledge-action]'); if(knowledgeAction){ openKnowledgeForm(knowledgeAction.dataset.knowledgeAction); return; }
  const knowledgeTab=event.target.closest('[data-knowledge-tab]'); if(knowledgeTab){ document.querySelectorAll('[data-knowledge-tab]').forEach(x=>x.classList.toggle('active',x===knowledgeTab)); document.querySelectorAll('[data-knowledge-panel]').forEach(x=>x.classList.toggle('active',x.dataset.knowledgePanel===knowledgeTab.dataset.knowledgeTab)); return; }
  const kd=event.target.closest('[data-knowledge-delete]'); if(kd){ if(confirm('حذف هذا العنصر؟'))deleteKnowledge(kd.dataset.knowledgeDelete,kd.dataset.id);return; }
  const kf=event.target.closest('[data-knowledge-favorite]'); if(kf){toggleHadithFavorite(kf.dataset.knowledgeFavorite);return;}
  const et=event.target.closest('[data-english-toggle]'); if(et){toggleEnglishTask(et.dataset.englishToggle);return;}

  const action = event.target.closest('[data-action]');
  if (action) {
    if(action.dataset.action==='expense'){ showView('finance'); navItems.forEach(i=>i.classList.remove('active')); openFinanceForm('expense'); return; }
    if(action.dataset.action==='meal'){ showView('health'); navItems.forEach(i=>i.classList.remove('active')); openHealthForm('meal'); return; }
    if(action.dataset.action==='weight'){ showView('health'); navItems.forEach(i=>i.classList.remove('active')); openHealthForm('weight'); return; }
    if(action.dataset.action==='reading'){ showView('knowledge'); navItems.forEach(i=>i.classList.remove('active')); openKnowledgeForm('book'); return; }
    if(action.dataset.action==='learn'){ showView('knowledge'); navItems.forEach(i=>i.classList.remove('active')); return; }
    if(action.dataset.action==='religion'){ showView('religion'); navItems.forEach(i=>i.classList.remove('active')); return; }
    const labels = { contact:['تسجيل تواصل','سيُبنى هذا الإجراء داخل قسم «علاقاتي» في الخطوة القادمة.','☎️'], note:['إضافة ملاحظة','إضافة الملاحظات العامة ستُربط بالـTimeline في مرحلة لاحقة.','✍️'] };
    const [title,text,icon]=labels[action.dataset.action]||['قريبًا','سيتم بناء هذه الميزة في قسمها.','✓']; openModal(title,text,icon);
  }
});

const hadithReadBtn=document.getElementById('hadithReadBtn'); if(hadithReadBtn)hadithReadBtn.addEventListener('click',markDailyHadithRead);
const hadithFavoriteBtn=document.getElementById('hadithFavoriteBtn'); if(hadithFavoriteBtn)hadithFavoriteBtn.addEventListener('click',toggleDailyHadithFavorite);
document.getElementById('sectionBack').addEventListener('click', () => showView('domains'));
document.getElementById('sectionAction').addEventListener('click', () => showView('today'));
modalClose.addEventListener('click', closeModal); modalOk.addEventListener('click', closeModal); modalBackdrop.addEventListener('click', (e) => { if (e.target === modalBackdrop) closeModal(); });
installBtn.addEventListener('click', installApp); document.getElementById('settingInstall').addEventListener('click', installApp); themeBtn.addEventListener('click', toggleTheme); document.getElementById('settingTheme').addEventListener('click', toggleTheme);
window.addEventListener('beforeinstallprompt', (event) => { event.preventDefault(); deferredPrompt = event; });

const savedTheme = localStorage.getItem('hayati-theme'); setTheme(savedTheme || 'dark'); document.getElementById('todayDate').textContent = formatArabicDate(); renderFinance(); renderHealth(); renderReligion(); renderKnowledge(); renderStory(); renderDashboard();
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js').catch(() => {}));
