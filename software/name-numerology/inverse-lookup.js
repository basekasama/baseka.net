// Generated from research/web/inverse-lookup.mjs; do not edit.
'use strict';
(() => {
// DOM-free inverse lookup. Numerology.Core produces the index; this module never
// romanizes or recalculates names, so it can coexist with the independent forward tool.
const interpretation = "Shares are conditional on this finite dictionary and chosen weights; they are not a person's identification probability or calibrated real-world confidence.";
const ordinal = (a, b) => a < b ? -1 : a > b ? 1 : 0;

function lookup(index, { rule = "R33", output, weighting = "Frequency", limit = 10 }) {
  if (weighting === "Frequency" && index.provenance?.frequencyAvailable === false) {
    throw new TypeError("This dictionary has no population frequencies; use Uniform.");
  }
  if (!["R0", "R33"].includes(rule) || !["Uniform", "Frequency"].includes(weighting)) {
    throw new TypeError("Unknown rule or weighting.");
  }
  const valid = n => n === null || (Number.isInteger(n) &&
    ((n >= 1 && n <= 9) || (rule === "R33" && [11, 22, 33].includes(n))));
  if (!output || output.e === null || !valid(output.e) || !valid(output.s) || !valid(output.p) ||
      (output.s === null && output.p === null) || !Number.isInteger(limit) || limit < 1 || limit > 1000) {
    throw new TypeError("Invalid output values or limit (1..1000).");
  }
  if (index.schemaVersion !== "1" || !index.buckets?.[rule] || !Array.isArray(index.names)) {
    throw new TypeError("Unsupported inverse index schema or rule.");
  }
  const key = `E=${output.e}|S=${output.s ?? "-"}|P=${output.p ?? "-"}`;
  const ids = index.buckets[rule][key] ?? [];
  const names = ids.map(id => {
    if (!Number.isInteger(id) || id < 0 || id >= index.names.length) {
      throw new TypeError("Invalid candidate reference.");
    }
    const name = index.names[id];
    if (!Number.isSafeInteger(name.count) || name.count < 1) {
      throw new RangeError("Index count exceeds JavaScript's positive safe-integer range.");
    }
    return name;
  });
  const total = names.reduce((sum, name) => sum + name.count, 0);
  if (!Number.isSafeInteger(total)) {
    throw new RangeError("Matching count exceeds JavaScript's safe-integer range.");
  }
  names.sort((a, b) => (weighting === "Frequency" ? b.count - a.count : 0) || ordinal(a.key, b.key));
  return {
    rule,
    output: { e: output.e, s: output.s, p: output.p },
    weighting,
    synthetic: index.provenance.synthetic,
    population: index.provenance.population,
    candidateCount: names.length,
    matchingCount: total,
    abstained: names.length === 0,
    candidates: names.slice(0, limit).map(name => ({
      name: name.name, key: name.key, readings: [...name.readings], count: name.count,
      initials: { ...name.initials },
      dictionaryConditionalShare: weighting === "Frequency" ? name.count / total : 1 / names.length
    })),
    interpretation
  };
}

globalThis.NumerologyInverse = { lookup };
})();
