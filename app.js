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
const RELATIONSHIPS_KEY = 'hayati-relationships-v1';
const FAMILY_KEY = 'hayati-family-v1';
const TIMELINE_KEY = 'hayati-timeline-v1';
const SNAPSHOT_KEY = 'hayati-backup-snapshots-v1';
const BACKUP_META_KEY = 'hayati-backup-meta-v1';
const DAILY_HADITH_STATE_KEY = 'hayati-daily-hadith-v1';
const DAY_RHYTHM_KEY = 'hayati-day-rhythm-v1';
const BACKUP_SCHEMA_VERSION = 3;

const emptyFinance = () => ({ currentBalance: 0, monthlyIncome: 0, salaries: { mid: 0, end: 0 }, fixedExpenses: [], transactions: [], obligations: [], goals: [] });
const emptyHealth = () => ({
  profile: { startWeight: 0, height: 0, age: 0, sex: '', activity: '', targetWeight: 0, targetDate: '', dailyCalories: 0, waterTarget: 2000 },
  weights: [], meals: [], drinks: [], water: []
});
const emptyReligion = () => ({
  projects: [],
  quran: { mode: 'قراءة', lastPosition: '', dailyTarget: '', note: '', reader: { lastSurah: 1, lastAyah: 1, lastPage: 1, lastLine: 0, lastVerseRange: '', lastAt: '', fontStep: 2, theme: 'night', mushafTheme: 'paper', bookmarks: [] } },
  adhkar: [],
  fasting: []
});
const emptyKnowledge = () => ({
  hadiths: [],
  english: { level: '', goal: '', weeklyExamDay: '', tasks: [], tests: [] },
  books: [],
  projects: [{ id: 'english-project', title: 'تطوير اللغة الإنجليزية', status: 'أتعلمه الآن', note: 'المشروع التعليمي النشط حاليًا.' }]
});
const emptyRelationships = () => ({ people: [], interactions: [], events: [], promises: [], gifts: [] });
const emptyFamily = () => ({ members: [], albums: [], tasks: [], photos: [] });
const emptyDayRhythm = () => ({ currentStart: '', currentEnd: '', lastEnd: '', lastSleepMinutes: null, lastSleepStart: '', lastSleepEnd: '', sleepHistory: [] });

let finance = normalizeFinanceData(loadJSON(FINANCE_KEY, emptyFinance()));
let health = loadJSON(HEALTH_KEY, emptyHealth());
let religion = loadJSON(RELIGION_KEY, emptyReligion());
religion.quran = { ...emptyReligion().quran, ...(religion.quran||{}), reader: { ...emptyReligion().quran.reader, ...(religion.quran?.reader||{}), bookmarks: Array.isArray(religion.quran?.reader?.bookmarks) ? religion.quran.reader.bookmarks : [] } };
let knowledge = loadJSON(KNOWLEDGE_KEY, emptyKnowledge());
let relationships = loadJSON(RELATIONSHIPS_KEY, emptyRelationships());
let family = loadJSON(FAMILY_KEY, emptyFamily());
let dayRhythm = loadJSON(DAY_RHYTHM_KEY, emptyDayRhythm());
dayRhythm = { ...emptyDayRhythm(), ...(dayRhythm && typeof dayRhythm === 'object' ? dayRhythm : {}), sleepHistory: Array.isArray(dayRhythm?.sleepHistory) ? dayRhythm.sleepHistory : [] };

function loadJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function normalizeFinanceData(raw) {
  const base = emptyFinance();
  const f = (raw && typeof raw === 'object') ? raw : {};
  const legacyIncome = Number(f.monthlyIncome || 0);
  const salaries = f.salaries && typeof f.salaries === 'object' ? f.salaries : {};
  const hasSalaryPlan = Object.prototype.hasOwnProperty.call(salaries, 'mid') || Object.prototype.hasOwnProperty.call(salaries, 'end');
  const result = {
    ...base,
    ...f,
    currentBalance: Number(f.currentBalance || 0),
    salaries: {
      mid: Number(salaries.mid || 0),
      end: Number(hasSalaryPlan ? (salaries.end || 0) : legacyIncome)
    },
    fixedExpenses: Array.isArray(f.fixedExpenses) ? f.fixedExpenses.map(x => ({
      ...x,
      timing: x.timing || (Number(x.dueDay || 1) >= 15 ? 'mid' : 'early'),
      dueDay: Number(x.dueDay || (x.timing === 'mid' ? 15 : 1))
    })) : [],
    transactions: Array.isArray(f.transactions) ? f.transactions : [],
    obligations: Array.isArray(f.obligations) ? f.obligations : [],
    goals: Array.isArray(f.goals) ? f.goals : []
  };
  result.monthlyIncome = Number(result.salaries.mid || 0) + Number(result.salaries.end || 0);
  return result;
}
function saveFinance() { localStorage.setItem(FINANCE_KEY, JSON.stringify(finance)); scheduleSnapshot(); renderFinance(); renderDashboard(); }
function saveHealth() { localStorage.setItem(HEALTH_KEY, JSON.stringify(health)); scheduleSnapshot(); renderHealth(); renderDashboard(); }
function saveReligion() { localStorage.setItem(RELIGION_KEY, JSON.stringify(religion)); scheduleSnapshot(); renderReligion(); renderDashboard(); }
function saveKnowledge() { localStorage.setItem(KNOWLEDGE_KEY, JSON.stringify(knowledge)); scheduleSnapshot(); renderKnowledge(); renderDashboard(); }
function saveRelationships() { localStorage.setItem(RELATIONSHIPS_KEY, JSON.stringify(relationships)); scheduleSnapshot(); renderRelationships(); renderDashboard(); }
function saveFamily() { localStorage.setItem(FAMILY_KEY, JSON.stringify(family)); scheduleSnapshot(); renderFamily(); renderDashboard(); }
function saveDayRhythm() { localStorage.setItem(DAY_RHYTHM_KEY, JSON.stringify(dayRhythm)); scheduleSnapshot(); renderDayRhythm(); }
function saveTimeline(items) { localStorage.setItem(TIMELINE_KEY, JSON.stringify(items.slice(0, 300))); scheduleSnapshot(); }
function addTimeline(title, meta='حياتي', icon='✓') {
  const items = loadJSON(TIMELINE_KEY, []);
  items.unshift({ id: makeId(), title, meta, icon, at: new Date().toISOString() });
  saveTimeline(items);
  renderStory();
}

