/* ============================================================
   GLOBAL UI HELPERS — Kaleido Agency OS (Laravel)
   Page-specific AJAX logic (kanban drag/drop, task pipeline,
   schedule quick-update) lives inline in each blade view's
   @section('scripts') block, right next to the markup it controls.
============================================================ */

/* ------------------------------------------------------------
   ألوان الشارتات — بتتقرا من نفس توكنز الـCSS في :root
   يعني لو غيّرت الهوية في styles.css، الشارتات بتتغيّر معاها
   من غير ما تلمس أي كود JS.
------------------------------------------------------------ */
const CHART = (() => {
  const css = getComputedStyle(document.documentElement);
  const v = (name, fallback) => (css.getPropertyValue(name) || '').trim() || fallback;

  return {
    primary: v('--primary', '#6C4FD8'),
    primaryDark: v('--primary-dark', '#5334B8'),
    primarySoft: v('--primary-soft', '#8C74E8'),
    green: v('--green', '#1F9E6B'),
    amber: v('--amber', '#D2921F'),
    red: v('--red', '#E2566A'),
    grid: v('--gray-150', '#EEEBF9'),
    muted: v('--gray-500', '#8B87A3'),
    // باليتة متدرجة للشارتات متعددة الشرائح (Doughnut / Pie)
    palette: [
      v('--primary', '#6C4FD8'),
      v('--primary-soft', '#8C74E8'),
      v('--primary-dark', '#5334B8'),
      '#B9A6F2',
      v('--gray-500', '#8B87A3'),
      v('--primary-tint-2', '#DED4FA'),
    ],
  };
})();

function toggleSidebar(open) {
  document.getElementById('sidebar').classList.toggle('open', open);
  document.getElementById('backdrop').classList.toggle('active', open);
}

function openModal(html) {
  document.getElementById('modalBox').innerHTML = html;
  document.getElementById('overlay').classList.add('active');
}

function closeModal() {
  document.getElementById('overlay').classList.remove('active');
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}
