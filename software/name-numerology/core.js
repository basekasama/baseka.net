'use strict';

// Shared data is embedded for offline file:// use. Calculation stays in the browser.
(() => {
  const { rules } = globalThis.NumerologyData;
  const maxNameLength = 80;
  const maxRomanLength = 240;
  class InputError extends Error {
    constructor(code, ...values) {
      super(code);
      this.code = code;
      this.values = values;
    }
  }
  const latin = c => c >= 'a' && c <= 'z';
  const vowel = c => 'aiueo'.includes(c) && c.length === 1;
  const separator = c => c === ' ' || c === '-' || c === "'";
  function normalize(input) {
    if (!input.isWellFormed()) {
      throw new InputError('invalidText');
    }
    return input.normalize('NFKC').replaceAll('’', "'").trim().toLowerCase();
  }
  function validateRoman(input) {
    const name = normalize(input);
    if (name.length > maxRomanLength) {
      throw new InputError('romanLength', maxRomanLength);
    }
    if ([...name].some(c => !latin(c) && !separator(c))) {
      throw new InputError('romanCharacters');
    }
    if (![...name].some(latin)) {
      throw new InputError('noLatin');
    }
    return name;
  }
  function syllable(name, i) {
    if (i >= name.length) {
      return ['', 0];
    }
    const pair = rules.pairs[name.slice(i, i + 2)];
    if (pair) {
      return [pair, 2];
    }
    return rules.kana[name[i]] ? [rules.kana[name[i]], 1] : ['', 0];
  }
  function convert(input) {
    const name = normalize(input);
    if (!name.length) {
      throw new InputError('empty');
    }
    if (name.length > maxNameLength) {
      throw new InputError('nameLength', maxNameLength);
    }
    const hasLatin = [...name].some(latin);
    const hasKana = [...name].some(c => c >= 'ぁ' && c <= 'ゖ');
    if (hasLatin && hasKana) {
      throw new InputError('mixed');
    }
    if (!hasKana) {
      return validateRoman(name);
    }
    let result = '';
    for (let i = 0; i < name.length; i++) {
      const c = name[i];
      if (separator(c)) {
        result += c;
        continue;
      }
      if (c === 'ー') {
        if (!result.length || !vowel(result.at(-1))) {
          throw new InputError('longVowel');
        }
        result += result.at(-1);
        continue;
      }
      if (c === 'っ') {
        const [next] = syllable(name, i + 1);
        if (!next.length || vowel(next[0]) || next[0] === 'n') {
          throw new InputError('smallTsu');
        }
        result += next.startsWith('ch') ? 't' : next[0];
        continue;
      }
      const [roman, size] = syllable(name, i);
      if (!size) {
        throw new InputError('kana', c);
      }
      result += roman;
      if (c === 'ん') {
        const [next] = syllable(name, i + 1);
        if (next.length && (vowel(next[0]) || next[0] === 'y')) {
          result += "'";
        }
      }
      i += size - 1;
    }
    return validateRoman(result);
  }
  function part(letters) {
    if (!letters.length) {
      return { letters: '', total: 0, number: null, calculation: '' };
    }
    const values = [...letters].map(c => (c.charCodeAt(0) - 97) % 9 + 1);
    const total = values.reduce((a, b) => a + b, 0);
    let number = total;
    let calculation = values.join(' + ') + ' = ' + total;
    while (number > 9 && ![11, 22, 33].includes(number)) {
      number = [...String(number)].reduce((a, b) => a + Number(b), 0);
      calculation += ' → ' + number;
    }
    return { letters, total, number, calculation };
  }
  function calculate(input) {
    const roman = validateRoman(input);
    const letters = [...roman].filter(latin);
    return { roman, expression: part(letters.join('')),
      soul: part(letters.filter(vowel).join('')),
      personality: part(letters.filter(c => !vowel(c)).join('')) };
  }
  const format = (pattern, ...values) => pattern.replace(/\{(\d+)\}/g, (_, n) => String(values[n]));
  globalThis.Numerology = { convert, calculate, validateRoman, InputError, format };
})();