function showView(name) {
  if (name !== 'quran-reader') document.body.classList.remove('quran-fullscreen-mode');
  views.forEach(v => v.classList.toggle('active', v.dataset.view === name));
  navItems.forEach(item => item.classList.toggle('active', item.dataset.nav === name));
  if (name === 'finance') renderFinance();
  if (name === 'health') renderHealth();
  if (name === 'religion') renderReligion();
  if (name === 'knowledge') renderKnowledge();
  if (name === 'relationships') renderRelationships();
  if (name === 'family') renderFamily();
  if (name === 'settings') { renderBackupSettings(); renderHadithManagerStats(); }
  if (name === 'hadith-manager') renderHadithManager();
  if (name === 'quran-reader') initQuranReader();
  if (name === 'story') renderStory();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openSection(key) {
  if (['finance','health','religion','knowledge','relationships','family'].includes(key)) {
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
function formatClock(iso) {
  if (!iso) return '';
  try { return new Intl.DateTimeFormat('ar-BH', { hour: 'numeric', minute: '2-digit' }).format(new Date(iso)); } catch { return ''; }
}
function formatSleepDuration(minutes) {
  const total=Math.max(0,Math.round(Number(minutes||0))); const h=Math.floor(total/60), m=total%60;
  if(h && m) return `${h.toLocaleString('ar-BH')} ساعة و${m.toLocaleString('ar-BH')} دقيقة`;
  if(h) return `${h.toLocaleString('ar-BH')} ساعة`;
  return `${m.toLocaleString('ar-BH')} دقيقة`;
}
function renderDayRhythm(){
  const start=document.getElementById('startDayTime'), end=document.getElementById('endDayTime'), status=document.getElementById('dayCycleStatus');
  const startBtn=document.getElementById('startDayBtn'), endBtn=document.getElementById('endDayBtn');
  const active=!!dayRhythm.currentStart && !dayRhythm.currentEnd;
  if(start) start.textContent=dayRhythm.currentStart?`آخر بداية: ${formatClock(dayRhythm.currentStart)}`:'لم تُسجل بعد';
  if(end) end.textContent=dayRhythm.lastEnd?`آخر نهاية: ${formatClock(dayRhythm.lastEnd)}`:'لم تُسجل بعد';
  if(status) status.textContent=active?'اليوم بدأ':(dayRhythm.currentEnd?'انتهى اليوم':'جاهز');
  startBtn?.classList.toggle('is-recorded',active); endBtn?.classList.toggle('is-recorded',!!dayRhythm.currentEnd);
  const sleepText=document.getElementById('sleepSummaryText'), sleepRange=document.getElementById('sleepSummaryRange');
  if(dayRhythm.lastSleepMinutes!=null){
    if(sleepText) sleepText.textContent=formatSleepDuration(dayRhythm.lastSleepMinutes);
    if(sleepRange) sleepRange.textContent=`من ${formatClock(dayRhythm.lastSleepStart)} إلى ${formatClock(dayRhythm.lastSleepEnd)}`;
  } else {
    if(sleepText) sleepText.textContent='لا توجد مدة نوم محسوبة بعد';
    if(sleepRange) sleepRange.textContent='يُحسب النوم من «نهاية اليوم» إلى «بداية اليوم» التالية.';
  }
}
function startDay(){
  if(dayRhythm.currentStart && !dayRhythm.currentEnd) return openModal('اليوم بدأ بالفعل',`سجلت بداية اليوم عند ${formatClock(dayRhythm.currentStart)}.`,'☀️');
  const now=new Date(); const nowIso=now.toISOString();
  if(dayRhythm.lastEnd){
    const end=new Date(dayRhythm.lastEnd); const mins=Math.max(0,Math.round((now-end)/60000));
    dayRhythm.lastSleepMinutes=mins; dayRhythm.lastSleepStart=dayRhythm.lastEnd; dayRhythm.lastSleepEnd=nowIso;
    dayRhythm.sleepHistory=[{id:makeId(),endAt:dayRhythm.lastEnd,startAt:nowIso,minutes:mins},...(dayRhythm.sleepHistory||[])].slice(0,90);
  }
  dayRhythm.currentStart=nowIso; dayRhythm.currentEnd=''; saveDayRhythm();
  addTimeline(dayRhythm.lastSleepMinutes!=null?`بدأت يومي • النوم ${formatSleepDuration(dayRhythm.lastSleepMinutes)}`:'بدأت يومي','يومي','☀️');
}
function endDay(){
  if(dayRhythm.currentEnd) return openModal('نهاية اليوم مسجلة',`سجلت نهاية اليوم عند ${formatClock(dayRhythm.currentEnd)}. ستُحسب مدة النوم عند تسجيل بداية اليوم التالية.`,'🌙');
  const nowIso=new Date().toISOString(); dayRhythm.currentEnd=nowIso; dayRhythm.lastEnd=nowIso; saveDayRhythm();
  addTimeline('أنهيت يومي','يومي','🌙');
}
function renderHomeHadith(){
  const had=dailyHadith(); const text=document.getElementById('homeDailyHadithText'), meta=document.getElementById('homeDailyHadithMeta');
  if(!text||!meta)return;
  if(!had){ text.textContent='أضف أحاديثك من الإعدادات ليظهر هنا حديث اليوم.'; meta.textContent='قاعدة الأحاديث فارغة حاليًا.'; return; }
  text.textContent=had.text;
  const topic=had.topic||had.category||''; const source=had.source||'';
  meta.textContent=[topic?`الموضوع: ${topic}`:'',source?`المصدر: ${source}`:''].filter(Boolean).join(' • ') || 'حديث من قاعدتك الشخصية';
}
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
function salaryTotal(){ return Number(finance.salaries?.mid||0) + Number(finance.salaries?.end||0); }
function daysInMonthKey(monthKey){ const [y,m]=monthKey.split('-').map(Number); return new Date(y,m,0).getDate(); }
function daysInCurrentMonth(){ return daysInMonthKey(currentMonthKey()); }
function monthDateFor(monthKey,day){ return `${monthKey}-${String(Math.min(Math.max(1,Number(day)||1),daysInMonthKey(monthKey))).padStart(2,'0')}`; }
function monthDate(day){ return monthDateFor(currentMonthKey(),day); }
function nextMonthKey(monthKey=currentMonthKey()){ const [y,m]=monthKey.split('-').map(Number); const d=new Date(y,m,1); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; }
function txForSalary(key, month=currentMonthKey()){ return finance.transactions.find(t=>t.source==='salary' && t.salaryKey===key && (t.month===month || (t.date||'').slice(0,7)===month)); }
function txForFixed(id, month=currentMonthKey()){ return finance.transactions.find(t=>t.source==='fixed' && t.fixedExpenseId===id && (t.month===month || (t.date||'').slice(0,7)===month)); }
function txForObligation(id){ return finance.transactions.find(t=>t.source==='obligation' && t.obligationId===id); }
function fixedDueDayForMonth(x,monthKey=currentMonthKey()){ const d=Number(x.dueDay||0); if(d) return Math.min(daysInMonthKey(monthKey),Math.max(1,d)); return x.timing==='mid'?15:1; }
function fixedDueDay(x){ return fixedDueDayForMonth(x,currentMonthKey()); }
function fixedTimingLabel(x){ const day=fixedDueDay(x); return `${day<15?'بداية الشهر':'منتصف الشهر'} • يوم ${day.toLocaleString('ar-BH')}`; }
function salaryScheduleDate(key){ return key==='mid' ? monthDate(15) : monthDate(daysInCurrentMonth()); }
function nextSalaryInfo(){
  const now=new Date(); const day=now.getDate(); const month=currentMonthKey();
  if(day < 15 && !txForSalary('mid',month)) return {key:'mid', month, day:15, date:monthDateFor(month,15), label:'راتب يوم 15'};
  if(!txForSalary('end',month)){ const last=daysInMonthKey(month); return {key:'end', month, day:last, date:monthDateFor(month,last), label:'راتب نهاية الشهر'}; }
  const nm=nextMonthKey(month); return {key:'mid', month:nm, day:15, date:monthDateFor(nm,15), label:'راتب يوم 15 القادم'};
}
function scheduledBeforeNextSalary(){
  const next=nextSalaryInfo(); const current=currentMonthKey(); let total=0; const months=next.month===current?[current]:[current,next.month];
  months.forEach(month=>finance.fixedExpenses.forEach(x=>{ const due=monthDateFor(month,fixedDueDayForMonth(x,month)); if(due<=next.date && !txForFixed(x.id,month)) total+=Number(x.amount||0); }));
  const windowStart=`${current}-01`; finance.obligations.forEach(x=>{ if((x.dueDate||'')>=windowStart && (x.dueDate||'')<=next.date && !txForObligation(x.id)) total+=Number(x.amount||0); });
  return total;
}
function flowRow(title, meta, amount, status='', actionHTML='', tone='expense'){
  return `<div class="finance-row cashflow-row"><div><div class="row-title">${escapeHTML(title)}</div><div class="row-meta">${escapeHTML(meta)}</div></div><div class="row-amount ${tone}">${amount}</div>${status?`<span class="flow-status ${status==='مدفوع'?'paid':''}">${escapeHTML(status)}</span>`:''}${actionHTML?`<div class="row-actions">${actionHTML}</div>`:''}</div>`;
}
function renderFlowPeriod(id,startDay,endDay){
  const el=document.getElementById(id); if(!el)return; const month=currentMonthKey(); const rows=[];
  finance.fixedExpenses.forEach(x=>{ const day=fixedDueDay(x); if(day<startDay||day>endDay)return; const paid=!!txForFixed(x.id,month); rows.push({day,html:flowRow(x.title,`${x.category||'مصروف ثابت'} • يوم ${day.toLocaleString('ar-BH')}`,money(x.amount),paid?'مدفوع':'مجدول',paid?'':`<button data-fin-pay-fixed="${x.id}">تم الدفع</button>`)}); });
  finance.obligations.forEach(x=>{ if((x.dueDate||'').slice(0,7)!==month)return; const day=Number((x.dueDate||'').slice(8,10)); if(day<startDay||day>endDay)return; const paid=!!txForObligation(x.id); rows.push({day,html:flowRow(x.title,`التزام • ${arabicDate(x.dueDate)}`,money(x.amount),paid?'مدفوع':'مستحق',paid?'':`<button data-fin-pay-obligation="${x.id}">تم الدفع</button>`)}); });
  finance.transactions.filter(t=>(t.date||'').slice(0,7)===month && !['salary','fixed','obligation'].includes(t.source)).forEach(t=>{ const day=Number((t.date||'').slice(8,10)); if(day<startDay||day>endDay)return; const title=t.note||t.category||(t.type==='income'?'دخل إضافي':'مصروف'); rows.push({day,html:flowRow(title,`${t.type==='income'?'دخل':'مصروف'} • ${arabicDate(t.date)}`,`${t.type==='income'?'+':'−'} ${money(t.amount)}`,'','',t.type)}); });
  rows.sort((a,b)=>a.day-b.day); el.innerHTML=rows.length?rows.map(x=>x.html).join(''):emptyRow('لا توجد عمليات أو مصاريف مجدولة في هذه الفترة.');
}
function renderFinance() {
  finance = normalizeFinanceData(finance);
  const fixed = finance.fixedExpenses.reduce((s,x)=>s+Number(x.amount||0),0);
  const salary = salaryTotal(); finance.monthlyIncome=salary;
  const surplus = salary - fixed;
  const month = currentMonthKey();
  const monthTx = finance.transactions.filter(t => (t.date||'').slice(0,7) === month);
  const spent = monthTx.filter(t=>t.type==='expense').reduce((s,x)=>s+Number(x.amount||0),0);
  const goalNeed = finance.goals.filter(g=>!g.done).reduce((s,g)=>s + Math.max(0, Number(g.target||0)-Number(g.saved||0))/monthsUntil(g.deadline),0);
  const reserved=scheduledBeforeNextSalary(); const availableToNext=Number(finance.currentBalance||0)-reserved; const next=nextSalaryInfo();
  setText('finBalance',money(finance.currentBalance)); setText('finFixed',money(fixed)); setText('finSalary',money(salary)); setText('finSpent',money(spent)); setText('finGoalNeed',money(goalNeed));
  setText('finSalarySplit',`15: ${money(finance.salaries.mid)} • نهاية الشهر: ${money(finance.salaries.end)}`);
  setText('finCycleBalance',money(finance.currentBalance)); setText('finReservedToNext',money(reserved)); setText('finAvailableToNext',money(availableToNext));
  setText('finNextSalaryLabel',`المتاح حتى ${next.label}`); setText('finNextSalaryWhen',arabicDate(next.date));
  const mn=document.getElementById('finMonthName'); if(mn)mn.textContent=new Intl.DateTimeFormat('ar-BH',{month:'long',year:'numeric'}).format(new Date());
  setText('finMidSalaryAmount',money(finance.salaries.mid)); setText('finEndSalaryAmount',money(finance.salaries.end));
  const midTx=txForSalary('mid'), endTx=txForSalary('end'); setText('finMidSalaryStatus',midTx?`تم الاستلام • ${arabicDate(midTx.date)}`:'لم يُستلم بعد'); setText('finEndSalaryStatus',endTx?`تم الاستلام • ${arabicDate(endTx.date)}`:'لم يُستلم بعد');
  const midBtn=document.getElementById('finMidSalaryBtn'); if(midBtn){midBtn.textContent=midTx?'تم':'استلام';midBtn.disabled=!!midTx;}
  const endBtn=document.getElementById('finEndSalaryBtn'); if(endBtn){endBtn.textContent=endTx?'تم':'استلام';endBtn.disabled=!!endTx;}
  const earlyScheduled=finance.fixedExpenses.filter(x=>fixedDueDay(x)<15).reduce((s,x)=>s+Number(x.amount||0),0)+finance.obligations.filter(x=>(x.dueDate||'').slice(0,7)===month&&Number((x.dueDate||'').slice(8,10))<15).reduce((s,x)=>s+Number(x.amount||0),0);
  const lateScheduled=finance.fixedExpenses.filter(x=>fixedDueDay(x)>=15).reduce((s,x)=>s+Number(x.amount||0),0)+finance.obligations.filter(x=>(x.dueDate||'').slice(0,7)===month&&Number((x.dueDate||'').slice(8,10))>=15).reduce((s,x)=>s+Number(x.amount||0),0);
  setText('finEarlyScheduled',money(earlyScheduled)); setText('finLateScheduled',money(lateScheduled));
  renderFlowPeriod('earlyFlowList',1,14); renderFlowPeriod('lateFlowList',15,daysInCurrentMonth());
  const status = document.getElementById('finGoalStatus');
  if (status) {
    if (!finance.goals.length) status.textContent = 'أضف أهدافك المالية حتى تظهر الخطة الشهرية.';
    else if (surplus <= 0) status.textContent = 'إجمالي الراتبين لا يغطي المصاريف الثابتة حاليًا. راجع الخطة الشهرية.';
    else if (goalNeed <= surplus) status.textContent = 'الفائض الشهري بعد المصاريف الثابتة يغطي الاحتياج الشهري الحالي لجميع الأهداف النشطة.';
    else status.textContent = 'الفائض الحالي غير كافٍ لتغطية الاحتياج الكامل. بحسب القاعدة المعتمدة يجب أن يستمر التقدم في جميع الأهداف النشطة بدل تجميد بعضها.';
  }
  renderList('fixedList', finance.fixedExpenses, x => financeRow(x.title, `${x.category||'مصروف ثابت'} • ${fixedTimingLabel(x)}`, money(x.amount), 'expense', x.id, 'fixed'));
  const sortedTx = [...finance.transactions].sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  renderList('transactionList', sortedTx, x => financeRow(x.note||x.category||(x.type==='income'?'دخل':'مصروف'), `${x.category||''} • ${arabicDate(x.date)}`, `${x.type==='income'?'+':'−'} ${money(x.amount)}`, x.type, x.id, 'transaction'));
  const sortedOb = [...finance.obligations].sort((a,b)=>(a.dueDate||'9999').localeCompare(b.dueDate||'9999'));
  renderList('obligationList', sortedOb, x => financeRow(x.title, `${txForObligation(x.id)?'مدفوع':'الاستحقاق'}: ${arabicDate(x.dueDate)}`, money(x.amount), 'expense', x.id, 'obligation', txForObligation(x.id)?'':`<button data-fin-pay-obligation="${x.id}">تم الدفع</button>`));
  const goals = document.getElementById('goalList'); if(!goals) return; goals.innerHTML='';
  if (!finance.goals.length) goals.innerHTML = emptyRow('لم تضف أهدافًا مالية بعد.');
  else finance.goals.forEach(g => {
    const remaining = Math.max(0, Number(g.target||0)-Number(g.saved||0)); const need = remaining/monthsUntil(g.deadline); const pctg = Number(g.target)>0 ? Math.min(100, Number(g.saved||0)/Number(g.target)*100) : 0;
    const el=document.createElement('div'); el.className='finance-row';
    el.innerHTML=`<div><div class="row-title">${escapeHTML(g.title)}</div><div class="row-meta">الهدف ${money(g.target)} • ${arabicDate(g.deadline)}</div></div><div class="row-amount income">${Math.round(pctg).toLocaleString('ar-BH')}٪</div><div class="goal-progress"><span style="width:${pctg}%"></span></div><div class="goal-detail"><span>المتبقي ${money(remaining)}</span><span>المطلوب شهريًا ${money(need)}</span></div><div class="row-actions"><button data-fin-delete="goal" data-id="${g.id}">حذف</button></div>`;
    goals.appendChild(el);
  });
}
function financeRow(title, meta, amount, type, id, kind, extraAction=''){ return `<div class="finance-row"><div><div class="row-title">${escapeHTML(title)}</div><div class="row-meta">${escapeHTML(meta)}</div></div><div class="row-amount ${type}">${amount}</div><div class="row-actions">${extraAction}<button data-fin-delete="${kind}" data-id="${id}">حذف</button></div></div>`; }
function openFinanceForm(action){
  currentFinanceAction=action; let title='', html=''; const today=todayKey();
  if(action==='balance'){ title='تعديل المبلغ الحالي'; html=field('المبلغ الموجود فعليًا الآن','amount','number',`step="0.001" min="0" value="${finance.currentBalance||''}"`)+`<div class="form-hint">هذا هو رصيدك الفعلي الآن. تستطيع تعديله يدويًا في أي وقت لتصحيح الرصيد.</div>`; }
  if(action==='salaryPlan'){ title='رواتب الشهر'; html=field('راتب يوم 15','midSalary','number',`step="0.001" min="0" value="${finance.salaries?.mid||''}"`)+field('راتب نهاية الشهر','endSalary','number',`step="0.001" min="0" value="${finance.salaries?.end||''}"`)+`<div class="form-hint">المواعيد ثابتة: يوم 15، وآخر يوم من كل شهر.</div>`; }
  if(action==='expense'){ title='تسجيل مصروف'; html=field('المبلغ','amount','number','step="0.001" min="0"')+selectField('التصنيف','category',['طعام','مواصلات','فواتير','تسوق','منزل','ترفيه','صدقة','أخرى'])+optionalField('ملاحظة','note','text','placeholder="اختياري"')+field('التاريخ','date','date',`value="${today}"`); }
  if(action==='extraIncome'){ title='تسجيل دخل إضافي'; html=field('المبلغ','amount','number','step="0.001" min="0"')+selectField('التصنيف','category',['دخل إضافي','مكافأة','هدية','استرداد','أخرى'])+optionalField('ملاحظة','note','text','placeholder="اختياري"')+field('التاريخ','date','date',`value="${today}"`); }
  if(action==='fixed'){ title='إضافة مصروف ثابت'; html=field('اسم المصروف','title','text','placeholder="مثال: إيجار أو اشتراك"')+field('المبلغ الشهري','amount','number','step="0.001" min="0"')+selectField('التصنيف','category',['سكن','فواتير','قسط','اشتراك','مواصلات','أخرى'])+selectField('الفترة','timing',['بداية الشهر','منتصف الشهر'])+optionalField('يوم الاستحقاق','dueDay','number','min="1" max="31" placeholder="مثال: 3 أو 18"')+`<div class="form-hint">إذا تركت اليوم فارغًا، يعتمد التطبيق يوم 1 لبداية الشهر ويوم 15 لمنتصف الشهر.</div>`; }
  if(action==='obligation'){ title='إضافة التزام مالي'; html=field('اسم الالتزام','title','text','placeholder="مثال: قسط أو مبلغ مستحق"')+field('المبلغ','amount','number','step="0.001" min="0"')+field('تاريخ الاستحقاق','dueDate','date'); }
  if(action==='goal'){ title='إضافة هدف مالي'; html=field('اسم الهدف','title','text','placeholder="مثال: سداد دين أو سفر"')+field('مبلغ الهدف','target','number','step="0.001" min="0"')+field('المبلغ المحقق حاليًا','saved','number','step="0.001" min="0" value="0"')+field('موعد الإنجاز','deadline','date'); }
  financeFormTitle.textContent=title; financeFormFields.innerHTML=html; financeSheet.hidden=false;
}
function closeFinanceForm(){ financeSheet.hidden=true; currentFinanceAction=null; financeForm.reset(); }
function deleteFinance(kind,id){
  const map={fixed:'fixedExpenses',transaction:'transactions',obligation:'obligations',goal:'goals'}; const key=map[kind]; if(!key)return;
  if(kind==='transaction'){
    const tx=finance.transactions.find(x=>x.id===id); if(tx?.affectsBalance){ finance.currentBalance += tx.type==='expense'?Number(tx.amount||0):-Number(tx.amount||0); }
  }
  finance[key]=finance[key].filter(x=>x.id!==id); saveFinance();
}
function receiveSalary(key){
  const amount=Number(finance.salaries?.[key]||0); if(amount<=0){openModal('حدد قيمة الراتب أولًا','اضغط «تعديل الرواتب» وسجّل قيمة هذا الراتب قبل استلامه.','💵');return;}
  if(txForSalary(key)){openModal('تم تسجيل الراتب','هذا الراتب مسجل كمستلم لهذا الشهر بالفعل.','✓');return;}
  const date=todayKey(); const label=key==='mid'?'راتب يوم 15':'راتب نهاية الشهر';
  finance.transactions.push({id:makeId(),type:'income',amount,category:'راتب',note:label,date,source:'salary',salaryKey:key,month:currentMonthKey(),affectsBalance:true}); finance.currentBalance+=amount; addTimeline(`استلمت ${label} بقيمة ${money(amount)}`,'مالي','💵'); saveFinance();
}
function payFixed(id){
  const x=finance.fixedExpenses.find(v=>v.id===id); if(!x||txForFixed(id))return; const amount=Number(x.amount||0); finance.transactions.push({id:makeId(),type:'expense',amount,category:x.category||'مصروف ثابت',note:x.title,date:todayKey(),source:'fixed',fixedExpenseId:id,month:currentMonthKey(),affectsBalance:true}); finance.currentBalance-=amount; addTimeline(`دفعت المصروف الثابت: ${x.title} (${money(amount)})`,'مالي','📌'); saveFinance();
}
function payObligation(id){
  const x=finance.obligations.find(v=>v.id===id); if(!x||txForObligation(id))return; const amount=Number(x.amount||0); finance.transactions.push({id:makeId(),type:'expense',amount,category:'التزامات',note:x.title,date:todayKey(),source:'obligation',obligationId:id,affectsBalance:true}); finance.currentBalance-=amount; addTimeline(`دفعت التزامًا: ${x.title} (${money(amount)})`,'مالي','🗓️'); saveFinance();
}
financeForm.addEventListener('submit',e=>{
  e.preventDefault(); const fd=Object.fromEntries(new FormData(financeForm).entries());
  if(currentFinanceAction==='balance'){ finance.currentBalance=Number(fd.amount||0); addTimeline(`عدّلت المبلغ الحالي إلى ${money(finance.currentBalance)}`,'مالي','💰'); }
  if(currentFinanceAction==='salaryPlan'){ finance.salaries={mid:Number(fd.midSalary||0),end:Number(fd.endSalary||0)}; finance.monthlyIncome=salaryTotal(); addTimeline(`حدّثت رواتب الشهر: ${money(finance.monthlyIncome)}`,'مالي','💵'); }
  if(currentFinanceAction==='expense'){ const amount=Number(fd.amount||0); finance.transactions.push({id:makeId(),type:'expense',amount,category:fd.category,note:fd.note,date:fd.date,affectsBalance:true}); finance.currentBalance-=amount; addTimeline(`سجلت مصروفًا بقيمة ${money(amount)}`,fd.category,'💳'); }
  if(currentFinanceAction==='extraIncome'){ const amount=Number(fd.amount||0); finance.transactions.push({id:makeId(),type:'income',amount,category:fd.category,note:fd.note,date:fd.date,affectsBalance:true}); finance.currentBalance+=amount; addTimeline(`سجلت دخلًا إضافيًا بقيمة ${money(amount)}`,fd.category,'💵'); }
  if(currentFinanceAction==='fixed'){ const timing=fd.timing==='منتصف الشهر'?'mid':'early'; const dueDay=Number(fd.dueDay|| (timing==='mid'?15:1)); finance.fixedExpenses.push({id:makeId(),title:fd.title,amount:Number(fd.amount),category:fd.category,timing,dueDay}); addTimeline(`أضفت مصروفًا ثابتًا: ${fd.title}`,'مالي','📌'); }
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
  const qrm=document.getElementById('religionQuranReaderMeta'); if(qrm){ const r=ensureQuranReaderState(); qrm.textContent=r.lastAt?`آخر قراءة: ${quranSurahNames[r.lastSurah-1]||'القرآن'} • آية ${toArabicDigits(r.lastAyah)}`:'١١٤ سورة • ٦٢٣٦ آية • جاهز للقراءة'; }
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
function dailyHadith(){
  if(!knowledge.hadiths.length)return null;
  const date=todayKey();
  const validIds=new Set(knowledge.hadiths.map(x=>x.id));
  let state=loadJSON(DAILY_HADITH_STATE_KEY,{date:'',currentId:'',shownIds:[]});
  state.shownIds=Array.isArray(state.shownIds)?state.shownIds.filter(id=>validIds.has(id)):[];
  if(state.date===date && state.currentId && validIds.has(state.currentId)) return knowledge.hadiths.find(x=>x.id===state.currentId)||null;
  let candidates=knowledge.hadiths.filter(x=>!state.shownIds.includes(x.id));
  if(!candidates.length){state.shownIds=[];candidates=[...knowledge.hadiths];}
  const d=new Date(); const seed=Math.floor(new Date(d.getFullYear(),d.getMonth(),d.getDate()).getTime()/86400000);
  const had=candidates[seed%candidates.length];
  state={date,currentId:had.id,shownIds:[...state.shownIds,had.id]};
  try{localStorage.setItem(DAILY_HADITH_STATE_KEY,JSON.stringify(state));}catch{}
  return had;
}

function normalizeHadithForCompare(text=''){
  return String(text).normalize('NFKC')
    .replace(/[\u200e\u200f\u202a-\u202e\u2066-\u2069]/g,'')
    .replace(/[\u064b-\u065f\u0670\u06d6-\u06ed]/g,'')
    .replace(/ـ/g,'')
    .replace(/[أإآٱ]/g,'ا')
    .replace(/ى/g,'ي')
    .replace(/[«»“”"'`،؛:,.!?؟()\[\]{}\-–—_/\\]/g,'')
    .replace(/\s+/g,'')
    .trim();
}
function cleanHadithChunk(text=''){
  return String(text)
    .replace(/[\u200e\u200f\u202a-\u202e\u2066-\u2069]/g,'')
    .replace(/\r\n?/g,'\n')
    .split('\n').map(line=>line.replace(/[ \t]+/g,' ').trim()).join('\n')
    .replace(/\n{3,}/g,'\n\n').trim();
}
function parseHadithBatch(raw=''){
  const text=String(raw).replace(/\r\n?/g,'\n').trim();
  if(!text)return [];
  const separator=/^\s*(?:-{3,}|—{3,}|–{3,}|\*{3,})\s*$/m;
  let parts;
  if(separator.test(text)) parts=text.split(/^\s*(?:-{3,}|—{3,}|–{3,}|\*{3,})\s*$/m);
  else parts=text.split(/\n\s*\n+/);
  return parts.map(cleanHadithChunk).filter(x=>x.length>=4);
}
function analyzeHadithBatch(){
  const topic=(document.getElementById('hadithBatchTopic')?.value||'').trim();
  const raw=document.getElementById('hadithBatchText')?.value||'';
  const items=parseHadithBatch(raw);
  const existing=new Set(knowledge.hadiths.map(x=>normalizeHadithForCompare(x.text)).filter(Boolean));
  const batchSeen=new Set(); let duplicates=0;
  const analyzed=items.map(text=>{
    const key=normalizeHadithForCompare(text);
    const duplicate=!key || existing.has(key) || batchSeen.has(key);
    if(duplicate)duplicates++; else batchSeen.add(key);
    return {text,key,duplicate};
  });
  return {topic,items:analyzed,detected:analyzed.length,newCount:analyzed.length-duplicates,duplicateCount:duplicates};
}
function renderHadithManagerStats(){
  const total=knowledge.hadiths.length;
  const topics=new Set(knowledge.hadiths.map(x=>(x.category||x.topic||'').trim()).filter(Boolean)).size;
  const favorites=knowledge.hadiths.filter(x=>x.favorite).length;
  setText('hadithSettingsCount',`${total.toLocaleString('ar-BH')} حديث`);
  setText('hadithManagerTotal',total.toLocaleString('ar-BH'));
  setText('hadithManagerTopics',topics.toLocaleString('ar-BH'));
  setText('hadithManagerFavorites',favorites.toLocaleString('ar-BH'));
}
function renderHadithBatchPreview(result=analyzeHadithBatch()){
  const box=document.getElementById('hadithBatchPreview'); if(!box)return result;
  box.hidden=false;
  const topic=result.topic||'بدون موضوع';
  setText('hadithPreviewTitle',result.detected?`الموضوع: ${topic}`:'لم يتم اكتشاف أحاديث');
  setText('hadithPreviewStatus',`${result.newCount.toLocaleString('ar-BH')} جديد`);
  setText('hadithDetectedCount',result.detected.toLocaleString('ar-BH'));
  setText('hadithNewCount',result.newCount.toLocaleString('ar-BH'));
  setText('hadithDuplicateCount',result.duplicateCount.toLocaleString('ar-BH'));
  const list=document.getElementById('hadithPreviewList');
  if(list){
    if(!result.detected) list.innerHTML='<div class="finance-empty">الصق حديثًا واحدًا على الأقل. إذا كانت لديك عدة أحاديث، اترك سطرًا فارغًا بين كل حديث والآخر.</div>';
    else list.innerHTML=result.items.slice(0,5).map((x,i)=>`<div class="hadith-preview-item ${x.duplicate?'duplicate':''}"><span>${x.duplicate?'مكرر':'جديد'}</span><div><b>حديث ${(i+1).toLocaleString('ar-BH')}</b><p>${escapeHTML(x.text.length>180?x.text.slice(0,180)+'…':x.text)}</p></div></div>`).join('')+(result.items.length>5?`<div class="hadith-preview-more">+ ${(result.items.length-5).toLocaleString('ar-BH')} حديث آخر</div>`:'');
  }
  return result;
}
function renderHadithManager(){ renderHadithManagerStats(); const box=document.getElementById('hadithBatchPreview'); if(box && !(document.getElementById('hadithBatchText')?.value||'').trim()) box.hidden=true; }
function addHadithBatch(event){
  event?.preventDefault();
  const result=renderHadithBatchPreview();
  if(!result.topic) return openModal('اكتب موضوع الأحاديث','اكتب اسم الموضوع أولًا حتى يربط حياتي المجموعة به.','📚');
  if(!result.detected) return openModal('لم أجد أحاديث','الصق الأحاديث في المربع، واترك سطرًا فارغًا بين كل حديث والآخر أو استخدم --- كفاصل.','📋');
  const fresh=result.items.filter(x=>!x.duplicate);
  if(!fresh.length) return openModal('لا توجد أحاديث جديدة',`كل الأحاديث المكتشفة (${result.detected.toLocaleString('ar-BH')}) موجودة مسبقًا في القاعدة أو مكررة داخل نفس المجموعة.`,'♻️');
  const batchId=makeId(), importedAt=new Date().toISOString();
  const before=[...knowledge.hadiths];
  knowledge.hadiths.push(...fresh.map(x=>({id:makeId(),text:x.text,source:'',category:result.topic,topic:result.topic,favorite:false,readDates:[],batchId,importedAt})));
  try{
    localStorage.setItem(KNOWLEDGE_KEY,JSON.stringify(knowledge));
    scheduleSnapshot();renderKnowledge();renderDashboard();renderHadithManagerStats();
  }catch(e){
    knowledge.hadiths=before;
    return openModal('مساحة التخزين غير كافية','تعذر حفظ هذه المجموعة على الجهاز. احتفظ بنسخة احتياطية، ثم قلّل حجم الدفعة أو ننتقل لاحقًا إلى قاعدة بيانات أكبر.','⚠️');
  }
  addTimeline(`أضفت ${fresh.length.toLocaleString('ar-BH')} حديثًا • ${result.topic}`,'معرفتي','📚');
  const form=document.getElementById('hadithBatchForm'); if(form)form.reset();
  const box=document.getElementById('hadithBatchPreview'); if(box)box.hidden=true;
  openModal('تمت إضافة المجموعة',`أضيف ${fresh.length.toLocaleString('ar-BH')} حديثًا إلى «${result.topic}»${result.duplicateCount?`، وتم تجاهل ${result.duplicateCount.toLocaleString('ar-BH')} مكرر.`:'.'} ستدخل الأحاديث الجديدة تلقائيًا ضمن حديث اليوم.`,'✅');
}

function renderKnowledge(){
  renderHadithManagerStats();
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

  if(action==='rel:person'){ relationships.people.push({id:makeId(),name:fd.name,circle:fd.circle,cadenceDays:Number(fd.cadenceDays||0),lastContact:fd.lastContact,lastMeeting:fd.lastMeeting,birthday:fd.birthday,howMet:fd.howMet,notes:fd.notes}); addTimeline(`أضفت شخصًا إلى علاقاتي: ${fd.name}`,'علاقاتي','👤'); saveRelationships(); }
  if(action==='rel:contact' || action.startsWith('rel:contact:')){ const personId=action.startsWith('rel:contact:')?action.split(':')[2]:fd.personId; relationships.interactions.push({id:makeId(),personId,type:fd.type,date:fd.date,note:fd.note}); const person=relationships.people.find(p=>p.id===personId); if(person){person.lastContact=fd.date;if(fd.type==='لقاء'||fd.type==='زيارة')person.lastMeeting=fd.date;} addTimeline(`سجلت ${fd.type} مع ${personName(personId)}`,'علاقاتي','☎️'); saveRelationships(); }
  if(action==='rel:event'){ relationships.events.push({id:makeId(),title:fd.title,date:fd.date,personId:fd.personId,place:fd.place,status:fd.status,notes:fd.notes}); addTimeline(`أضفت مناسبة: ${fd.title}`,'علاقاتي','🎉'); saveRelationships(); }
  if(action==='rel:promise'){ relationships.promises.push({id:makeId(),title:fd.title,personId:fd.personId,dueDate:fd.dueDate,status:'مفتوح',notes:fd.notes}); addTimeline(`أضفت وعدًا: ${fd.title}`,'علاقاتي','🤝'); saveRelationships(); }
  if(action==='rel:gift'){ relationships.gifts.push({id:makeId(),idea:fd.idea,personId:fd.personId,budget:Number(fd.budget||0),status:fd.status}); addTimeline(`أضفت فكرة هدية: ${fd.idea}`,'علاقاتي','🎁'); saveRelationships(); }

  if(action==='family:member'){ family.members.push({id:makeId(),name:fd.name,relationship:fd.relationship,birthDate:fd.birthDate,parent1Id:fd.parent1Id,parent2Id:fd.parent2Id,notes:fd.notes}); addTimeline(`أضفت فردًا للعائلة: ${fd.name}`,'عائلتي','👨‍👩‍👧'); saveFamily(); }
  if(action==='family:album'){ family.albums.push({id:makeId(),title:fd.title,date:fd.date,description:fd.description,coverPhotoId:''}); addTimeline(`أنشأت ألبومًا عائليًا: ${fd.title}`,'عائلتي','🖼️'); saveFamily(); }
  if(action==='family:task'){ family.tasks.push({id:makeId(),title:fd.title,assignee:fd.assignee,dueDate:fd.dueDate,note:fd.note,done:false}); addTimeline(`أضفت مسؤولية عائلية: ${fd.title}`,'عائلتي','✅'); saveFamily(); }
  if(action==='family:photo'){ pendingFamilyAlbumId=fd.albumId; closeDomainForm(); document.getElementById('familyPhotoInput')?.click(); return; }
  closeDomainForm();
});


// ---------------- Relationships ----------------
function personName(id){ return relationships.people.find(p=>p.id===id)?.name || 'بدون شخص محدد'; }
function daysSince(dateStr){ if(!dateStr)return Infinity; const a=new Date(dateStr+'T12:00:00'), b=new Date(); return Math.floor((b-a)/86400000); }
function daysUntil(dateStr){ if(!dateStr)return Infinity; const a=new Date(dateStr+'T12:00:00'), b=new Date(); b.setHours(12,0,0,0); return Math.ceil((a-b)/86400000); }
function entitySelectField(label,name,items,placeholder='اختر',required=true){
  return `<div class="form-field"><label for="ff-${name}">${label}</label><select id="ff-${name}" name="${name}" ${required?'required':''}><option value="">${escapeHTML(placeholder)}</option>${items.map(x=>`<option value="${escapeHTML(x.id)}">${escapeHTML(x.name||x.title)}</option>`).join('')}</select></div>`;
}
function relationshipDuePeople(){
  return relationships.people.filter(p=>Number(p.cadenceDays||0)>0 && (!p.lastContact || daysSince(p.lastContact)>=Number(p.cadenceDays))).sort((a,b)=>(daysSince(b.lastContact)-Number(b.cadenceDays||0))-(daysSince(a.lastContact)-Number(a.cadenceDays||0)));
}
function renderRelationships(){
  const due=relationshipDuePeople(); const upcoming=relationships.events.filter(e=>{const d=daysUntil(e.date);return d>=0&&d<=30;}); const open=relationships.promises.filter(p=>p.status!=='مكتمل');
  setText('relPeopleCount',relationships.people.length.toLocaleString('ar-BH')); setText('relDueCount',due.length.toLocaleString('ar-BH')); setText('relUpcomingCount',upcoming.length.toLocaleString('ar-BH')); setText('relOpenPromises',open.length.toLocaleString('ar-BH'));
  setText('relFollowupSummary', due.length?`${due.length.toLocaleString('ar-BH')} شخصًا وصل أو تجاوز موعد التواصل الذي حددته.`:'لا يوجد شخص متأخر حسب وتيرة التواصل المسجلة.');
  renderList('relDueList',due,p=>`<div class="domain-row"><div><b>👤 ${escapeHTML(p.name)}</b><small>${escapeHTML(p.circle||'بدون دائرة')} • ${p.lastContact?`آخر تواصل منذ ${daysSince(p.lastContact).toLocaleString('ar-BH')} يوم`:'لم يُسجل تواصل بعد'} • الوتيرة ${Number(p.cadenceDays).toLocaleString('ar-BH')} يوم</small></div><button class="row-toggle" data-rel-quick-contact="${p.id}">☎️</button></div>`,'لا يوجد أحد يحتاج متابعة الآن.');
  const interactions=[...relationships.interactions].sort((a,b)=>(b.date||'').localeCompare(a.date||'')); renderList('relInteractionList',interactions.slice(0,12),x=>`<div class="domain-row"><div><b>${x.type==='لقاء'?'🤝':'☎️'} ${escapeHTML(personName(x.personId))}</b><small>${escapeHTML(x.type)} • ${arabicDate(x.date)}${x.note?` • ${escapeHTML(x.note)}`:''}</small></div><button class="row-delete" data-rel-delete="interaction" data-id="${x.id}">حذف</button></div>`,'لا يوجد تواصل مسجل بعد.');
  renderList('relPeopleList',relationships.people,p=>`<div class="domain-row"><div><b>👤 ${escapeHTML(p.name)}</b><small>${escapeHTML(p.circle||'بدون دائرة')}${p.lastContact?` • آخر تواصل ${arabicDate(p.lastContact)}`:''}${p.birthday?` • مناسبة ${arabicDate(p.birthday)}`:''}</small>${p.notes?`<small>${escapeHTML(p.notes)}</small>`:''}</div><button class="row-toggle" data-rel-quick-contact="${p.id}">☎️</button><button class="row-delete" data-rel-delete="person" data-id="${p.id}">حذف</button></div>`,'لم تضف أشخاصًا بعد.');
  const events=[...relationships.events].sort((a,b)=>(a.date||'9999').localeCompare(b.date||'9999')); renderList('relEventList',events,e=>`<div class="domain-row"><div><b>🎉 ${escapeHTML(e.title)}</b><small>${arabicDate(e.date)}${e.personId?` • ${escapeHTML(personName(e.personId))}`:''}${e.place?` • ${escapeHTML(e.place)}`:''} • ${escapeHTML(e.status||'قادم')}</small></div><button class="row-delete" data-rel-delete="event" data-id="${e.id}">حذف</button></div>`,'لا توجد مناسبات بعد.');
  const promises=[...relationships.promises].sort((a,b)=>(a.dueDate||'9999').localeCompare(b.dueDate||'9999')); renderList('relPromiseList',promises,p=>`<div class="domain-row ${p.status==='مكتمل'?'done-row':''}"><div><b>🤝 ${escapeHTML(p.title)}</b><small>${p.personId?`${escapeHTML(personName(p.personId))} • `:''}${p.dueDate?arabicDate(p.dueDate):'بدون موعد'}${p.notes?` • ${escapeHTML(p.notes)}`:''}</small></div><button class="row-toggle" data-rel-toggle-promise="${p.id}">${p.status==='مكتمل'?'↺':'✓'}</button><button class="row-delete" data-rel-delete="promise" data-id="${p.id}">حذف</button></div>`,'لا توجد وعود مسجلة.');
  renderList('relGiftList',relationships.gifts,g=>`<div class="domain-row ${g.status==='تمت'?'done-row':''}"><div><b>🎁 ${escapeHTML(g.idea)}</b><small>${g.personId?`${escapeHTML(personName(g.personId))} • `:''}${g.budget?`الميزانية ${money(g.budget)} • `:''}${escapeHTML(g.status||'فكرة')}</small></div><button class="row-toggle" data-rel-toggle-gift="${g.id}">${g.status==='تمت'?'↺':'✓'}</button><button class="row-delete" data-rel-delete="gift" data-id="${g.id}">حذف</button></div>`,'لا توجد أفكار هدايا بعد.');
}
function openRelationshipForm(action, preselected=''){
  const people=relationships.people;
  if(action==='person') return openDomainForm('علاقاتي','إضافة شخص',field('الاسم','name','text','placeholder="الاسم"')+selectField('الدائرة','circle',['مقربون','أصدقاء','زملاء العمل','معارف','أخرى'])+optionalField('كل كم يوم تريد التواصل؟','cadenceDays','number','min="0" step="1" placeholder="مثال: 30"')+optionalField('آخر تواصل','lastContact','date')+optionalField('آخر لقاء','lastMeeting','date')+optionalField('مناسبة مهمة / ميلاد','birthday','date')+optionalField('كيف تعرفتما؟','howMet','text','placeholder="اختياري"')+textareaField('ملاحظات','notes','placeholder="أشياء تريد تذكرها في المرة القادمة"'),'rel:person');
  if(action==='contact') { if(!people.length)return openModal('أضف شخصًا أولًا','حتى نسجل التواصل نحتاج شخصًا واحدًا على الأقل في «علاقاتي».','👤'); return openDomainForm('علاقاتي','تسجيل تواصل',entitySelectField('الشخص','personId',people,'اختر الشخص')+selectField('النوع','type',['اتصال','رسالة','لقاء','زيارة','أخرى'])+field('التاريخ','date','date',`value="${todayKey()}"`)+textareaField('آخر حديث بيننا / ملاحظة','note','placeholder="مثال: كان يبحث عن وظيفة؛ اسأله ماذا حدث"'),'rel:contact'); }
  if(action==='event') return openDomainForm('علاقاتي','إضافة مناسبة أو دعوة',field('العنوان','title','text','placeholder="مثال: زواج، عشاء، زيارة"')+field('التاريخ','date','date')+entitySelectField('مرتبط بشخص','personId',people,'اختياري',false)+optionalField('المكان','place','text','placeholder="اختياري"')+selectField('الحالة','status',['قادم','سأحضر','اعتذار','تم'])+textareaField('ملاحظات','notes','placeholder="هدية، مهمة، تفاصيل..."'),'rel:event');
  if(action==='promise') return openDomainForm('علاقاتي','إضافة وعد أو التزام',field('الوعد / المهمة','title','text','placeholder="مثال: أرسل الملف يوم الخميس"')+entitySelectField('لمن؟','personId',people,'اختياري',false)+optionalField('موعد التنفيذ','dueDate','date')+textareaField('ملاحظات','notes'),'rel:promise');
  if(action==='gift') return openDomainForm('علاقاتي','فكرة هدية',field('فكرة الهدية','idea','text','placeholder="مثال: كتاب أو ساعة"')+entitySelectField('لمن؟','personId',people,'اختياري',false)+optionalField('ميزانية تقريبية بالدينار','budget','number','step="0.001" min="0"')+selectField('الحالة','status',['فكرة','سأشتريها','تمت']),'rel:gift');
  if(action==='contact-preselected' && preselected) { if(!people.length)return; openDomainForm('علاقاتي','تسجيل تواصل',entitySelectField('الشخص','personId',people,'اختر الشخص')+selectField('النوع','type',['اتصال','رسالة','لقاء','زيارة','أخرى'])+field('التاريخ','date','date',`value="${todayKey()}"`)+textareaField('آخر حديث بيننا / ملاحظة','note'),`rel:contact:${preselected}`); const sel=document.getElementById('ff-personId'); if(sel)sel.value=preselected; return; }
}
function deleteRelationship(kind,id){
  const map={person:'people',interaction:'interactions',event:'events',promise:'promises',gift:'gifts'}; const key=map[kind]; if(!key)return;
  if(kind==='person'){ relationships.interactions=relationships.interactions.filter(x=>x.personId!==id); relationships.events.forEach(x=>{if(x.personId===id)x.personId=''}); relationships.promises.forEach(x=>{if(x.personId===id)x.personId=''}); relationships.gifts.forEach(x=>{if(x.personId===id)x.personId=''}); }
  relationships[key]=relationships[key].filter(x=>x.id!==id); saveRelationships();
}
function togglePromise(id){ const x=relationships.promises.find(x=>x.id===id); if(!x)return; x.status=x.status==='مكتمل'?'مفتوح':'مكتمل'; if(x.status==='مكتمل')addTimeline(`أنجزت وعدًا: ${x.title}`,'علاقاتي','🤝'); saveRelationships(); }
function toggleGift(id){ const x=relationships.gifts.find(x=>x.id===id); if(!x)return; x.status=x.status==='تمت'?'فكرة':'تمت'; if(x.status==='تمت')addTimeline(`أكملت هدية: ${x.idea}`,'علاقاتي','🎁'); saveRelationships(); }

// ---------------- Family + IndexedDB media ----------------
const FAMILY_DB='hayati-family-media-v1', FAMILY_STORE='photos'; let pendingFamilyAlbumId='';
function familyMemberName(id){ return family.members.find(m=>m.id===id)?.name || ''; }
function openFamilyDB(){ return new Promise((resolve,reject)=>{ const req=indexedDB.open(FAMILY_DB,1); req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(FAMILY_STORE))db.createObjectStore(FAMILY_STORE,{keyPath:'id'});}; req.onsuccess=()=>resolve(req.result); req.onerror=()=>reject(req.error); }); }
async function putPhotoRecord(rec){ const db=await openFamilyDB(); return new Promise((resolve,reject)=>{const tx=db.transaction(FAMILY_STORE,'readwrite');tx.objectStore(FAMILY_STORE).put(rec);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);}); }
async function getPhotoRecord(id){ const db=await openFamilyDB(); return new Promise((resolve,reject)=>{const req=db.transaction(FAMILY_STORE).objectStore(FAMILY_STORE).get(id);req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error);}); }
async function getAllPhotoRecords(){ const db=await openFamilyDB(); return new Promise((resolve,reject)=>{const req=db.transaction(FAMILY_STORE).objectStore(FAMILY_STORE).getAll();req.onsuccess=()=>resolve(req.result||[]);req.onerror=()=>reject(req.error);}); }
async function deletePhotoRecord(id){ const db=await openFamilyDB(); return new Promise((resolve,reject)=>{const tx=db.transaction(FAMILY_STORE,'readwrite');tx.objectStore(FAMILY_STORE).delete(id);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);}); }
async function clearPhotoStore(){ const db=await openFamilyDB(); return new Promise((resolve,reject)=>{const tx=db.transaction(FAMILY_STORE,'readwrite');tx.objectStore(FAMILY_STORE).clear();tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);}); }
function nextBirthdayDays(dateStr){ if(!dateStr)return Infinity; const src=new Date(dateStr+'T12:00:00'), now=new Date(); let d=new Date(now.getFullYear(),src.getMonth(),src.getDate(),12); if(d<now)d.setFullYear(d.getFullYear()+1); return Math.ceil((d-now)/86400000); }
async function renderFamily(){
  const upcoming=family.members.filter(m=>nextBirthdayDays(m.birthDate)<=30);
  setText('familyMembersCount',family.members.length.toLocaleString('ar-BH')); setText('familyUpcomingCount',upcoming.length.toLocaleString('ar-BH')); setText('familyAlbumsCount',family.albums.length.toLocaleString('ar-BH')); setText('familyPhotosCount',family.photos.length.toLocaleString('ar-BH'));
  setText('familyMemorySummary',family.albums.length?`${family.albums.length.toLocaleString('ar-BH')} ألبوم و${family.photos.length.toLocaleString('ar-BH')} صورة محفوظة على هذا الجهاز.`:'أنشئ أول ألبوم عائلي وارفع الصور من الآيفون.');
  const tree=document.getElementById('familyTree'); if(tree){tree.innerHTML=''; if(!family.members.length)tree.innerHTML=emptyRow('أضف أفراد العائلة حتى تتكون الشجرة تدريجيًا.'); else family.members.forEach(m=>{const parents=[familyMemberName(m.parent1Id),familyMemberName(m.parent2Id)].filter(Boolean); tree.insertAdjacentHTML('beforeend',`<div class="tree-person"><div class="tree-avatar">${escapeHTML((m.name||'؟').trim().charAt(0)||'؟')}</div><div><b>${escapeHTML(m.name)}</b><small>${escapeHTML(m.relationship||'فرد من العائلة')}${parents.length?` • الوالدان: ${escapeHTML(parents.join(' و '))}`:''}${m.birthDate?` • ${arabicDate(m.birthDate)}`:''}</small></div><button class="row-delete" data-family-delete="member" data-id="${m.id}">حذف</button></div>`);});}
  renderList('familyTaskList',family.tasks,t=>`<div class="domain-row ${t.done?'done-row':''}"><div><b>✅ ${escapeHTML(t.title)}</b><small>${t.dueDate?arabicDate(t.dueDate):'بدون موعد'}${t.assignee?` • ${escapeHTML(t.assignee)}`:''}${t.note?` • ${escapeHTML(t.note)}`:''}</small></div><button class="row-toggle" data-family-toggle-task="${t.id}">${t.done?'↺':'✓'}</button><button class="row-delete" data-family-delete="task" data-id="${t.id}">حذف</button></div>`,'لا توجد مسؤوليات عائلية مسجلة.');
  await renderFamilyAlbums();
}
async function renderFamilyAlbums(){ const wrap=document.getElementById('familyAlbumList'); if(!wrap)return; wrap.innerHTML=''; if(!family.albums.length){wrap.innerHTML=emptyRow('لم تنشئ ألبومات بعد.');return;} for(const a of [...family.albums].sort((x,y)=>(y.date||'').localeCompare(x.date||''))){const photos=family.photos.filter(p=>p.albumId===a.id); const coverId=a.coverPhotoId||photos[0]?.id; const card=document.createElement('article'); card.className='album-card'; card.innerHTML=`<div class="album-cover" data-cover-for="${a.id}"><span>🖼️</span></div><div class="album-body"><b>${escapeHTML(a.title)}</b><small>${a.date?arabicDate(a.date):'بدون تاريخ'} • ${photos.length.toLocaleString('ar-BH')} صورة</small>${a.description?`<p>${escapeHTML(a.description)}</p>`:''}<div class="album-actions"><button data-family-add-photo="${a.id}">+ صور</button><button data-family-delete="album" data-id="${a.id}">حذف</button></div></div>`; wrap.appendChild(card); if(coverId){try{const rec=await getPhotoRecord(coverId); if(rec?.blob){const url=URL.createObjectURL(rec.blob); const el=card.querySelector('.album-cover'); el.innerHTML=`<img alt="غلاف ${escapeHTML(a.title)}" src="${url}">`;}}catch{}} } }
function openFamilyForm(action){
  if(action==='member'){const members=family.members; return openDomainForm('عائلتي','إضافة فرد',field('الاسم','name','text','placeholder="الاسم"')+optionalField('صلة القرابة','relationship','text','placeholder="مثال: أب، أم، أخ، ابنة..."')+optionalField('تاريخ الميلاد / المناسبة','birthDate','date')+entitySelectField('الأب / الوالد 1','parent1Id',members,'اختياري',false)+entitySelectField('الأم / الوالد 2','parent2Id',members,'اختياري',false)+textareaField('ملاحظات','notes'),'family:member');}
  if(action==='album') return openDomainForm('عائلتي','إنشاء ألبوم عائلي',field('اسم الألبوم','title','text','placeholder="مثال: رحلة عمان 2026"')+optionalField('التاريخ','date','date')+textareaField('الوصف','description','placeholder="اختياري"'),'family:album');
  if(action==='task') return openDomainForm('عائلتي','مسؤولية عائلية',field('المهمة','title','text','placeholder="مثال: شراء احتياجات المنزل"')+optionalField('المسؤول','assignee','text','placeholder="اختياري"')+optionalField('موعدها','dueDate','date')+textareaField('ملاحظة','note'),'family:task');
  if(action==='photo'){ if(!family.albums.length)return openModal('أنشئ ألبومًا أولًا','الصور تُضاف داخل ألبوم عائلي حتى تبقى مرتبة.','🖼️'); return openDomainForm('عائلتي','إضافة صور',entitySelectField('الألبوم','albumId',family.albums,'اختر الألبوم'),'family:photo'); }
}
async function deleteFamily(kind,id){
  if(kind==='member')family.members=family.members.filter(x=>x.id!==id);
  if(kind==='task')family.tasks=family.tasks.filter(x=>x.id!==id);
  if(kind==='photo'){family.photos=family.photos.filter(x=>x.id!==id);await deletePhotoRecord(id);}
  if(kind==='album'){const ids=family.photos.filter(x=>x.albumId===id).map(x=>x.id);for(const pid of ids)await deletePhotoRecord(pid); family.photos=family.photos.filter(x=>x.albumId!==id);family.albums=family.albums.filter(x=>x.id!==id);}
  saveFamily();
}
function toggleFamilyTask(id){const x=family.tasks.find(x=>x.id===id);if(!x)return;x.done=!x.done;if(x.done)addTimeline(`أنجزت مسؤولية عائلية: ${x.title}`,'عائلتي','✅');saveFamily();}
async function handleFamilyFiles(files,albumId){ const album=family.albums.find(a=>a.id===albumId); if(!album)return; let added=0; for(const file of [...files]){if(!file.type.startsWith('image/'))continue;const id=makeId();const meta={id,albumId,name:file.name||`photo-${id}`,type:file.type||'image/jpeg',createdAt:new Date().toISOString()};await putPhotoRecord({...meta,blob:file});family.photos.push(meta);if(!album.coverPhotoId)album.coverPhotoId=id;added++;} if(added){addTimeline(`أضفت ${added.toLocaleString('ar-BH')} صورة إلى ألبوم ${album.title}`,'عائلتي','📷');saveFamily();} }



