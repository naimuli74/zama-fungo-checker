/* Minimal Keccak-256 (Ethereum) — used only for ENS namehash. Public-domain style implementation. */
(function (g) {
  const RC = [
    [0x00000001, 0x00000000], [0x00008082, 0x00000000], [0x0000808a, 0x80000000], [0x80008000, 0x80000000],
    [0x0000808b, 0x00000000], [0x80000001, 0x00000000], [0x80008081, 0x80000000], [0x00008009, 0x80000000],
    [0x0000008a, 0x00000000], [0x00000088, 0x00000000], [0x80008009, 0x00000000], [0x8000000a, 0x00000000],
    [0x8000808b, 0x00000000], [0x0000008b, 0x80000000], [0x00008089, 0x80000000], [0x00008003, 0x80000000],
    [0x00008002, 0x80000000], [0x00000080, 0x80000000], [0x0000800a, 0x00000000], [0x8000000a, 0x80000000],
    [0x80008081, 0x80000000], [0x00008080, 0x80000000], [0x80000001, 0x00000000], [0x80008008, 0x80000000]
  ];
  const ROT = [0, 1, 62, 28, 27, 36, 44, 6, 55, 20, 3, 10, 43, 25, 39, 41, 45, 15, 21, 8, 18, 2, 61, 56, 14];
  function rotl(lo, hi, n) {
    if (n === 0) return [lo, hi];
    if (n >= 32) { const t = lo; lo = hi; hi = t; n -= 32; }
    if (n === 0) return [lo, hi];
    return [((lo << n) | (hi >>> (32 - n))) >>> 0, ((hi << n) | (lo >>> (32 - n))) >>> 0];
  }
  function f(sL, sH) {
    const cL = new Array(5), cH = new Array(5), bL = new Array(25), bH = new Array(25);
    for (let r = 0; r < 24; r++) {
      for (let x = 0; x < 5; x++) {
        cL[x] = sL[x] ^ sL[x + 5] ^ sL[x + 10] ^ sL[x + 15] ^ sL[x + 20];
        cH[x] = sH[x] ^ sH[x + 5] ^ sH[x + 10] ^ sH[x + 15] ^ sH[x + 20];
      }
      for (let x = 0; x < 5; x++) {
        const [rl, rh] = rotl(cL[(x + 1) % 5], cH[(x + 1) % 5], 1);
        const dL = cL[(x + 4) % 5] ^ rl, dH = cH[(x + 4) % 5] ^ rh;
        for (let y = 0; y < 25; y += 5) { sL[y + x] ^= dL; sH[y + x] ^= dH; }
      }
      for (let x = 0; x < 5; x++) for (let y = 0; y < 5; y++) {
        const i = x + 5 * y, j = y + 5 * ((2 * x + 3 * y) % 5);
        const [rl, rh] = rotl(sL[i] >>> 0, sH[i] >>> 0, ROT[i]);
        bL[j] = rl; bH[j] = rh;
      }
      for (let y = 0; y < 25; y += 5) for (let x = 0; x < 5; x++) {
        sL[y + x] = (bL[y + x] ^ (~bL[y + (x + 1) % 5] & bL[y + (x + 2) % 5])) >>> 0;
        sH[y + x] = (bH[y + x] ^ (~bH[y + (x + 1) % 5] & bH[y + (x + 2) % 5])) >>> 0;
      }
      sL[0] = (sL[0] ^ RC[r][0]) >>> 0; sH[0] = (sH[0] ^ RC[r][1]) >>> 0;
    }
  }
  function keccak256(bytes) {
    const rate = 136, sL = new Array(25).fill(0), sH = new Array(25).fill(0);
    const padLen = rate - (bytes.length % rate);
    const msg = new Uint8Array(bytes.length + padLen);
    msg.set(bytes); msg[bytes.length] ^= 0x01; msg[msg.length - 1] ^= 0x80;
    for (let off = 0; off < msg.length; off += rate) {
      for (let i = 0; i < rate / 8; i++) {
        const p = off + i * 8;
        sL[i] ^= (msg[p] | (msg[p + 1] << 8) | (msg[p + 2] << 16) | (msg[p + 3] << 24)) >>> 0;
        sH[i] ^= (msg[p + 4] | (msg[p + 5] << 8) | (msg[p + 6] << 16) | (msg[p + 7] << 24)) >>> 0;
      }
      f(sL, sH);
    }
    const out = new Uint8Array(32);
    for (let i = 0; i < 4; i++) {
      for (let k = 0; k < 4; k++) { out[i * 8 + k] = (sL[i] >>> (8 * k)) & 0xff; out[i * 8 + 4 + k] = (sH[i] >>> (8 * k)) & 0xff; }
    }
    return out;
  }
  g.keccak256 = keccak256;
})(typeof window !== 'undefined' ? window : globalThis);
