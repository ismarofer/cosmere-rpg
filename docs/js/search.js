/* Motor de búsqueda en el navegador: índice invertido con prefijos, tolerancia a erratas, sinónimos,
   frases entre comillas, exclusión (-palabra) y filtro de categoría (talento: ...). Sin dependencias. */
(function () {
  const MAP = { á: 'a', à: 'a', ä: 'a', â: 'a', é: 'e', è: 'e', ë: 'e', ê: 'e', í: 'i', ì: 'i', ï: 'i', î: 'i',
    ó: 'o', ò: 'o', ö: 'o', ô: 'o', ú: 'u', ù: 'u', ü: 'u', û: 'u', ñ: 'n' };

  // Normalización que conserva la longitud (para resaltar sobre el texto original)
  function normChars(s) {
    let out = '';
    for (let i = 0; i < s.length; i++) {
      const c = s[i].toLowerCase();
      out += c.length === 1 ? (MAP[c] || c) : s[i];
    }
    return out;
  }

  const STOP = new Set('de la el los las un una unos unas y o u e en a al del con por para que se es lo su sus como cual cuales mi tu'.split(' '));

  function stem(w) {
    if (w.length <= 3) return w;
    if (w.endsWith('ciones')) return w.slice(0, -6) + 'cion';
    if (w.endsWith('ces')) return w.slice(0, -3) + 'z';
    if (w.endsWith('es') && w.length > 4 && !'aeiou'.includes(w[w.length - 3])) return w.slice(0, -2);
    if (w.endsWith('s')) return w.slice(0, -1);
    return w;
  }

  function tokenize(text) {
    const n = normChars(text);
    const m = n.match(/[a-z0-9]+/g);
    return m ? m.map(stem) : [];
  }

  function within1(a, b) {
    if (a === b) return true;
    const la = a.length, lb = b.length;
    if (Math.abs(la - lb) > 1) return false;
    let i = 0, j = 0, diff = 0;
    while (i < la && j < lb) {
      if (a[i] === b[j]) { i++; j++; continue; }
      if (++diff > 1) return false;
      if (la === lb) { i++; j++; } else if (la > lb) i++; else j++;
    }
    return diff + (la - i) + (lb - j) <= 1;
  }

  function fieldText(e) {
    const f = e.f || {};
    const parts = [];
    for (const k in f) {
      const v = f[k];
      if (v == null || v === '' || typeof v === 'boolean') continue;
      if (k.endsWith('_n') || k.endsWith('_g') || k === 'alcance_corto' || k === 'alcance_largo') continue;
      parts.push(Array.isArray(v) ? v.join(' ') : String(v));
    }
    return parts.join(' ');
  }

  class Engine {
    constructor(entries, opts) {
      this.docs = entries;
      this.boost = (opts && opts.boost) || {};
      this.index = new Map();
      this.syn = new Map();
      const aliases = {};
      for (const k in (opts && opts.aliases) || {}) aliases[normChars(k)] = opts.aliases[k];
      // sinónimos por raíz
      for (const group of (opts && opts.synonyms) || []) {
        const stems = [...new Set(group.map((w) => stem(normChars(w))))];
        for (const s of stems) this.syn.set(s, [...(this.syn.get(s) || []), ...stems.filter((x) => x !== s)]);
      }
      this.titleTokens = [];
      entries.forEach((e, i) => {
        const tt = tokenize(e.title);
        this.titleTokens.push(new Set(tt));
        this._add(i, tt, 8);
        const al = aliases[normChars(e.title)];
        if (al) this._add(i, tokenize(al), 6);
        this._add(i, tokenize(fieldText(e)), 3);
        this._add(i, tokenize(e.path.join(' ')), 2);
        this._add(i, tokenize(e.body + ' ' + (e.mecanica || '')), 1);
      });
      this.terms = [...this.index.keys()];
    }

    _add(i, toks, w) {
      const tf = new Map();
      for (const t of toks) tf.set(t, (tf.get(t) || 0) + 1);
      for (const [t, c] of tf) {
        let m = this.index.get(t);
        if (!m) this.index.set(t, (m = new Map()));
        m.set(i, (m.get(i) || 0) + w * (1 + Math.log(c)));
      }
    }

    parse(q, cats) {
      let s = q || '';
      const phrases = [], neg = [];
      s = s.replace(/"([^"]+)"/g, (_, p) => { phrases.push(normChars(p).trim()); return ' '; });
      let catFilter = null;
      const raw = [];
      for (const tok of s.split(/\s+/).filter(Boolean)) {
        const m = tok.match(/^([^:\s]+):(.*)$/);
        if (m && cats) {
          const key = normChars(m[1]);
          const c = cats.find((x) => x.id === key || normChars(x.label).startsWith(key));
          if (c) { catFilter = c.id; if (m[2]) raw.push(m[2]); continue; }
        }
        if (tok.length > 1 && tok[0] === '-') { neg.push(...tokenize(tok.slice(1))); continue; }
        raw.push(tok);
      }
      let words = raw.join(' ');
      let terms = tokenize(words + ' ' + phrases.join(' '));
      const nonStop = terms.filter((t) => !STOP.has(t));
      if (nonStop.length) terms = nonStop;
      const plain = normChars(words).match(/[a-z0-9]+/g) || [];
      return { terms, neg, phrases, catFilter, plain };
    }

    variants(t) {
      const v = new Map(); // term -> weight
      if (this.index.has(t)) v.set(t, 1);
      if (t.length >= 3) {
        let n = 0;
        for (const x of this.terms) {
          if (x !== t && x.startsWith(t)) { v.set(x, Math.max(v.get(x) || 0, 0.5)); if (++n > 80) break; }
        }
      }
      for (const s of this.syn.get(t) || []) {
        if (this.index.has(s)) v.set(s, Math.max(v.get(s) || 0, 0.7));
      }
      if (v.size === 0 && t.length >= 5) {
        for (const x of this.terms) if (Math.abs(x.length - t.length) <= 1 && within1(t, x)) v.set(x, 0.4);
      }
      return v;
    }

    search(q, opts) {
      opts = opts || {};
      const p = this.parse(q, opts.cats);
      if (!p.terms.length && !p.phrases.length) return { hits: [], parsed: p, partial: false };
      const allowed = opts.allow || null; // Set de índices permitidos
      const catSet = opts.catIds ? new Set(opts.catIds) : null;
      const per = p.terms.map((t) => this.variants(t));
      let scores = null;
      const partial = { on: false };
      const combine = (and) => {
        const acc = new Map();
        per.forEach((vars, ti) => {
          const local = new Map();
          for (const [term, w] of vars) {
            const post = this.index.get(term);
            if (!post) continue;
            for (const [d, sc] of post) local.set(d, (local.get(d) || 0) + sc * w);
          }
          if (ti === 0 || !and) {
            for (const [d, sc] of local) acc.set(d, (acc.get(d) || 0) + sc);
          } else {
            for (const d of [...acc.keys()]) {
              if (local.has(d)) acc.set(d, acc.get(d) + local.get(d)); else acc.delete(d);
            }
          }
        });
        return acc;
      };
      if (per.length) {
        scores = combine(true);
        if (scores.size === 0 && per.length > 1) { scores = combine(false); partial.on = true; }
      } else {
        scores = new Map(this.docs.map((_, i) => [i, 1]));
      }
      const negSet = new Set();
      for (const n of p.neg) { const post = this.index.get(n); if (post) for (const d of post.keys()) negSet.add(d); }
      const qn = (p.plain || []).join(' ');
      const hits = [];
      for (const [d, sc0] of scores) {
        const e = this.docs[d];
        if (negSet.has(d)) continue;
        if (allowed && !allowed.has(d)) continue;
        if (catSet && !catSet.has(e.cat)) continue;
        if (p.catFilter && e.cat !== p.catFilter) continue;
        if (p.phrases.length) {
          const hay = normChars(e.title + ' ' + e.body + ' ' + (e.mecanica || ''));
          if (!p.phrases.every((ph) => hay.includes(ph))) continue;
        }
        let sc = sc0 * (this.boost[e.cat] || 1) * (e.cat === 'accion' && e.f && e.f.talento ? 0.5 : 1);
        const tt = this.titleTokens[d];
        if (p.terms.length && p.terms.every((t) => tt.has(t))) sc *= 1.6;
        const tn = normChars(e.title);
        if (qn && tn === qn) sc *= 2.5;
        else if (qn && tn.startsWith(qn)) sc *= 1.5;
        hits.push({ e, d, score: sc });
      }
      hits.sort((a, b) => b.score - a.score);
      return { hits, parsed: p, partial: partial.on };
    }
  }

  // ---- utilidades de presentación -------------------------------------------------
  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function highlight(text, plainTerms) {
    const toks = [...new Set(plainTerms.filter((t) => t.length >= 2))];
    if (!toks.length) return esc(text);
    const n = normChars(text);
    const rx = new RegExp('(?:^|[^a-z0-9])(' + toks.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')[a-z0-9]*', 'g');
    let out = '', last = 0, m;
    while ((m = rx.exec(n))) {
      const start = m.index + m[0].indexOf(m[1]);
      const end = m.index + m[0].length;
      if (start < last) continue;
      out += esc(text.slice(last, start)) + '<mark>' + esc(text.slice(start, end)) + '</mark>';
      last = end;
    }
    return out + esc(text.slice(last));
  }

  function snippet(e, plainTerms, len) {
    len = len || 170;
    const body = (e.body + ' ' + (e.mecanica || '')).replace(/\s*\n+\s*/g, ' ').replace(/#{2,}\s*/g, '').replace(/\*\*/g, '');
    const n = normChars(body);
    let pos = -1;
    for (const t of plainTerms) {
      if (t.length < 2) continue;
      const i = n.search(new RegExp('(?:^|[^a-z0-9])' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
      if (i >= 0 && (pos < 0 || i < pos)) pos = i;
    }
    let start = pos > 60 ? pos - 60 : 0;
    if (start > 0) { const sp = body.indexOf(' ', start); if (sp > 0 && sp < start + 25) start = sp + 1; }
    let piece = body.slice(start, start + len);
    if (start + len < body.length) { const sp = piece.lastIndexOf(' '); if (sp > len * 0.6) piece = piece.slice(0, sp); }
    return (start > 0 ? '… ' : '') + highlightPlain(piece, plainTerms) + (start + piece.length < body.length ? ' …' : '');
  }
  const highlightPlain = highlight;

  window.Search = { Engine, normChars, tokenize, stem, esc, highlight, snippet };
})();