// ---------------- Quran Reader: Tanzil Uthmani text ----------------
const quranSurahNames = ['الفاتحة','البقرة','آل عمران','النساء','المائدة','الأنعام','الأعراف','الأنفال','التوبة','يونس','هود','يوسف','الرعد','إبراهيم','الحجر','النحل','الإسراء','الكهف','مريم','طه','الأنبياء','الحج','المؤمنون','النور','الفرقان','الشعراء','النمل','القصص','العنكبوت','الروم','لقمان','السجدة','الأحزاب','سبأ','فاطر','يس','الصافات','ص','الزمر','غافر','فصلت','الشورى','الزخرف','الدخان','الجاثية','الأحقاف','محمد','الفتح','الحجرات','ق','الذاريات','الطور','النجم','القمر','الرحمن','الواقعة','الحديد','المجادلة','الحشر','الممتحنة','الصف','الجمعة','المنافقون','التغابن','الطلاق','التحريم','الملك','القلم','الحاقة','المعارج','نوح','الجن','المزمل','المدثر','القيامة','الإنسان','المرسلات','النبأ','النازعات','عبس','التكوير','الانفطار','المطففين','الانشقاق','البروج','الطارق','الأعلى','الغاشية','الفجر','البلد','الشمس','الليل','الضحى','الشرح','التين','العلق','القدر','البينة','الزلزلة','العاديات','القارعة','التكاثر','العصر','الهمزة','الفيل','قريش','الماعون','الكوثر','الكافرون','النصر','المسد','الإخلاص','الفلق','الناس'];
const quranSurahStartPages=[1,2,50,77,106,128,151,177,187,208,221,235,249,255,262,267,282,293,305,312,322,332,342,350,359,367,377,385,396,404,411,415,418,428,434,440,446,453,458,467,477,483,489,496,499,502,507,511,515,518,520,523,526,528,531,534,537,542,545,549,551,553,554,556,558,560,562,564,566,568,570,572,574,575,577,578,580,582,583,585,586,587,587,589,590,591,591,592,593,594,595,595,596,596,597,597,598,598,599,599,600,600,601,601,601,602,602,602,603,603,603,604,604,604];
const MUSHAF_TOTAL_PAGES=604;
const MUSHAF_LAYOUT_API='https://alfurqan.online/api/v1/quran-fonts/layout/';
const MUSHAF_FONT_API='https://alfurqan.online/api/v1/quran-fonts/v2/';
const MUSHAF_PAGE_BASE='https://raw.githubusercontent.com/zonetecde/mushaf-layout/refs/heads/main/mushaf/';
const MUSHAF_PAGE_FALLBACK='https://cdn.jsdelivr.net/gh/zonetecde/mushaf-layout@main/mushaf/';
let quranVerses=[];
let quranBySurah=new Map();
let quranLoadPromise=null;
let quranCurrentPage=1;
let quranSelectedLine=0;
let quranCurrentPageData=null;
let quranControlsTimer=null;
const mushafPageMemory=new Map();

