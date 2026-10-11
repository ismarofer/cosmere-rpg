// Persistencia en IndexedDB + exportar/importar .zip (zip sin compresión).
(function (g) {
  let dbp = null;
  const STORES = ['escenas', 'imagenes', 'nieblas', 'pistas', 'audios'];
  function db() {
    if (dbp) return dbp;
    dbp = new Promise((res, rej) => {
      const r = indexedDB.open('proyector', 2);
      r.onupgradeneeded = () => STORES.forEach(s => { if (!r.result.objectStoreNames.contains(s)) r.result.createObjectStore(s); });
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    return dbp;
  }
  async function tx(store, modo, fn) {
    const d = await db();
    return new Promise((res, rej) => {
      const t = d.transaction(store, modo), s = t.objectStore(store);
      const r = fn(s);
      t.oncomplete = () => res(r && r.result);
      t.onerror = () => rej(t.error);
    });
  }
  const Alm = {
    poner: (s, k, v) => tx(s, 'readwrite', o => o.put(v, k)),
    leer: (s, k) => tx(s, 'readonly', o => o.get(k)),
    borrar: (s, k) => tx(s, 'readwrite', o => o.delete(k)),
    todos: s => tx(s, 'readonly', o => o.getAll()),
    persistir() { try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) {} },
  };

  // ---- zip (método 0, "store") ----
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(u) { let c = 0xFFFFFFFF; for (let i = 0; i < u.length; i++) c = CRC[(c ^ u[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  const Zip = {
    crear(files) {
      const enc = new TextEncoder(), parts = [], cen = [];
      let off = 0;
      for (const f of files) {
        const nm = enc.encode(f.name), crc = crc32(f.data), n = f.data.length;
        const h = new DataView(new ArrayBuffer(30));
        h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true);
        h.setUint32(14, crc, true); h.setUint32(18, n, true); h.setUint32(22, n, true); h.setUint16(26, nm.length, true);
        parts.push(h.buffer, nm, f.data);
        const c = new DataView(new ArrayBuffer(46));
        c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true);
        c.setUint32(16, crc, true); c.setUint32(20, n, true); c.setUint32(24, n, true); c.setUint16(28, nm.length, true);
        c.setUint32(42, off, true);
        cen.push(c.buffer, nm);
        off += 30 + nm.length + n;
      }
      const cs = cen.reduce((a, b) => a + b.byteLength, 0);
      const e = new DataView(new ArrayBuffer(22));
      e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true);
      e.setUint32(12, cs, true); e.setUint32(16, off, true);
      return new Blob([...parts, ...cen, e.buffer], { type: 'application/zip' });
    },
    leer(buf) {
      const v = new DataView(buf), u = new Uint8Array(buf), dec = new TextDecoder();
      let e = buf.byteLength - 22;
      while (e >= 0 && v.getUint32(e, true) !== 0x06054b50) e--;
      if (e < 0) throw new Error('No es un zip válido');
      const n = v.getUint16(e + 10, true); let p = v.getUint32(e + 16, true);
      const out = [];
      for (let i = 0; i < n; i++) {
        const method = v.getUint16(p + 10, true), size = v.getUint32(p + 20, true);
        const nl = v.getUint16(p + 28, true), xl = v.getUint16(p + 30, true), cl = v.getUint16(p + 32, true), lo = v.getUint32(p + 42, true);
        const name = dec.decode(u.subarray(p + 46, p + 46 + nl));
        if (method !== 0) throw new Error('Zip comprimido no soportado (usa uno exportado por esta app)');
        const ds = lo + 30 + v.getUint16(lo + 26, true) + v.getUint16(lo + 28, true);
        out.push({ name, data: u.subarray(ds, ds + size) });
        p += 46 + nl + xl + cl;
      }
      return out;
    },
  };
  g.Alm = Alm; g.Zip = Zip;
})(window);
