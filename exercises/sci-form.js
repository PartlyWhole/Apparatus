// Scientific or Not — is it a decimal, scientific notation, or neither?
// Spec: specs/sci-form.md. Engine API: docs/design/engine.md.
(function () {
  const { r } = Apparatus.util;
  const digits = n => Array.from({ length: n }, (_, i) => String(i ? r(0, 9) : r(1, 9))).join('');
  const frac = n => digits(n).replace(/0+$/, '');              // no trailing zeros after the point
  const exp = (lo, hi, neg) => (neg ? -1 : 1) * r(lo, hi);

  // an item: { L: digits before the point, R: digits after ('' for none), e: exponent, or null for a plain decimal }
  const commas = s => s.length > 3 ? s.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : s;
  const supNum = e => (e < 0 ? '−' : '') + Math.abs(e);
  const SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '−': '⁻' };

  Apparatus.define({
    id: 'sci-form',
    version: 2,                       // storage: apparatus.sci-form.v2
    title: 'Scientific or Not',

    choices: [
      { id: 'dec', label: 'Decimal', keys: ['d'] },
      { id: 'sci', label: 'Scientific', keys: ['s'] },
      { id: 'none', label: 'Neither', keys: ['n'] }
    ],

    // one idea per answer; order = the order tricky questions interleave in
    ideas: {
      dec:  { name: 'Decimal',    easy: ['dec-whole', 'dec-point'], hard: ['dec-one', 'dec-small'] },
      none: { name: 'Neither',    easy: ['fake-big'],               hard: ['fake-ten', 'fake-small'] },
      sci:  { name: 'Scientific', easy: ['sci-big'],                hard: ['sci-small', 'sci-bare'] }
    },

    kinds: {
      'dec-whole':  { idea: 'dec',  make: () => ({ L: digits(r(3, 7)), R: '', e: null }) },
      'dec-point':  { idea: 'dec',  make: () => ({ L: digits(r(2, 3)), R: frac(r(1, 2)), e: null }) },
      'dec-small':  { idea: 'dec',  make: () => ({ L: '0', R: '0'.repeat(r(1, 3)) + digits(r(1, 2)), e: null }) },
      'dec-one':    { idea: 'dec',  make: () => ({ L: String(r(1, 9)), R: frac(r(1, 3)) || '5', e: null }) },        // looks like the front of scientific
      'sci-big':    { idea: 'sci',  make: () => ({ L: String(r(1, 9)), R: frac(r(1, 3)) || '2', e: exp(2, 9) }) },
      'sci-small':  { idea: 'sci',  make: () => ({ L: String(r(1, 9)), R: frac(r(1, 3)) || '4', e: exp(2, 8, true) }) },
      'sci-bare':   { idea: 'sci',  make: () => ({ L: String(r(1, 9)), R: '', e: exp(3, 9, Math.random() < 0.4) }) },
      'fake-big':   { idea: 'none', make: () => ({ L: digits(r(2, 3)), R: frac(r(1, 2)), e: exp(2, 8) }) },
      'fake-small': { idea: 'none', make: () => ({ L: digits(r(2, 3)), R: Math.random() < 0.5 ? frac(r(1, 2)) : '', e: exp(2, 7, true) }) },
      'fake-ten':   { idea: 'none', make: () => ({ L: '10', R: frac(r(1, 2)), e: exp(2, 8, Math.random() < 0.4) }) }  // 10.x looks almost right
    },

    // the same digits in all three forms, so only the form changes
    opening: [
      { kind: 'sci-big',   item: { L: '4', R: '56', e: 3 } },
      { kind: 'fake-big',  item: { L: '45', R: '6', e: 2 } },
      { kind: 'dec-whole', item: { L: '4560', R: '', e: null } }
    ],

    // the digits before the point each get a box (so they can be counted); a decimal has a hidden "× 10?" slot
    render(n, cue) {
      const L = n.e === null ? commas(n.L) : n.L;
      const ds = Array.from(L).map(c => c === ',' ? ',' : `<span class="d">${c}</span>`).join('');
      const x = n.e === null ? `<span class="ghost" aria-hidden="true">× 10<sup>?</sup></span>` : `<span class="x">× 10<sup>${supNum(n.e)}</sup></span>`;
      return `<span class="n${cue ? ' ' + cue : ''}"><span class="L">${ds}</span>${n.R ? '.' + n.R : ''}${x}</span>`;
    },
    text: n => (n.e === null ? commas(n.L) : n.L) + (n.R ? '.' + n.R : '') + (n.e === null ? '' : ' × 10' + Array.from(supNum(n.e)).map(c => SUP[c]).join('')),
    speak: n => `${n.L}${n.R ? ' point ' + n.R : ''}${n.e === null ? '' : ' times 10 to the ' + (n.e < 0 ? 'minus ' : '') + Math.abs(n.e)}`,

    // after a miss: why the PICKED answer is wrong — [cue class on the number, one plain sentence]
    feedback(n, want, chose) {
      const x = `× 10<sup>${n.e === null ? 'n' : supNum(n.e)}</sup>`;
      if (chose === 'dec') return ['why-pow', `It has ${x}, so it’s not a decimal.`];
      if (want === 'dec') return ['why-dec', chose === 'sci' ? `There’s no ${x}, so it’s not scientific notation.` : `There’s no ${x}. A plain number is a decimal.`];
      if (want === 'none') return ['why-fake', `There are ${n.L.length} digits (${n.L}) before the point. Scientific notation has just one.`];
      return ['why-sci', `One digit (${n.L}) before the point, then ${x}. That’s scientific notation.`];   // want sci, picked neither
    },

    // for the analytics page: what this kind of miss usually means, and what a tutor can do
    diagnose(want, chose, kind) {
      if (want === 'none' && chose === 'sci') return ['Sees × 10ⁿ and stops looking. Doesn’t count the digits before the point.',
        'Cover the × 10ⁿ. Ask them to count the digits before the point. Scientific notation needs exactly one.'];
      if (want === 'none' && chose === 'dec') return ['Doesn’t treat × 10ⁿ as part of the number.',
        'Point to the × 10ⁿ and ask: “Is this part of the number?” Then count the digits before the point.'];
      if (want === 'dec' && chose === 'sci') return [kind === 'dec-one' ? 'Sees one digit before the point and calls it scientific, without checking for × 10ⁿ.' : 'Calls a plain number scientific.',
        'Ask: “Where is the power of ten?” No × 10ⁿ means it’s just a decimal.'];
      if (want === 'dec' && chose === 'none') return ['May think a decimal needs a point, or that small numbers like 0.004 are something else.',
        'Any plain number — 4,560 or 0.004 — is a decimal. Only × 10ⁿ makes it something else.'];
      if (want === 'sci' && chose === 'none') return [kind === 'sci-small' ? 'Unsure that a negative power (10⁻⁴) still counts.' : kind === 'sci-bare' ? 'Thinks the front number needs a point (7 × 10⁵ is fine).' : 'Not sure what makes scientific notation valid.',
        'The only rules: one digit (not 0) before the point, times a power of ten. The power can be negative, and the point can be left off.'];
      if (want === 'sci' && chose === 'dec') return ['Doesn’t treat × 10ⁿ as part of the number.', 'Point to the × 10ⁿ: a decimal never has one.'];
      return ['', ''];
    },

    // the cheat sheet: the rule, then one example of each with what decides it lit up
    cheatRule: 'Scientific notation is one digit from 1 to 9 before the point, times a power of ten. A decimal has no power of ten.',
    key: [
      { item: { L: '4560', R: '', e: null }, cue: 'why-dec', label: 'Decimal' },
      { item: { L: '4', R: '56', e: 3 }, cue: 'why-sci', label: 'Scientific' },
      { item: { L: '45', R: '6', e: 2 }, cue: 'why-fake', label: 'Neither' }
    ]
  });
})();
