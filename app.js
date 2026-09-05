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
let deferredPrompt = null;

const sectionData = {
  finance: { title: 'مالي', kicker: 'الشؤون المالية', icon: '💰', description: 'الدخل، المصروفات، الميزانية، الادخار، الالتزامات والديون والأهداف المالية.' },
  health: { title: 'صحتي', kicker: 'مشروع إنزال الوزن', icon: '🥗', description: 'تقييم البداية، الهدف، الخطة الغذائية، الوجبات والمشروبات والوزن والمتابعة الأسبوعية.' },
  religion: { title: 'ديني', kicker: 'المشاريع الدينية', icon: '🕌', description: 'القرآن، الأذكار، الصيام، التعلم، المواسم والمشاريع الدينية الشخصية.' },
  relationships: { title: 'علاقاتي', kicker: 'العلاقات الحقيقية', icon: '🤝', description: 'الأشخاص والدوائر الاجتماعية والتواصل والمناسبات والوعود والذكريات.' },
  family: { title: 'عائلتي', kicker: 'العائلة والذكريات', icon: '👨‍👩‍👧‍👦', description: 'شجرة العائلة، أفراد الأسرة، الذكريات والألبومات العائلية.' },
  knowledge: { title: 'معرفتي', kicker: 'التعلم والثقافة', icon: '🧠', description: 'حديث اليوم، مشروع الإنجليزية، الكتب، الملاحظات ومشاريع التعلم المستقبلية.' }
};

function showView(name) {
  views.forEach(v => v.classList.toggle('active', v.dataset.view === name));
  navItems.forEach(item => item.classList.toggle('active', item.dataset.nav === name));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openSection(key) {
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
  if (isStandalone()) {
    openModal('حياتي مثبت بالفعل', 'أنت تستخدم التطبيق من وضع الشاشة الرئيسية.', '✓');
    return;
  }
  if (deferredPrompt) {
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    return;
  }
  if (isIOS()) {
    openModal('تثبيت حياتي على الآيفون', 'من Safari اضغط زر المشاركة، ثم اختر «إضافة إلى الشاشة الرئيسية / Add to Home Screen»، وبعدها «إضافة».', '📲');
  } else {
    openModal('تثبيت التطبيق', 'افتح قائمة المتصفح وابحث عن خيار Install app أو Add to Home Screen.', '📲');
  }
}

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem('hayati-theme', theme);
  themeBtn.textContent = theme === 'light' ? '☀' : '☾';
}
function toggleTheme() {
  setTheme(document.documentElement.dataset.theme === 'light' ? 'dark' : 'light');
}

function formatArabicDate() {
  try {
    return new Intl.DateTimeFormat('ar-BH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date());
  } catch { return 'اليوم'; }
}

document.addEventListener('click', (event) => {
  const nav = event.target.closest('[data-nav]');
  if (nav) { showView(nav.dataset.nav); return; }

  const section = event.target.closest('[data-section]');
  if (section && !event.target.closest('[data-action]')) { openSection(section.dataset.section); return; }

  const action = event.target.closest('[data-action]');
  if (action) {
    const labels = {
      expense: ['تسجيل مصروف', 'سيُربط هذا الإجراء بقسم «مالي» وFirestore عند بناء القسم المالي.', '💳'],
      meal: ['تسجيل وجبة', 'سيُربط هذا الإجراء بقسم «صحتي». تحليل الصورة بالذكاء الاصطناعي مرحلة لاحقة.', '🍲'],
      weight: ['تسجيل الوزن', 'سيُضاف سجل الوزن ومتوسط 7 أيام عند بناء مشروع إنزال الوزن.', '⚖️'],
      contact: ['تسجيل تواصل', 'سيُحدّث آخر تواصل مع الشخص في قسم «علاقاتي».', '☎️'],
      reading: ['تسجيل قراءة', 'سيُحدّث تقدم الكتاب أو مشروع التعلم في «معرفتي».', '📚'],
      note: ['إضافة ملاحظة', 'ستدخل الملاحظة لاحقًا في «قصتي اليوم» والـTimeline.', '✍️'],
      learn: ['مشروع الإنجليزية', 'سيتم بناء اختبار المستوى والخطة الأسبوعية والاختبار الأسبوعي في «معرفتي».', '📘'],
      religion: ['المشروع الديني', 'سيتم بناء المشاريع الدينية والقرآن والأذكار والتذكيرات تدريجيًا.', '🕌']
    };
    const [title, text, icon] = labels[action.dataset.action] || ['قريبًا', 'سيتم ربط هذه الميزة في المرحلة التالية.', '✓'];
    openModal(title, text, icon);
  }
});

document.getElementById('sectionBack').addEventListener('click', () => showView('domains'));
document.getElementById('sectionAction').addEventListener('click', () => showView('today'));
modalClose.addEventListener('click', closeModal);
modalOk.addEventListener('click', closeModal);
modalBackdrop.addEventListener('click', (e) => { if (e.target === modalBackdrop) closeModal(); });
installBtn.addEventListener('click', installApp);
document.getElementById('settingInstall').addEventListener('click', installApp);
themeBtn.addEventListener('click', toggleTheme);
document.getElementById('settingTheme').addEventListener('click', toggleTheme);

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredPrompt = event;
});

const savedTheme = localStorage.getItem('hayati-theme');
setTheme(savedTheme || 'dark');
document.getElementById('todayDate').textContent = formatArabicDate();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {});
  });
}