function ensureQuranReaderState(){
  religion.quran=religion.quran||{};
  religion.quran.reader={...emptyReligion().quran.reader,...(religion.quran.reader||{})};
  const r=religion.quran.reader;
  if(!Array.isArray(r.bookmarks))r.bookmarks=[];
  r.lastPage=Math.min(604,Math.max(1,Number(r.lastPage||quranSurahStartPages[Math.max(0,(Number(r.lastSurah)||1)-1)]||1)));
  r.lastLine=Math.max(0,Number(r.lastLine||0));
  r.mushafTheme=r.mushafTheme==='night'?'night':'paper';
  return r;
}
function normalizeArabicSearch(s=''){return String(s).normalize('NFKD').replace(/[\u064B-\u065F\u0670\u06D6-\u06EDـ]/g,'').replace(/[إأآٱ]/g,'ا').replace(/ى/g,'ي').replace(/ؤ/g,'و').replace(/ئ/g,'ي').toLowerCase();}
async function loadQuranData(){
  if(quranVerses.length)return quranVerses;
  if(quranLoadPromise)return quranLoadPromise;
  quranLoadPromise=fetch('./data/quran-uthmani.txt').then(r=>{if(!r.ok)throw new Error('تعذر تحميل نص القرآن');return r.text();}).then(text=>{
    const verses=[],by=new Map();
    for(const raw of text.split(/\r?\n/)){
      const m=raw.match(/^(\d+)\|(\d+)\|(.*)$/);if(!m)continue;
      const v={surah:Number(m[1]),ayah:Number(m[2]),text:m[3]};verses.push(v);
      if(!by.has(v.surah))by.set(v.surah,[]);by.get(v.surah).push(v);
    }
    quranVerses=verses;quranBySurah=by;return verses;
  }).catch(err=>{quranLoadPromise=null;throw err;});
  return quranLoadPromise;
}
function quranVerseCount(surah){return quranBySurah.get(Number(surah))?.length||0;}
function mushafPageFile(page){return `page-${String(page).padStart(3,'0')}.json`;}
async function fetchMushafPage(page){
  page=Math.min(604,Math.max(1,Number(page)||1));
  if(mushafPageMemory.has(page))return mushafPageMemory.get(page);
  const file=mushafPageFile(page);let lastErr=null;
  const attempts=[
    `./data/mushaf/${file}`,
    `${MUSHAF_LAYOUT_API}${page}`,
    `${MUSHAF_PAGE_BASE}${file}`,
    `${MUSHAF_PAGE_FALLBACK}${file}`
  ];
  for(const url of attempts){
    try{
      const r=await fetch(url,{cache:'force-cache'});if(!r.ok)throw new Error(`HTTP ${r.status}`);
      const data=await r.json();if(!data||!Array.isArray(data.lines))throw new Error('بيانات صفحة غير صالحة');
      mushafPageMemory.set(page,data);return data;
    }catch(e){lastErr=e;}
  }
  throw lastErr||new Error('تعذر تحميل صفحة المصحف');
}

