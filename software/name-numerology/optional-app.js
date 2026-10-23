'use strict';
(() => {
  const byId = id => document.getElementById(id), core = NumerologyOptionalCore, format = Numerology.format;
  const fields = ['birth-year', 'birth-month', 'birth-day'].map(byId);
  let locale = 'ja', nameResult = null, birthResult = null, error = null, cleared = false;
  const data = () => NumerologyOptionalData.languages[locale];
  function node(tag, text, cls = '') {
    const n = document.createElement(tag); n.textContent = text; n.className = cls; return n;
  }
  function renderName() {
    byId('optional-name').hidden = !nameResult;
    const panel = byId('optional-name-content'); panel.replaceChildren();
    if (!nameResult) return;
    const reading = core.forName(nameResult, locale), ui = data().ui;
    panel.append(node('p', ui.intro), node('p', reading.spelling, 'optional-spelling'), node('p', ui.spellingHint, 'muted'));
    for (const part of reading.parts) panel.append(node('h3', part.heading), node('p', part.body));
    panel.append(node('h3', ui.blendHeading), node('p', reading.blend, 'preserve-lines'), node('h3', ui.questionHeading), node('p', reading.question));
  }
  function renderBirth() {
    const ui = data().ui, panel = byId('birth-results');
    byId('birth-status').textContent = error ? data().errors[error] : cleared ? ui.cleared : '';
    byId('birth-status').hidden = !error && !cleared;
    byId('birth-status').classList.toggle('status', !!error);
    panel.hidden = !birthResult; panel.replaceChildren();
    if (!birthResult) return;
    const r = birthResult, meanings = NumerologyData.content[locale].meanings;
    const card = (title, number) => { const section = node('section', '', 'optional-card');
      section.append(node('h3', title), node('p', number, 'optional-number')); return section; };
    const lp = card(ui.lifePath, r.lifePath.number);
    lp.append(node('h4', meanings[r.lifePath.number].theme), node('p', ui.lifeRole), node('p', data().meanings[r.lifePath.number].lifePath));
    if (r.lifePath.number > 9) lp.append(node('p', format(ui.master, r.lifePath.number, r.lifePath.number / 11 * 2, meanings[r.lifePath.number / 11 * 2].theme)));
    const birthday = card(ui.birthday, r.birthday);
    birthday.append(node('p', ui.birthdayRole), node('h4', format(ui.birthdayTheme, r.birthdayReduced.number, meanings[r.birthdayReduced.number].theme)), node('p', ui.birthdayNote));
    const cards = node('div', '', 'optional-birth-cards'); cards.append(lp, birthday); panel.append(cards, node('p', ui.reflectionNote, 'muted'));
    const details = node('details', '', 'optional-method');
    details.append(node('summary', ui.method), node('p', ui.methodText));
    for (const [key, value] of [['yearTrace', r.year.calculation], ['monthTrace', r.month.calculation], ['dayTrace', r.day.calculation],
      ['sumTrace', `${r.year.number} + ${r.month.number} + ${r.day.number} = ${r.lifePath.calculation}`], ['auxTrace', r.birthdayReduced.calculation]])
      details.append(node('p', `${ui[key]}: ${value}`, 'optional-calculation'));
    panel.append(details);
  }
  function setLocale(value) {
    locale = value;
    for (const n of document.querySelectorAll('[data-optional-text]')) n.textContent = data().ui[n.dataset.optionalText];
    renderName(); renderBirth();
  }
  function invalidateBirth() { birthResult = null; error = null; cleared = false; renderBirth(); }
  for (const field of fields) field.addEventListener('input', invalidateBirth);
  byId('birth-form').addEventListener('submit', event => {
    event.preventDefault();
    const outcome = core.calculate(...fields.map(field => field.value));
    birthResult = outcome.result; error = outcome.error; cleared = false; renderBirth();
    if (error) fields.find(field => !field.value.trim())?.focus();
  });
  byId('birth-clear').addEventListener('click', () => {
    for (const field of fields) field.value = '';
    birthResult = null; error = null; cleared = true; renderBirth(); fields[0].focus();
  });
  document.addEventListener('numerology-language', event => setLocale(event.detail));
  globalThis.NumerologyOptionalUI = {
    setNameResult(value) { nameResult = value; renderName(); }
  };
  // Do not restore birth input on a new load or browser back/forward cache return.
  const reset = () => { for (const field of fields) field.value = ''; invalidateBirth(); };
  window.addEventListener('pageshow', reset);
  reset(); setLocale('ja');
})();
