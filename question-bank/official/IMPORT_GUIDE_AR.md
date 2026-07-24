# ECHS AP Practice Center 4.0 — Private Expandable Edition

هذه هي النسخة الوحيدة المطلوبة للنشر الخاص داخل المدرسة.

## ما تحتويه

- جميع السجلات الحالية وعددها **1,217** متاحة للطلاب داخل الموقع الخاص.
- 907 سجلات تحتوي نص سؤال كامل أو صورة مصدر قابلة للاستخدام.
- 310 سجلات قديمة ما زالت **Indexed-only**: تظهر للطلاب بوضوح كفهرس رسمي، لكنها لا تدّعي وجود نص أو اختيارات غير موجودة.
- Tutor Practice، Official Archive، Exam Simulator، Dashboard، Teacher Studio، وExpansion Studio.
- لا يوجد AI ولا API key.

## إضافة أسئلة جديدة لاحقًا

1. جهز ملف JSON باستخدام `payload/question-bank/official/imports/templates/question-batch-template.json`.
2. بعد التثبيت، اسحب الملف فوق:
   `question-bank/official/ADD_NEW_QUESTIONS.bat`
3. الأداة تنسخ الملف إلى `data/expansions/batches/` وتحدّث `manifest.json` وتتحقق من البنك.
4. افتح GitHub Desktop واعمل Commit ثم Push.
5. تظهر الأسئلة الجديدة تلقائيًا في الأرشيف والتدريب والامتحانات واللوحات دون إعادة بناء البنك الأساسي.

استخدم `mergeMode: upsert` مع نفس Question ID لإكمال سجل Indexed-only أو تصحيح سؤال سابق.

## التثبيت

شغّل `INSTALL_BY_DOUBLE_CLICK.bat` وأدخل مسار مستودع `ECHS-Math` الخاص.