const qcfLoadedFonts=new Set();
async function ensureQcfPageFont(page){
  page=Math.min(604,Math.max(1,Number(page)||1));
  const family=`HayatiQCFV2_${String(page).padStart(3,'0')}`;
  if(qcfLoadedFonts.has(family))return family;
  try{
    const ff=new FontFace(family,`url(${MUSHAF_FONT_API}${page}) format('truetype')`,{style:'normal',weight:'400',display:'swap'});
    await ff.load();document.fonts.add(ff);qcfLoadedFonts.add(family);return family;
  }catch(e){return '';}
}

function lineQcfGlyphs(line){
  if(!Array.isArray(line?.words)||!line.words.length)return '';
  return line.words.map(w=>w.qpcV2||'').filter(Boolean).join(' ');
}
function quranTextForVerseRange(range){
  if(!range)return '';
  const [a,b]=String(range).split('-');
  const parse=v=>{const [s,n]=String(v||'').split(':').map(Number);return {s:s||1,n:n||1};};
  const start=parse(a),end=parse(b||a);const out=[];
  if(start.s===end.s){for(let n=start.n;n<=end.n;n++){const v=quranBySurah.get(start.s)?.find(x=>x.ayah===n);if(v)out.push(v.text);}}
  else{
    for(let s=start.s;s<=end.s;s++){
      const verses=quranBySurah.get(s)||[];const from=s===start.s?start.n:1,to=s===end.s?end.n:verses.length;
      for(let n=from;n<=to;n++){const v=verses.find(x=>x.ayah===n);if(v)out.push(v.text);}
    }
  }
  return out.join(' ');
}
function firstVerseRange(data){return data?.lines?.find(x=>x.verseRange)?.verseRange||'';}
function parseRangeEdge(range,end=false){const parts=String(range||'').split('-');const v=(end?parts[1]:parts[0])||parts[0]||'';const [s,a]=v.split(':').map(Number);return {surah:s||1,ayah:a||1};}
function pagePrimarySurah(data,page=quranCurrentPage){const range=firstVerseRange(data);if(range)return parseRangeEdge(range).surah;let idx=0;for(let i=0;i<quranSurahStartPages.length;i++){if(quranSurahStartPages[i]<=page)idx=i;else break;}return idx+1;}
function renderQuranSurahList(){
  const r=ensureQuranReaderState(),list=document.getElementById('quranSurahList');if(!list)return;
  list.innerHTML=quranSurahNames.map((name,i)=>`<button class="quran-surah-row" type="button" data-quran-surah="${i+1}"><span class="quran-surah-number">${toArabicDigits(i+1)}</span><span class="quran-surah-name"><b>سورة ${escapeHTML(name)}</b><small>تبدأ من صفحة ${toArabicDigits(quranSurahStartPages[i])}</small></span><span class="quran-surah-arrow">‹</span></button>`).join('');
  setText('quranLoadedCount','٦٠٤ صفحة');
  const s=Math.max(1,Number(r.lastSurah||1)),p=Math.max(1,Number(r.lastPage||1));
  setText('quranContinueTitle',r.lastAt?`صفحة ${toArabicDigits(p)} — سورة ${quranSurahNames[s-1]}`:'ابدأ من صفحة الفاتحة');
  setText('quranContinueMeta',r.lastAt?(r.lastLine?`موضعك المحفوظ: السطر ${toArabicDigits(r.lastLine)} • اضغط متابعة للعودة إليه.`:'سيعود المصحف إلى آخر صفحة حفظتها.'):'قارئ مصحف رقمي من ٦٠٤ صفحة، صفحة كاملة على الشاشة.');
  const btn=document.getElementById('quranContinueBtn');if(btn)btn.textContent=r.lastAt?'متابعة القراءة':'ابدأ القراءة';
}
async function initQuranReader(){
  try{await loadQuranData();renderQuranSurahList();updateMushafTheme();}
  catch(e){const list=document.getElementById('quranSurahList');if(list)list.innerHTML='<div class="empty-state">تعذر تحميل ملف القرآن المحلي. تأكد أن data/quran-uthmani.txt موجود.</div>';}
}
function openQuranLibrary(){
  document.body.classList.remove('quran-fullscreen-mode');
  const view=document.getElementById('view-quran-reader');if(view)view.classList.remove('is-reading');
  const lib=document.getElementById('quranLibraryPane'),read=document.getElementById('quranReadingPane');if(lib)lib.hidden=false;if(read)read.hidden=true;
  quranSelectedLine=0;renderQuranSurahList();window.scrollTo({top:0,behavior:'smooth'});
}
function updateMushafTheme(){const r=ensureQuranReaderState();const pane=document.getElementById('quranReadingPane');if(pane)pane.dataset.mushafTheme=r.mushafTheme;const btn=document.getElementById('mushafThemeBtn');if(btn)btn.textContent=r.mushafTheme==='paper'?'☾':'☀';}
function fitMushafLines(){
  requestAnimationFrame(()=>{
    const page=document.getElementById('mushafPaper');if(!page)return;
    const width=page.clientWidth,base=width<360?18:width<430?20:22;
    document.querySelectorAll('.mushaf-line.text-line').forEach(el=>{
      let size=base;el.style.fontSize=size+'px';
      while(el.scrollWidth>el.clientWidth+2&&size>13.5){size-=.5;el.style.fontSize=size+'px';}
    });
  });
}
function showMushafControls(autoHide=true){const pane=document.getElementById('quranReadingPane');if(!pane)return;pane.classList.add('controls-visible');clearTimeout(quranControlsTimer);if(autoHide)quranControlsTimer=setTimeout(()=>pane.classList.remove('controls-visible'),3200);}
async function renderMushafPage(data,page){
  quranCurrentPageData=data;quranCurrentPage=page;const r=ensureQuranReaderState(),lines=document.getElementById('mushafLines');if(!lines)return;
  const primary=pagePrimarySurah(data,page);setText('mushafSurahName',`سورة ${quranSurahNames[primary-1]||''}`);setText('mushafPageTop',`صفحة ${toArabicDigits(page)} من ٦٠٤`);setText('mushafPageNumber',toArabicDigits(page));
  const qcfFamily=await ensureQcfPageFont(page);
  const textCount=(data.lines||[]).filter(x=>x.type==='text'||x.type==='basmala').length;
  lines.classList.toggle('short-page',textCount<10);
  lines.innerHTML=(data.lines||[]).map(line=>{
    if(line.type==='surah-header')return `<div class="mushaf-line surah-header-line" data-line="${line.line}"><span>۞</span><b>${escapeHTML(line.text)}</b><span>۞</span></div>`;
    const saved=r.lastPage===page&&r.lastLine===Number(line.line);
    const glyphs=qcfFamily?lineQcfGlyphs(line):'';
    const visible=glyphs||line.text||'';
    const cls=line.type==='basmala'?' basmala-line':'';
    const fontStyle=glyphs?` style="font-family:${qcfFamily},serif" data-qcf="1"`:'';
    return `<div class="mushaf-line text-line${cls}${saved?' saved-line':''}" data-line="${line.line}" data-range="${escapeHTML(line.verseRange||'')}" tabindex="0"><span class="mushaf-line-text"${fontStyle}>${escapeHTML(visible)}</span>${saved?'<i class="mushaf-saved-mark">موضعك</i>':''}</div>`;
  }).join('');
  document.querySelectorAll('.mushaf-line').forEach(x=>x.classList.toggle('selected-line',Number(x.dataset.line)===quranSelectedLine));
  const prev=document.getElementById('mushafPrevPage'),next=document.getElementById('mushafNextPage');if(prev)prev.disabled=page<=1;if(next)next.disabled=page>=604;
  fitMushafLines();showMushafControls(true);
}
async function openMushafPage(page){
  page=Math.min(604,Math.max(1,Number(page)||1));quranSelectedLine=0;
  document.body.classList.add('quran-fullscreen-mode');
  const view=document.getElementById('view-quran-reader');if(view)view.classList.add('is-reading');
  const lib=document.getElementById('quranLibraryPane'),read=document.getElementById('quranReadingPane');if(lib)lib.hidden=true;if(read)read.hidden=false;
  updateMushafTheme();const lines=document.getElementById('mushafLines');if(lines)lines.innerHTML='<div class="mushaf-loading"><span>۞</span><b>جارٍ فتح صفحة المصحف…</b></div>';
  try{
    const data=await fetchMushafPage(page);await renderMushafPage(data,page);const r=ensureQuranReaderState();
    if(r.lastPage===page&&r.lastLine){quranSelectedLine=r.lastLine;document.querySelector(`[data-line="${r.lastLine}"]`)?.classList.add('selected-line');setText('mushafSelectionText',`موضعك المحفوظ: السطر ${toArabicDigits(r.lastLine)}`);}
    else setText('mushafSelectionText','اضغط على السطر الذي انتهيت عنده');
  }catch(e){if(lines)lines.innerHTML=`<div class="mushaf-loading error"><b>تعذر تحميل صفحة المصحف</b><span>أول فتح لصفحة جديدة يحتاج اتصالًا بالإنترنت. بعد فتحها يحاول التطبيق حفظها للكاش.</span><button type="button" data-mushaf-retry="${page}">إعادة المحاولة</button></div>`;showMushafControls(false);}
}
function pageRangeKeys(data){const rs=(data?.lines||[]).filter(x=>x.verseRange);if(!rs.length)return [0,999999];const a=parseRangeEdge(rs[0].verseRange),b=parseRangeEdge(rs[rs.length-1].verseRange,true);return [a.surah*1000+a.ayah,b.surah*1000+b.ayah];}
async function findMushafPageForAyah(surah,ayah){
  const target=Number(surah)*1000+Number(ayah);let lo=quranSurahStartPages[surah-1]||1,hi=surah<114?quranSurahStartPages[surah]-1:604;
  while(lo<=hi){const mid=Math.floor((lo+hi)/2);try{const data=await fetchMushafPage(mid),[min,max]=pageRangeKeys(data);if(target<min)hi=mid-1;else if(target>max)lo=mid+1;else return mid;}catch{return quranSurahStartPages[surah-1]||1;}}
  return quranSurahStartPages[surah-1]||1;
}
async function openQuranReader(surah=1,ayah=1){surah=Math.min(114,Math.max(1,Number(surah)||1));const page=Number(ayah)>1?await findMushafPageForAyah(surah,ayah):quranSurahStartPages[surah-1];return openMushafPage(page);}
function selectMushafLine(line){quranSelectedLine=Number(line)||0;document.querySelectorAll('.mushaf-line').forEach(x=>x.classList.toggle('selected-line',Number(x.dataset.line)===quranSelectedLine));const el=document.querySelector(`.mushaf-line[data-line="${quranSelectedLine}"]`);setText('mushafSelectionText',el?.dataset.range?`السطر ${toArabicDigits(quranSelectedLine)} • ${el.dataset.range}`:`السطر ${toArabicDigits(quranSelectedLine)}`);showMushafControls(false);}
function saveMushafPosition(notify=true){
  if(!quranSelectedLine){openModal('حدد موضعك','اضغط على السطر الذي انتهيت عنده أولًا، ثم اضغط «انتهيت هنا».','📖');return;}
  const line=quranCurrentPageData?.lines?.find(x=>Number(x.line)===quranSelectedLine),edge=parseRangeEdge(line?.verseRange||firstVerseRange(quranCurrentPageData),true),r=ensureQuranReaderState();
  r.lastPage=quranCurrentPage;r.lastLine=quranSelectedLine;r.lastVerseRange=line?.verseRange||'';r.lastSurah=edge.surah;r.lastAyah=edge.ayah;r.lastAt=new Date().toISOString();
  religion.quran.lastPosition=`صفحة ${toArabicDigits(quranCurrentPage)} • السطر ${toArabicDigits(quranSelectedLine)} • سورة ${quranSurahNames[edge.surah-1]}`;
  saveReligion();addTimeline(`انتهيت من قراءة القرآن عند ${religion.quran.lastPosition}`,'ديني','📖');renderMushafPage(quranCurrentPageData,quranCurrentPage);if(notify)openModal('تم حفظ موضعك',religion.quran.lastPosition,'🔖');
}
async function copySelectedMushafLine(){const line=quranCurrentPageData?.lines?.find(x=>Number(x.line)===quranSelectedLine);if(!line?.verseRange){openModal('حدد سطرًا','اضغط على سطر من المصحف أولًا.','📖');return;}const copyText=quranTextForVerseRange(line.verseRange)||line.text||'';try{await navigator.clipboard.writeText(copyText);openModal('تم النسخ',`تم نسخ الآية/الآيات من ملف Tanzil العثماني، وليس رموز خط العرض.`,'✓');}catch{openModal('تعذر النسخ','جرّب مرة أخرى أو استخدم زر النسخ بعد تحديد السطر.','⚠️');}}
function jumpMushafPageFromInput(){const i=document.getElementById('mushafPageJumpInput'),p=Math.min(604,Math.max(1,Number(i?.value)||1));if(i)i.value='';openMushafPage(p);}
function quranSearch(query){
  const results=document.getElementById('quranSearchResults'),section=document.getElementById('quranSurahSection'),list=document.getElementById('quranSearchResultList'),heading=document.getElementById('quranSearchHeading');if(!results||!list)return;
  const q=String(query||'').trim(),nq=normalizeArabicSearch(q);if(!nq){results.hidden=true;if(section)section.hidden=false;return;}
  const matches=[];quranSurahNames.forEach((name,i)=>{if(normalizeArabicSearch(name).includes(nq))matches.push({kind:'surah',surah:i+1,name});});
  if(nq.length>=2){for(const v of quranVerses){if(normalizeArabicSearch(v.text).includes(nq)){matches.push({kind:'ayah',...v});if(matches.length>=60)break;}}}
  results.hidden=false;if(section)section.hidden=true;if(heading)heading.textContent=`نتائج «${q}»`;
  list.innerHTML=matches.length?matches.map(m=>m.kind==='surah'?`<button class="quran-result" type="button" data-quran-surah="${m.surah}"><b>سورة ${escapeHTML(m.name)}</b><small>تبدأ من صفحة ${toArabicDigits(quranSurahStartPages[m.surah-1])}</small></button>`:`<button class="quran-result" type="button" data-quran-jump="${m.surah}:${m.ayah}"><b>سورة ${escapeHTML(quranSurahNames[m.surah-1])} • الآية ${toArabicDigits(m.ayah)}</b><p>${escapeHTML(m.text)}</p><small>فتح موضع الآية في المصحف</small></button>`).join(''):'<div class="empty-state">لا توجد نتائج مطابقة.</div>';
}

