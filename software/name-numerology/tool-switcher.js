'use strict';

(() => {
  const views = [...document.querySelectorAll('.tool-view')];
  const choices = [...document.querySelectorAll('[data-tool-choice]')];

  function requestedView() {
    return location.hash === '#inverse-tool' ? 'inverse-tool' : 'forward-tool';
  }

  function activate(viewId) {
    for (const view of views) {
      view.hidden = view.id !== viewId;
    }

    for (const choice of choices) {
      const active = choice.dataset.toolChoice === viewId;
      choice.classList.toggle('active', active);
      choice.setAttribute('aria-current', active ? 'true' : 'false');
    }
  }

  for (const choice of choices) {
    choice.addEventListener('click', () => activate(choice.dataset.toolChoice));
  }

  window.addEventListener('hashchange', () => activate(requestedView()));
  activate(requestedView());
})();
