/* ============================================================================
   Kaleido O.S — طبقة تشغيل البروتوتايب الستاتيك
   ----------------------------------------------------------------------------
   الصفحات دي مصدَّرة من النظام الحقيقي، فالتنقل بينها شغّال بالكامل.
   الملف ده بيتولّى الحاجات اللي محتاجة سيرفر عشان الواجهة تفضل حيّة:

     • يوقف إرسال الفورمات (مفيش سيرفر) ويعرض رسالة نجاح شكلية
     • يردّ على أي fetch() برد JSON ناجح جاهز
     • يعطّل الروابط اللي مالهاش صفحة مصدَّرة بلطف بدل ما تكسر التنقل
     • يشغّل جرس الإشعارات ببيانات عرض

   ⚠️ ده بروتوتايب واجهة — مفيش قاعدة بيانات، فأي تعديل مابيتحفظش بعد
   إعادة تحميل الصفحة.
   ========================================================================== */

(function () {
  'use strict';

  /* ---------- شارة "بروتوتايب" ---------- */

  function badge() {
    var el = document.createElement('div');
    el.className = 'proto-badge';
    el.innerHTML =
      '<span class="proto-dot"></span>' +
      '<span>نسخة عرض تفاعلية — التنقل بين الشاشات شغّال، والحفظ معطّل</span>';
    document.body.appendChild(el);
  }

  /* ---------- رسالة صغيرة أسفل الشاشة ---------- */

  function say(msg) {
    if (typeof showToast === 'function') {
      showToast(msg);
      return;
    }
    var t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(window._protoToast);
    window._protoToast = setTimeout(function () { t.classList.remove('show'); }, 2400);
  }

  /* ---------- الروابط المعطّلة ---------- */

  document.addEventListener('click', function (e) {
    var dead = e.target.closest('[data-proto-dead]');
    if (dead) {
      e.preventDefault();
      say('الشاشة دي مش متضمّنة في نسخة العرض.');
      return;
    }

    // أزرار الحذف/الإجراءات اللي بتنادي confirm ثم fetch
    var act = e.target.closest('[onclick]');
    if (act && /delete|destroy|remove/i.test(act.getAttribute('onclick') || '')) {
      // نسيب السلوك الأصلي يشتغل — fetch المزيّف تحت هيرد عليه
    }
  }, true);

  /* ---------- الفورمات ---------- */

  document.addEventListener('submit', function (e) {
    e.preventDefault();

    var form = e.target;
    if (form.getAttribute('action') === 'login.html' || form.id === 'login-form') {
      window.location.href = 'index.html';
      return;
    }

    say('تم الحفظ ✓  (نسخة عرض — البيانات مش بتتخزّن)');
  }, true);

  /* ---------- fetch مزيّف ---------- */

  var realFetch = window.fetch;

  window.fetch = function (url, opts) {
    var target = String(url || '');

    // الإشعارات ليها شكل رد خاص
    if (/notifications/.test(target) && !/read-all/.test(target)) {
      return Promise.resolve(jsonResponse({
        ok: true,
        unread: 2,
        items: [
          {
            id: 1, icon: 'task', unread: true,
            title: 'تم تكليفك بمهمة جديدة: تصوير محتوى الفيديو',
            body: 'ضمن مشروع «حملة رمضان 2026» · موعد التسليم 2026/08/20',
            time: 'منذ ٥ دقائق',
          },
          {
            id: 2, icon: 'completed', unread: true,
            title: 'مهمة جاهزة للمراجعة: تصميم البانرات',
            body: 'سلّم المنفّذ المهمة وطلب مراجعتك.',
            time: 'منذ ساعتين',
          },
          {
            id: 3, icon: 'returned', unread: false,
            title: 'أُعيدت إليك مهمة للتعديل: جدولة النشر',
            body: 'يرجى مراجعة مواعيد النشر على إنستجرام.',
            time: 'أمس',
          },
        ],
      }));
    }

    if (/read-all/.test(target)) {
      return Promise.resolve(jsonResponse({ ok: true, message: 'تم تعليم كل الإشعارات كمقروءة ✓' }));
    }

    // أي طلب تاني: رد نجاح عام
    return Promise.resolve(jsonResponse({
      ok: true,
      message: 'تم التنفيذ ✓  (نسخة عرض — البيانات مش بتتخزّن)',
      id: 1, done: 1, skipped: [], conflicts: [], projects: [], tasks: [],
      progress: { done: 1, total: 3 },
    }));
  };

  function jsonResponse(payload) {
    return {
      ok: true,
      status: 200,
      json: function () { return Promise.resolve(payload); },
      text: function () { return Promise.resolve(JSON.stringify(payload)); },
    };
  }

  /* ---------- تشغيل ---------- */

  document.addEventListener('DOMContentLoaded', function () {
    badge();

    // زر الخروج يرجّع لشاشة الدخول
    document.querySelectorAll('.tu-logout').forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.preventDefault();
        window.location.href = 'login.html';
      });
    });
  });
})();