function renderDashboard(){
  const healthCard=document.querySelector('.priority-card.health .priority-body'); if(healthCard){ const calGoal=Number(health.profile.dailyCalories||0), consumed=healthTodayCalories(), current=latestWeightRecord()?.weight||health.profile.startWeight; healthCard.querySelector('h3').textContent=health.profile.startWeight?'مشروع إنزال الوزن':'مشروع إنزال الوزن'; healthCard.querySelector('p').textContent=calGoal?`متبقي ${Math.max(0,calGoal-consumed).toLocaleString('ar-BH')} سعرة اليوم${current?` • الوزن ${current} كجم`:''}`:'ابدأ بإعداد مشروعك أو سجّل وجبتك ووزنك.'; }
  const religionCard=document.querySelector('.priority-card.religion .priority-body'); if(religionCard){ const focus=religion.projects.find(x=>x.status!=='مكتمل'); religionCard.querySelector('h3').textContent=focus?focus.title:'ورد اليوم'; religionCard.querySelector('p').textContent=religion.quran.dailyTarget?`هدف القرآن: ${religion.quran.dailyTarget}`:(focus?'تابع مشروعك الديني النشط.':'أضف مشروعًا أو هدف قرآن أو ذكرًا.'); }
  const knowledgeCard=document.querySelector('.priority-card.knowledge .priority-body'); if(knowledgeCard){ const had=dailyHadith(); const todayTasks=knowledge.english.tasks.filter(x=>x.date===todayKey()); knowledgeCard.querySelector('h3').textContent=had?'حديث اليوم':'مشروع الإنجليزية'; knowledgeCard.querySelector('p').textContent=had?`${had.text.slice(0,68)}${had.text.length>68?'…':''}`:(todayTasks.length?`${todayTasks.filter(x=>!x.done).length} مهمة إنجليزية متبقية اليوم`:'أضف أحاديثك أو مهام الإنجليزية.'); }
  renderHomeHadith(); renderDayRhythm();
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
  const finSalary=event.target.closest('[data-fin-receive-salary]'); if(finSalary){ receiveSalary(finSalary.dataset.finReceiveSalary); return; }
  const finPayFixed=event.target.closest('[data-fin-pay-fixed]'); if(finPayFixed){ payFixed(finPayFixed.dataset.finPayFixed); return; }
  const finPayObligation=event.target.closest('[data-fin-pay-obligation]'); if(finPayObligation){ payObligation(finPayObligation.dataset.finPayObligation); return; }

  const healthAction=event.target.closest('[data-health-action]'); if(healthAction){ openHealthForm(healthAction.dataset.healthAction); return; }
  const healthTab=event.target.closest('[data-health-tab]'); if(healthTab){ document.querySelectorAll('[data-health-tab]').forEach(x=>x.classList.toggle('active',x===healthTab)); document.querySelectorAll('[data-health-panel]').forEach(x=>x.classList.toggle('active',x.dataset.healthPanel===healthTab.dataset.healthTab)); return; }
  const healthWater=event.target.closest('[data-health-water]'); if(healthWater){ const ml=Number(healthWater.dataset.healthWater); health.water.push({id:makeId(),ml,date:todayKey()}); addTimeline(`شربت ${ml} مل ماء`,'صحتي','💧'); saveHealth(); return; }
  const healthDel=event.target.closest('[data-health-delete]'); if(healthDel){ if(confirm('حذف هذا العنصر؟')) deleteHealth(healthDel.dataset.healthDelete,healthDel.dataset.id); return; }

  const qOpen=event.target.closest('[data-quran-open]'); if(qOpen){showView('quran-reader');navItems.forEach(i=>i.classList.remove('active'));openQuranLibrary();return;}
  const qContinue=event.target.closest('[data-quran-continue]'); if(qContinue){const r=ensureQuranReaderState();showView('quran-reader');navItems.forEach(i=>i.classList.remove('active'));openMushafPage(r.lastPage||1);return;}
  const qSurah=event.target.closest('[data-quran-surah]'); if(qSurah){openQuranReader(Number(qSurah.dataset.quranSurah),1);return;}
  const qJump=event.target.closest('[data-quran-jump]'); if(qJump){const [ss,aa]=qJump.dataset.quranJump.split(':').map(Number);openQuranReader(ss,aa);return;}
  const mLine=event.target.closest('.mushaf-line.text-line'); if(mLine){selectMushafLine(Number(mLine.dataset.line));return;}
  const retry=event.target.closest('[data-mushaf-retry]'); if(retry){openMushafPage(Number(retry.dataset.mushafRetry));return;}

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

  const relAction=event.target.closest('[data-rel-action]'); if(relAction){openRelationshipForm(relAction.dataset.relAction);return;}
  const relTab=event.target.closest('[data-rel-tab]'); if(relTab){document.querySelectorAll('[data-rel-tab]').forEach(x=>x.classList.toggle('active',x===relTab));document.querySelectorAll('[data-rel-panel]').forEach(x=>x.classList.toggle('active',x.dataset.relPanel===relTab.dataset.relTab));return;}
  const relQuick=event.target.closest('[data-rel-quick-contact]'); if(relQuick){openRelationshipForm('contact-preselected',relQuick.dataset.relQuickContact);return;}
  const relDel=event.target.closest('[data-rel-delete]'); if(relDel){if(confirm('حذف هذا العنصر؟'))deleteRelationship(relDel.dataset.relDelete,relDel.dataset.id);return;}
  const relPromise=event.target.closest('[data-rel-toggle-promise]'); if(relPromise){togglePromise(relPromise.dataset.relTogglePromise);return;}
  const relGift=event.target.closest('[data-rel-toggle-gift]'); if(relGift){toggleGift(relGift.dataset.relToggleGift);return;}

  const familyAction=event.target.closest('[data-family-action]'); if(familyAction){openFamilyForm(familyAction.dataset.familyAction);return;}
  const familyTab=event.target.closest('[data-family-tab]'); if(familyTab){document.querySelectorAll('[data-family-tab]').forEach(x=>x.classList.toggle('active',x===familyTab));document.querySelectorAll('[data-family-panel]').forEach(x=>x.classList.toggle('active',x.dataset.familyPanel===familyTab.dataset.familyTab));return;}
  const familyPhoto=event.target.closest('[data-family-add-photo]'); if(familyPhoto){pendingFamilyAlbumId=familyPhoto.dataset.familyAddPhoto;document.getElementById('familyPhotoInput')?.click();return;}
  const familyDel=event.target.closest('[data-family-delete]'); if(familyDel){if(confirm('حذف هذا العنصر؟'))deleteFamily(familyDel.dataset.familyDelete,familyDel.dataset.id);return;}
  const familyTask=event.target.closest('[data-family-toggle-task]'); if(familyTask){toggleFamilyTask(familyTask.dataset.familyToggleTask);return;}
  const snap=event.target.closest('[data-restore-snapshot]'); if(snap){restoreSnapshot(snap.dataset.restoreSnapshot);return;}

  const action = event.target.closest('[data-action]');
  if (action) {
    if(action.dataset.action==='expense'){ showView('finance'); navItems.forEach(i=>i.classList.remove('active')); openFinanceForm('expense'); return; }
    if(action.dataset.action==='meal'){ showView('health'); navItems.forEach(i=>i.classList.remove('active')); openHealthForm('meal'); return; }
    if(action.dataset.action==='weight'){ showView('health'); navItems.forEach(i=>i.classList.remove('active')); openHealthForm('weight'); return; }
    if(action.dataset.action==='reading'){ showView('knowledge'); navItems.forEach(i=>i.classList.remove('active')); openKnowledgeForm('book'); return; }
    if(action.dataset.action==='learn'){ showView('knowledge'); navItems.forEach(i=>i.classList.remove('active')); return; }
    if(action.dataset.action==='religion'){ showView('religion'); navItems.forEach(i=>i.classList.remove('active')); return; }
    if(action.dataset.action==='contact'){ showView('relationships'); navItems.forEach(i=>i.classList.remove('active')); openRelationshipForm('contact'); return; }
    const labels = { note:['إضافة ملاحظة','إضافة الملاحظات العامة ستُربط بالـTimeline في مرحلة لاحقة.','✍️'] };
    const [title,text,icon]=labels[action.dataset.action]||['قريبًا','سيتم بناء هذه الميزة في قسمها.','✓']; openModal(title,text,icon);
  }
});

