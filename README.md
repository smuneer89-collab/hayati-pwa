# حياتي — V8 Mushaf Fullscreen

نسخة V8 تعيد بناء قارئ القرآن كمصحف رقمي صفحة بصفحة بدل قارئ نص طويل.

## ما الجديد
- 604 صفحة بنمط مصحف المدينة.
- شاشة قراءة كاملة من أعلى الآيفون إلى أسفله.
- توزيع ثابت للسطر داخل كل صفحة.
- خط Uthmanic Hafs على الويب مع fallback آمن.
- النص Unicode وقابل للتحديد والنسخ.
- سحب يمين/يسار للتنقل بين الصفحات.
- الضغط على سطر ثم «انتهيت هنا» يحفظ الصفحة والسطر وآخر آية مرتبطة.
- «متابعة القراءة» تعيد فتح الصفحة المحفوظة.
- فهرس السور يفتح صفحة بداية السورة.
- البحث في ملف Tanzil المحلي ثم يحدد صفحة الآية في المصحف آليًا.
- كاش للصفحات التي فُتحت سابقًا عبر Service Worker.

## البيانات
- `data/quran-uthmani.txt`: Tanzil Uthmani 1.1، يبقى كما هو.
- تخطيط صفحات المصحف يُحمّل عند فتح الصفحة من dataset رقمي 604 صفحة (`zonetecde/mushaf-layout`) مع مصدر احتياطي عبر jsDelivr.
- خط القراءة يُطلب من QUL/Tarteel CDN ولا يتم تضمين ملف الخط داخل المشروع.

أول فتح لصفحة جديدة يحتاج اتصال إنترنت. بعد فتحها يحاول Service Worker الاحتفاظ بها للكاش.


## V8.1 Mushaf fix
- Uses alfurqan.online layout/font API first, then GitHub mirrors.
- Copies canonical Tanzil Uthmani Unicode text, not QCF PUA glyphs.
- QCF V2 is display-only; Tanzil remains the copy/search source.
