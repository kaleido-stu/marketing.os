(() => {
  if (window.taskTimingLoaded) return;
  window.taskTimingLoaded = true;
  const loadedAt = Date.now();
  const duration = seconds => {
    const total = Math.max(0, Math.floor(seconds));
    return `${Math.floor(total / 86400)} يوم ${Math.floor(total % 86400 / 3600)} ساعة ${Math.floor(total % 3600 / 60)} دقيقة ${total % 60} ثانية`;
  };
  function tick() {
    document.querySelectorAll('[data-task-clock]').forEach(clock => {
      const start = Number(clock.dataset.start);
      const deadline = Number(clock.dataset.deadline);
      const closed = clock.dataset.closed === '1';
      const now = Number(clock.dataset.now) + (Date.now() - loadedAt) / 1000;
      const end = closed ? Number(clock.dataset.completed) : now;
      const late = deadline && end ? Math.max(0, end - deadline) : 0;
      const overdue = !closed && deadline && end >= deadline;
      const percent = !start || !deadline || !end ? 0 : deadline <= start ? 100 : Math.max(0, Math.min(100, (end - start) / (deadline - start) * 100));
      clock.classList.toggle('is-overdue', !!overdue);
      clock.querySelector('[data-time-fill]').style.width = `${percent}%`;
      clock.querySelector('[role=progressbar]').setAttribute('aria-valuenow', percent.toFixed(1));
      clock.querySelector('[data-time-percent]').textContent = `${percent.toFixed(1)}%`;
      clock.querySelector('[data-time-label]').textContent = closed
        ? (late ? `اكتمل بتأخير ${duration(late)}` : 'اكتمل — توقف حساب الوقت')
        : overdue ? `متأخر منذ ${duration(late)}`
        : !deadline ? 'لم يُحدد موعد الانتهاء'
        : !start ? 'في انتظار بدء العمل'
        : `متبقي ${duration(deadline - end)} — الوقت مستمر أثناء المراجعة`;
    });
  }
  tick();
  setInterval(tick, 1000);
  window.startTaskWork = async (button, url) => {
    button.disabled = true;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'Accept': 'application/json', 'X-CSRF-TOKEN': document.querySelector('meta[name=csrf-token]').content},
        body: JSON.stringify({status: 'in_progress'}),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.message || 'تعذّر بدء التاسك');
      location.reload();
    } catch (error) {
      showToast(error.message);
      button.disabled = false;
    }
  };
})();