document.getElementById('startDayBtn')?.addEventListener('click',startDay);
document.getElementById('endDayBtn')?.addEventListener('click',endDay);
document.getElementById('hadithManagerOpenBtn')?.addEventListener('click',()=>showView('hadith-manager'));
document.getElementById('hadithAnalyzeBtn')?.addEventListener('click',()=>renderHadithBatchPreview());
document.getElementById('hadithBatchForm')?.addEventListener('submit',addHadithBatch);
const hadithReadBtn=document.getElementById('hadithReadBtn'); if(hadithReadBtn)hadithReadBtn.addEventListener('click',markDailyHadithRead);
const hadithFavoriteBtn=document.getElementById('hadithFavoriteBtn'); if(hadithFavoriteBtn)hadithFavoriteBtn.addEventListener('click',toggleDailyHadithFavorite);
document.getElementById('quranContinueBtn')?.addEventListener('click',()=>{const r=ensureQuranReaderState();openMushafPage(r.lastPage||1);});
document.getElementById('quranReaderBack')?.addEventListener('click',openQuranLibrary);
document.getElementById('mushafExitBtn')?.addEventListener('click',openQuranLibrary);
document.getElementById('mushafPrevPage')?.addEventListener('click',()=>{if(quranCurrentPage>1)openMushafPage(quranCurrentPage-1);});
document.getElementById('mushafNextPage')?.addEventListener('click',()=>{if(quranCurrentPage<604)openMushafPage(quranCurrentPage+1);});
document.getElementById('mushafSaveBtn')?.addEventListener('click',()=>saveMushafPosition(true));
document.getElementById('mushafCopyBtn')?.addEventListener('click',copySelectedMushafLine);
document.getElementById('mushafThemeBtn')?.addEventListener('click',()=>{const r=ensureQuranReaderState();r.mushafTheme=r.mushafTheme==='paper'?'night':'paper';saveReligion();updateMushafTheme();showMushafControls(false);});
document.getElementById('mushafPageJumpBtn')?.addEventListener('click',jumpMushafPageFromInput);
document.getElementById('mushafPageJumpInput')?.addEventListener('keydown',e=>{if(e.key==='Enter')jumpMushafPageFromInput();});
let quranSearchTimer=null;document.getElementById('quranSearchInput')?.addEventListener('input',e=>{clearTimeout(quranSearchTimer);quranSearchTimer=setTimeout(()=>quranSearch(e.target.value),180);});
document.getElementById('quranSearchClear')?.addEventListener('click',()=>{const i=document.getElementById('quranSearchInput');if(i){i.value='';quranSearch('');i.focus();}});
let mushafTouchStart=null;
document.getElementById('quranReadingPane')?.addEventListener('touchstart',e=>{const t=e.touches?.[0];if(t)mushafTouchStart={x:t.clientX,y:t.clientY};},{passive:true});
document.getElementById('quranReadingPane')?.addEventListener('touchend',e=>{if(!mushafTouchStart)return;const t=e.changedTouches?.[0];if(!t)return;const dx=t.clientX-mushafTouchStart.x,dy=t.clientY-mushafTouchStart.y;mushafTouchStart=null;if(Math.abs(dx)>65&&Math.abs(dx)>Math.abs(dy)*1.3){if(dx<0&&quranCurrentPage<604)openMushafPage(quranCurrentPage+1);else if(dx>0&&quranCurrentPage>1)openMushafPage(quranCurrentPage-1);}},{passive:true});
document.getElementById('mushafPaper')?.addEventListener('click',e=>{if(!e.target.closest('.mushaf-line'))showMushafControls(true);});
window.addEventListener('resize',fitMushafLines);

