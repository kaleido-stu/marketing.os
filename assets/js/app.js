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

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
}

function toggleNavSubmenu(id) {
  const parent = document.getElementById(id);
  if (!parent) return;
  const open = parent.classList.toggle('open');
  parent.querySelector('.nav-parent-toggle')?.setAttribute('aria-expanded', open ? 'true' : 'false');
}

function openModal(html) {
  document.getElementById('modalBox').innerHTML = html;
  document.getElementById('overlay').classList.add('active');
}

// Delegated menu events also cover rows replaced by AJAX filtering.
function toggleTableActionMenu(button) {
  const menu = document.getElementById(button.getAttribute('aria-controls'));
  if (menu.matches(':popover-open')) { menu.hidePopover(); return; }
  menu.showPopover();
  menu.onbeforetoggle = event => button.setAttribute('aria-expanded', event.newState === 'open');
  button.setAttribute('aria-expanded', 'true');
  const rect = button.getBoundingClientRect();
  menu.style.left = Math.max(8, Math.min(rect.left, innerWidth - menu.offsetWidth - 8)) + 'px';
  menu.style.top = Math.max(8, rect.bottom + menu.offsetHeight + 8 > innerHeight ? rect.top - menu.offsetHeight - 4 : rect.bottom + 4) + 'px';
  menu.querySelector('[role="menuitem"]')?.focus();
}

document.addEventListener('click', event => {
  const menu = event.target.closest('.table-action-menu');
  if (menu?.matches(':popover-open') && event.target.closest('[role="menuitem"]')) menu.hidePopover();
});

document.addEventListener('keydown', event => {
  const menu = event.target.closest('.table-action-menu');
  if (!menu || !['ArrowDown', 'ArrowUp', 'Home', 'End', 'Escape'].includes(event.key)) return;
  event.preventDefault();
  if (event.key === 'Escape') {
    menu.hidePopover();
    document.querySelector(`[aria-controls="${menu.id}"]`)?.focus();
    return;
  }
  const items = [...menu.querySelectorAll('[role="menuitem"]')];
  const index = items.indexOf(document.activeElement);
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length;
  items[next]?.focus();
});

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
