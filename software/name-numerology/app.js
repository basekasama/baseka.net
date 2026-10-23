'use strict';

(() => {
  const { content } = globalThis.NumerologyData;
  const { convert, calculate, InputError, format } = globalThis.Numerology;
  const byId = id => document.getElementById(id);
  const name = byId('name');
  const roman = byId('roman');
  const status = byId('status');
  let locale = 'ja';
  let result = null;
  let error = null;
  const ui = () => content[locale].ui;
  function showStatus() {
    status.hidden = error === null;
    status.textContent = error ? format(content[locale].errors[error.code], ...error.values) : '';
  }
  function clearResult() {
    result = null;
    globalThis.NumerologyOptionalUI.setNameResult(null);
    byId('cards').replaceChildren();
    byId('results').hidden = true;
    byId('empty').hidden = false;
  }
  function element(tag, className, text) {
    const node = document.createElement(tag);
    node.className = className;
    node.textContent = text;
    return node;
  }
  function renderResult() {
    const text = ui();
    const previousOpen = [...byId('cards').querySelectorAll('details')].map(node => node.open);
    byId('result-title').textContent = format(text.resultTitle, name.value.trim(), result.roman);
    const cards = ['expression', 'soul', 'personality'].map((kind, index) => {
      const part = result[kind];
      const meaning = content[locale].meanings[part.number];
      const card = element('article', 'card', '');
      card.append(element('p', 'role', text['role' + index]),
        element('h3', '', text['card' + index]),
        element('p', 'number', part.number ?? '—'),
        element('p', 'theme', meaning ? meaning.theme : text.noLetters),
        element('p', 'description', meaning ? meaning[kind] : text[index === 1 ? 'noVowels' : 'noConsonants']));
      const details = element('details', '', '');
      details.open = previousOpen[index] ?? false;
      details.append(element('summary', '', text.breakdown),
        element('p', 'letters', format(text.letters, part.letters.toUpperCase() || text.none)),
        element('p', 'calculation', part.number === null ? text.noCalculation : part.calculation));
      card.append(details);
      return card;
    });
    byId('cards').replaceChildren(...cards);
    byId('results').hidden = false;
    byId('empty').hidden = true;
    globalThis.NumerologyOptionalUI.setNameResult(result);
  }
  function applyLanguage() {
    document.documentElement.lang = locale;
    document.title = ui().title;
    for (const node of document.querySelectorAll('[data-text]')) {
      node.textContent = ui()[node.dataset.text];
    }
    byId('language').setAttribute('aria-label', ui().languageHint);
    byId('language').title = ui().languageHint;
    showStatus();
    if (result) {
      renderResult();
    }
    document.dispatchEvent(new CustomEvent('numerology-language', { detail: locale }));
  }
  function updateName() {
    clearResult();
    error = null;
    try {
      roman.value = name.value.trim() ? convert(name.value) : '';
    } catch (ex) {
      if (!(ex instanceof InputError)) {
        throw ex;
      }
      roman.value = '';
      error = ex;
    }
    showStatus();
  }
  function submit() {
    error = null;
    try {
      convert(name.value);
      result = calculate(roman.value);
      renderResult();
    } catch (ex) {
      if (!(ex instanceof InputError)) {
        throw ex;
      }
      clearResult();
      error = ex;
    }
    showStatus();
  }
  name.addEventListener('input', event => {
    if (!event.isComposing) {
      updateName();
    }
  });
  name.addEventListener('compositionend', updateName);
  name.addEventListener('compositionstart', clearResult);
  roman.addEventListener('input', () => {
    clearResult();
    error = null;
    showStatus();
  });
  byId('name-form').addEventListener('submit', event => {
    event.preventDefault();
    submit();
  });
  byId('example').addEventListener('click', () => {
    name.value = ui().sampleName;
    updateName();
    submit();
  });
  byId('language').addEventListener('click', () => {
    locale = locale === 'ja' ? 'en' : 'ja';
    applyLanguage();
  });
  applyLanguage();
})();
