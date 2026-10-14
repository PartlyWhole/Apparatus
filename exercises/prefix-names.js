// Prefix Names — what each prefix symbol stands for (da = deca) and the power of ten it means (da = 10¹).
// Every prefix is its own idea: name (multiple choice), then power (written); passing needs every prefix both ways.
// Spec: specs/prefixes.md (0). Uses lib/prefix.js, lib/forms.js, lib/places.js.
(function () {
  const X = Prefix, F = Forms, P = Places, { shuffle } = Apparatus.util;
  const LIST = X.PRE.filter(p => p.e !== 0);                    // M k h da d c m µ
  // name distractors: the look-alike first (M ↔ m), then neighbors on the line
  const LOOKALIKE = { M: 'm', m: 'M' };
  function nameItem(p) {
    const others = LIST.filter(q => q !== p);
    const pick = [];
    if (LOOKALIKE[p.s]) pick.push(others.find(q => q.s === LOOKALIKE[p.s]));
    shuffle(others.filter(q => !pick.includes(q)).sort((a, b) => Math.abs(a.e - p.e) - Math.abs(b.e - p.e)).slice(0, 4)).forEach(q => { if (pick.length < 3) pick.push(q); });
    const opts = shuffle([p].concat(pick));
    return { s: p.s, how: 'name', opts: opts.map(q => q.name), ans: opts.indexOf(p) };
  }
  const byS = s => LIST.find(p => p.s === s);
  const html = it => it.how === 'name'
    ? `<div class="fq"><div class="q"><span class="sym">${it.s}</span> = ?</div><div class="mc"></div><div class="ans" aria-live="polite"></div></div>`
    : `<div class="fq"><div class="q"><span class="sym">${it.s}</span> = ${F.pow('power')}</div><button type="button" class="go">Check</button><div class="ans" aria-live="polite"></div></div>`;
  const supHTML = e => `10<sup>${e < 0 ? '−' + -e : e}</sup>`;

  const ideas = {}, kinds = {};
  // order: alternate big and small prefixes so look-alikes and neighbors aren't back to back
  ['M', 'm', 'k', 'c', 'h', 'd', 'da', 'µ'].forEach(s => {
    const p = byS(s);
    ideas[s] = { name: `${s} (${p.name})`, easy: ['n-' + s], hard: ['n-' + s, 'p-' + s], check: 'p-' + s };
    kinds['n-' + s] = { idea: s, make: () => nameItem(p) };
    kinds['p-' + s] = { idea: s, make: () => ({ s, how: 'pow' }) };
  });

  Apparatus.define({
    id: 'prefix-names',
    title: 'Prefix Names',
    ideas, kinds,
    nextOnRight: true,
    text: it => `${it.s} = ? (${it.how === 'name' ? 'name' : 'power'})`,
    speak: it => it.how === 'name' ? `What does the prefix ${it.s} stand for?` : `What power of ten is the prefix ${it.s}?`,
    ask(el, it, submit) {
      el.innerHTML = html(it);
      if (it.how === 'name') el._mc = F.choices(el, it.opts, submit);
      else el._form = F.wire(el, v => submit(v.power));
    },
    correct: it => it.how === 'name' ? it.ans : byS(it.s).e,
    isRight: (it, a) => it.how === 'name' ? a === it.ans : a === byS(it.s).e,
    classify(it, a) {
      const p = byS(it.s);
      if (it.how === 'name') return LOOKALIKE[p.s] && it.opts[a] === byS(LOOKALIKE[p.s]).name ? 'case' : 'name';
      return a !== 0 && Math.sign(a) !== Math.sign(p.e) ? 'sign' : 'count';
    },
    feedback(it, want, a, kind, err) {
      const p = byS(it.s), val = X.powerVal(p.e);
      if (err === 'case') return ['', `Capital M is Mega (10<sup>6</sup>); small m is milli (10<sup>−3</sup>).`];
      if (err === 'name') return ['', `${p.s} is ${p.name}: ${supHTML(p.e)} = ${val}.`];
      if (err === 'sign') return ['', `${p.name} is ${p.e > 0 ? 'bigger' : 'smaller'} than the base unit, so its power is ${p.e > 0 ? 'positive' : 'negative'}: ${supHTML(p.e)}.`];
      return ['', `${p.name} is ${supHTML(p.e)} = ${val}.`];
    },
    revealMs: 1100,
    reveal(el, it, a, o) {
      if (it.how === 'name') el._mc.mark(a, it.ans); else el._form.mark(o.right);
      if (!o.right) { const p = byS(it.s); el.querySelector('.ans').innerHTML = `${p.s} = ${p.name} = ${supHTML(p.e)}`; }
    },
    errors: { name: 'wrong name', case: 'M and m mixed up', sign: 'power with the wrong sign', count: 'wrong power' },
    diagnose(err) {
      if (err === 'case') return ['Mixes up capital M (Mega) and small m (milli).', 'Capital means big: M is a million; small m is a thousandth.'];
      if (err === 'name') return ['Doesn’t know this prefix’s name yet.', 'Say the line aloud together: Mega, kilo, hecto, deca, base, deci, centi, milli, micro.'];
      if (err === 'sign') return ['Gets the sign backwards: small prefixes have negative powers.', 'Ask: is a millimeter bigger or smaller than a meter? Smaller → negative power.'];
      return ['Knows the direction but not how many places.', 'Count the spots on the line from the base unit, empty ones too.'];
    },
    keyHTML: `<div class="pkey2">${X.lineHTML('m', [], false, true)}</div>`
  });
})();
