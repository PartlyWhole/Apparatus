// Prefix Names — what each prefix symbol stands for (da = deca), the reverse (deca = da), and its power of ten (da = 10¹).
// Every prefix is its own idea: name (multiple choice), symbol (written), power (written); passing needs all three.
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
  function symChoice(p) {
    const opts = shuffle(['µ', 'm', 'M', 'c']);
    return { s: p.s, how: 'symc', opts, ans: opts.indexOf(p.s) };
  }
  const html = it => it.how === 'name'
    ? `<div class="fq"><div class="q"><span class="sym">${it.s}</span> = ?</div><div class="mc"></div><div class="ans" aria-live="polite"></div></div>`
    : it.how === 'symc'
    ? `<div class="fq"><div class="q"><span class="word">${byS(it.s).name}</span> = ?</div><div class="mc"></div><div class="ans" aria-live="polite"></div></div>`
    : it.how === 'sym'
    ? `<div class="fq"><div class="q"><span class="word">${byS(it.s).name}</span> = ${F.text('symbol')}</div><button type="button" class="go">Check</button><div class="ans" aria-live="polite"></div></div>`
    : `<div class="fq"><div class="q"><span class="sym">${it.s}</span> = ${F.pow('power')}</div><button type="button" class="go">Check</button><div class="ans" aria-live="polite"></div></div>`;
  // a typed symbol: case matters (M ≠ m); µ can be typed as u or μ
  const symOf = v => v.replace(/^[uμ]$/, 'µ');
  const supHTML = e => `10<sup>${e < 0 ? '−' + -e : e}</sup>`;

  const ideas = {}, kinds = {};
  // order: alternate big and small prefixes so look-alikes and neighbors aren't back to back
  ['M', 'm', 'k', 'c', 'h', 'd', 'da', 'µ'].forEach(s => {
    const p = byS(s);
    ideas[s] = { name: `${s} (${p.name})`, easy: ['n-' + s], hard: ['n-' + s, 'r-' + s, 'p-' + s], check: 'p-' + s };
    kinds['n-' + s] = { idea: s, make: () => nameItem(p) };
    // the symbol, written — except micro: µ isn't on most keyboards, so it's a choice of symbols
    kinds['r-' + s] = { idea: s, make: () => s === 'µ' ? symChoice(p) : ({ s, how: 'sym' }) };
    kinds['p-' + s] = { idea: s, make: () => ({ s, how: 'pow' }) };
  });

  Apparatus.define({
    id: 'prefix-names',
    title: 'Prefix Names',
    ideas, kinds,
    defaults: { tricky: 3 },
    nextOnRight: true,
    text: it => it.how === 'sym' || it.how === 'symc' ? `${byS(it.s).name} = ? (symbol)` : `${it.s} = ? (${it.how === 'name' ? 'name' : 'power'})`,
    speak: it => it.how === 'name' ? `What does the prefix ${it.s} stand for?` : it.how === 'sym' || it.how === 'symc' ? `What is the symbol for ${byS(it.s).name}?` : `What power of ten is the prefix ${it.s}?`,
    ask(el, it, submit) {
      el.innerHTML = html(it);
      if (it.how === 'name' || it.how === 'symc') el._mc = F.choices(el, it.opts, submit);
      else el._form = F.wire(el, v => submit(it.how === 'sym' ? symOf(v.symbol) : v.power));
    },
    correct: it => it.how === 'name' || it.how === 'symc' ? it.ans : it.how === 'sym' ? it.s : byS(it.s).e,
    isRight: (it, a) => it.how === 'name' || it.how === 'symc' ? a === it.ans : it.how === 'sym' ? a === it.s : a === byS(it.s).e,
    classify(it, a) {
      const p = byS(it.s);
      if (it.how === 'name') return LOOKALIKE[p.s] && it.opts[a] === byS(LOOKALIKE[p.s]).name ? 'case' : 'name';
      if (it.how === 'sym') return a.toLowerCase() === p.s.toLowerCase() ? 'case' : 'name';
      if (it.how === 'symc') return 'name';
      return a !== 0 && Math.sign(a) !== Math.sign(p.e) ? 'sign' : 'count';
    },
    feedback(it, want, a, kind, err) {
      const p = byS(it.s), val = X.powerVal(p.e);
      if (err === 'case') return ['', p.s === 'da' ? `deca is da, all small letters.` : `Capital M is Mega (10<sup>6</sup>); small m is milli (10<sup>−3</sup>).`];
      if (err === 'name') return ['', it.how === 'symc' ? `micro is µ (the Greek letter mu); m is milli.` : it.how === 'sym' ? `${p.name} is ${p.s}.` : `${p.s} is ${p.name}: ${supHTML(p.e)} = ${val}.`];
      if (err === 'sign') return ['', `${p.name} is ${p.e > 0 ? 'bigger' : 'smaller'} than the base unit, so its power is ${p.e > 0 ? 'positive' : 'negative'}: ${supHTML(p.e)}.`];
      return ['', `${p.name} is ${supHTML(p.e)} = ${val}.`];
    },
    revealMs: 1100,
    reveal(el, it, a, o) {
      if (it.how === 'name' || it.how === 'symc') el._mc.mark(a, it.ans); else el._form.mark(o.right);   // (symbol and power are written)
      if (!o.right) { const p = byS(it.s); el.querySelector('.ans').innerHTML = `${p.s} = ${p.name} = ${supHTML(p.e)}`; }
    },
    errors: { name: 'wrong name or symbol', case: 'capital vs small letter (M / m)', sign: 'power with the wrong sign', count: 'wrong power' },
    diagnose(err) {
      if (err === 'case') return ['Mixes up capital M (Mega) and small m (milli).', 'Capital means big: M is a million; small m is a thousandth.'];
      if (err === 'name') return ['Doesn’t know this prefix’s name yet.', 'Say the line aloud together: Mega, kilo, hecto, deca, base, deci, centi, milli, micro.'];
      if (err === 'sign') return ['Gets the sign backwards: small prefixes have negative powers.', 'Ask: is a millimeter bigger or smaller than a meter? Smaller → negative power.'];
      return ['Knows the direction but not how many places.', 'Count the spots on the line from the base unit, empty ones too.'];
    },
    cheat: X.cheatHTML()
  });
})();
