(function () {
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!finePointer || reduceMotion) return;

  const fieldSelector = 'input, textarea, select';

  document.addEventListener('mousedown', function (event) {
    if (event.target && event.target.closest && event.target.closest(fieldSelector)) return;
    const cut = document.createElement('span');
    cut.className = 'cursor-cut';
    cut.style.left = event.clientX + 'px';
    cut.style.top = event.clientY + 'px';
    document.body.appendChild(cut);
    cut.addEventListener('animationend', function () {
      cut.remove();
    });
  });
})();
