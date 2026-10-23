'use strict';
(() => {
  const reduce = (value, keepMasters = true) => {
    const steps = [value];
    while (value > 9 && !(keepMasters && [11, 22, 33].includes(value))) {
      value = [...String(value)].reduce((sum, digit) => sum + Number(digit), 0);
      steps.push(value);
    }
    return { steps, number: value, calculation: steps.map((n, i) => i === 0 ? String(n) :
      [...String(steps[i - 1])].join(' + ') + ' = ' + n).join(' → ') };
  };
  function calculate(year, month, day, today) {
    const values = [year, month, day].map(v => String(v).trim());
    const fail = error => ({ result: null, error });
    if (values.some(v => !v)) return fail('missing');
    if (values.some((v, i) => !/^[0-9]+$/.test(v) || v.length > (i === 0 ? 4 : 2))) return fail('format');
    const [y, m, d] = values.map(Number);
    const leap = y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0);
    const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (y < 1 || y > 9999 || m < 1 || m > 12 || d < 1 || d > days[m - 1]) return fail('invalid');
    if (!today) {
      const now = new Date(); // Only read the local calendar; never parse user input as a timestamp.
      today = [now.getFullYear(), now.getMonth() + 1, now.getDate()];
    }
    if (y * 10000 + m * 100 + d > today[0] * 10000 + today[1] * 100 + today[2]) return fail('future');
    const yr = reduce(y), mo = reduce(m), dy = reduce(d);
    return { result: { year: yr, month: mo, day: dy, lifePath: reduce(yr.number + mo.number + dy.number),
      birthday: d, birthdayReduced: reduce(d, false) }, error: null };
  }
  function forName(result, locale) {
    const data = NumerologyOptionalData.languages[locale], ui = data.ui;
    const old = NumerologyData.content[locale], format = Numerology.format;
    const seen = new Set(), blend = [];
    const parts = ['expression', 'soul', 'personality'].map((kind, i) => {
      const n = result[kind].number, heading = old.ui['card' + i] + ' · ' + (n ?? '—');
      if (n === null) return { heading, body: old.ui.noLetters + '\n' + old.ui[i === 1 ? 'noVowels' : 'noConsonants'] };
      const meaning = data.meanings[n];
      let body = ui[kind + 'Intro'] + meaning[kind];
      if (!seen.has(n)) {
        seen.add(n);
        body += meaning.symbol + meaning.balance;
        if (n > 9) body += format(ui.master, n, n / 11 * 2, old.meanings[n / 11 * 2].theme);
      } else body += format(ui.repeat, n);
      blend.push(old.ui['card' + i] + ': ' + old.meanings[n].theme);
      return { heading, body };
    });
    return { spelling: format(ui.spelling, result.roman.toUpperCase()), parts,
      blend: blend.join(' / ') + '\n' + ui.blendNote,
      question: data.meanings[result.soul.number ?? result.expression.number].question };
  }
  globalThis.NumerologyOptionalCore = { calculate, forName, version: 'birth-date-20261023.1' };
})();