document.getElementById('sectionBack').addEventListener('click', () => showView('domains'));
document.getElementById('sectionAction').addEventListener('click', () => showView('today'));
modalClose.addEventListener('click', closeModal); modalOk.addEventListener('click', closeModal); modalBackdrop.addEventListener('click', (e) => { if (e.target === modalBackdrop) closeModal(); });
installBtn.addEventListener('click', installApp); document.getElementById('settingInstall').addEventListener('click', installApp); themeBtn.addEventListener('click', toggleTheme); document.getElementById('settingTheme').addEventListener('click', toggleTheme);
document.getElementById('backupExportBtn')?.addEventListener('click',exportFullBackup);
document.getElementById('backupImportBtn')?.addEventListener('click',()=>document.getElementById('backupImportInput')?.click());
document.getElementById('backupReminderBtn')?.addEventListener('click',toggleBackupReminder);
document.getElementById('backupImportInput')?.addEventListener('change',async e=>{const file=e.target.files?.[0];if(file)await importFullBackup(file);e.target.value='';});
document.getElementById('familyPhotoInput')?.addEventListener('change',async e=>{const files=e.target.files;if(files?.length&&pendingFamilyAlbumId)await handleFamilyFiles(files,pendingFamilyAlbumId);pendingFamilyAlbumId='';e.target.value='';});
window.addEventListener('beforeinstallprompt', (event) => { event.preventDefault(); deferredPrompt = event; });

const savedTheme = localStorage.getItem('hayati-theme'); setTheme(savedTheme || 'dark'); document.getElementById('todayDate').textContent = formatArabicDate(); renderFinance(); renderHealth(); renderReligion(); renderKnowledge(); renderRelationships(); renderFamily(); renderStory(); renderDashboard(); renderBackupSettings(); renderHadithManagerStats(); maybeShowBackupReminder();
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js').catch(() => {}));
