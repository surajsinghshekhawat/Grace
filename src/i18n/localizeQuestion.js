/**
 * Apply i18n to assessment question copy while keeping `value` / `id` stable for the ML backend.
 * Falls back to `questions.js` English when a key is missing.
 */

const OPTION_SET_PREFIX = {
  ["Very Poor\nPoor\nFair\nGood\nVery Good"]: "qOpt.health",
  ["Never\nRarely\nSometimes\nOften\nDaily"]: "qOpt.freqDaily",
  ["Never\nRarely\nSometimes\nOften\nAlways"]: "qOpt.freqAlways",
  ["Very Dissatisfied\nDissatisfied\nNeutral\nSatisfied\nVery Satisfied"]: "qOpt.satisfy",
  ["Very Low\nLow\nModerate\nHigh\nVery High"]: "qOpt.confidence",
  ["None\nLittle\nModerate\nGood\nComplete Control"]: "qOpt.control",
  ["Very Difficult\nDifficult\nModerate\nEasy\nVery Easy"]: "qOpt.access",
};

function isYesNoOptions(options) {
  if (!Array.isArray(options) || options.length !== 2) return false;
  const vals = new Set(options.map((o) => o.value));
  return vals.has("yes") && vals.has("no");
}

/** @param {object} q raw question from `questions.js` */
export function localizeQuestion(q, t) {
  if (!q || typeof q !== "object") return q;
  const textKey = `q.${q.id}.text`;
  const textTr = t(textKey);
  const text = textTr === textKey ? q.text : textTr;

  const options = localizeOptions(q, t);

  return { ...q, text, options };
}

function localizeOptions(q, t) {
  if (!Array.isArray(q.options)) return q.options;
  const sig = q.options.map((o) => o.label).join("\n");
  const prefix = OPTION_SET_PREFIX[sig];
  if (prefix) {
    return q.options.map((o, i) => {
      const k = `${prefix}.${i + 1}`;
      const lab = t(k);
      return lab === k ? o : { ...o, label: lab };
    });
  }
  if (isYesNoOptions(q.options)) {
    return q.options.map((o) => {
      const k = o.value === "yes" ? "qOpt.yes" : "qOpt.no";
      const lab = t(k);
      return lab === k ? o : { ...o, label: lab };
    });
  }
  return q.options.map((o) => {
    const k = `q.${q.id}.opt.${String(o.value)}`;
    const lab = t(k);
    return lab === k ? o : { ...o, label: lab };
  });
}
