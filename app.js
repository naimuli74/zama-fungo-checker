(() => {
  const C = window.CFG;
  const $ = (s) => document.querySelector(s);
  const fmt = (n) => Number(n).toLocaleString('en-US');
  const short = (a) => a.slice(0, 6) + '…' + a.slice(-4);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // ---------- RPC with fallback ----------
  let rpcIdx = 0;
  async function rpc(method, params) {
    let lastErr;
    for (let i = 0; i < C.rpcs.length; i++) {
      const url = C.rpcs[(rpcIdx + i) % C.rpcs.length];
      try {
        const ctl = new AbortController();
        const t = setTimeout(() => ctl.abort(), 9000);
        const res = await fetch(url, {
          method: 'POST', signal: ctl.signal,
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params })
        });
        clearTimeout(t);
        const j = await res.json();
        if (j.error) throw new Error(j.error.message || 'rpc error');
        if (j.result === undefined) throw new Error('empty result');
        rpcIdx = (rpcIdx + i) % C.rpcs.length; // stick with the one that works
        return j.result;
      } catch (e) { lastErr = e; }
    }
    throw new Error('All Ethereum RPCs failed (' + (lastErr && lastErr.message) + '). Try again in a minute.');
  }
  const ethCall = (to, data) => rpc('eth_call', [{ to, data }, 'latest']);
  const pad = (hex) => hex.replace(/^0x/, '').toLowerCase().padStart(64, '0');

  // ---------- ENS ----------
  const toHex = (b) => Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  function namehash(name) {
    let node = new Uint8Array(32);
    if (!name) return '0x' + toHex(node);
    const labels = name.split('.');
    for (let i = labels.length - 1; i >= 0; i--) {
      const lh = keccak256(new TextEncoder().encode(labels[i]));
      const buf = new Uint8Array(64); buf.set(node); buf.set(lh, 32);
      node = keccak256(buf);
    }
    return '0x' + toHex(node);
  }
  const ENS_REGISTRY = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e';
  async function resolveENS(name) {
    const node = namehash(name.toLowerCase().trim());
    const res = await ethCall(ENS_REGISTRY, '0x0178b8bf' + pad(node)); // resolver(bytes32)
    const resolver = '0x' + res.slice(-40);
    if (/^0x0{40}$/.test(resolver)) throw new Error('ENS name “' + name + '” has no resolver.');
    const a = await ethCall(resolver, '0x3b3b57de' + pad(node)); // addr(bytes32)
    const addr = '0x' + a.slice(-40);
    if (/^0x0{40}$/.test(addr)) throw new Error('ENS name “' + name + '” does not point to an address.');
    return addr;
  }

  // ---------- core ----------
  async function balanceOf(addr) {
    const r = await ethCall(C.contract, '0x70a08231' + pad(addr)); // balanceOf(address)
    return Number(BigInt(r));
  }

  const out = $('#result');
  const btn = $('#go');
  const input = $('#addr');

  function show(html) { out.hidden = false; out.innerHTML = html; }

  function renderHolder(addr, label, n) {
    const tokens = n * C.perNft;
    const share = (n / C.nftsCounted) * 100;
    show(`
      <div class="r-head">
        <span class="r-addr">${esc(label ? label + ' · ' : '')}${esc(addr)}</span>
        <span class="badge ok">✓ Zama OG holder</span>
      </div>
      <div class="r-grid">
        <div class="big"><div class="k">Zama OG NFTs held</div><div class="v">${fmt(n)}</div>
          <div class="calc">${share.toFixed(share < 0.1 ? 3 : 2)}% of ${fmt(C.nftsCounted)} NFTs</div></div>
        <div class="big dark"><div class="k">$FUNGO at TGE (if still held at snapshot)</div>
          <div class="v">${fmt(tokens)} <small>$FUNGO</small></div>
          <div class="calc">${fmt(n)} × ${fmt(C.perNft)} $FUNGO per NFT</div></div>
      </div>
      <div class="est" id="est" data-tokens="${tokens}">
        <div class="est-top"><span class="k">Estimated value</span><span class="est-v" id="estV"></span></div>
        <div class="chips" id="chips">${C.fdvScenarios.map(f => `<button type="button" class="chip${f === C.fdvDefault ? ' on' : ''}" data-fdv="${f}">${usdShort(f)} FDV</button>`).join('')}</div>
        <div class="calc" id="estCalc"></div>
        <p class="est-warn">⚠️ $FUNGO has no market price yet. This is a guess based on an assumed launch valuation (FDV), not a promise. Pick a scenario.</p>
      </div>
      <p class="note">Based on FungoLabs' published rule: every Zama OG NFT receives the same ${fmt(C.perNft)} $FUNGO. The final amount goes to whoever holds each NFT at the <b>TGE block</b> (announced in advance). Keep your NFT in this wallet until then, and claim within ${C.claimDays} days or it's burned.</p>
      <div class="actions">
        <a class="btn primary" href="${C.links.tokenomics}" target="_blank" rel="noopener">FungoLabs tokenomics ↗</a>
        <a class="btn" href="https://etherscan.io/token/${C.contract}?a=${addr}" target="_blank" rel="noopener">See on Etherscan ↗</a>
        <button class="btn" id="share" type="button">Copy share link</button>
      </div>`);
    hookShare(addr);
    hookEst();
  }

  function renderEmpty(addr, label) {
    show(`
      <div class="r-head">
        <span class="r-addr">${esc(label ? label + ' · ' : '')}${esc(addr)}</span>
        <span class="badge no">0 Zama OG NFTs</span>
      </div>
      <div class="empty">
        <img src="assets/zama-og.png" alt="">
        <div>
          <h3>No Zama OG NFT in this wallet</h3>
          <p>This wallet gets <b>0 $FUNGO</b> from the Zama OG airdrop right now. To qualify, buy a Zama OG NFT first and hold it at the TGE block. Each one carries <b>${fmt(C.perNft)} $FUNGO</b> (≈ ${usd(C.perNft * C.fdvDefault / C.totalSupply)} if $FUNGO launches at a ${usdShort(C.fdvDefault)} valuation, which is only a guess).</p>
        </div>
      </div>
      <div class="actions">
        <a class="btn primary" href="${C.links.opensea}" target="_blank" rel="noopener">Buy Zama OG on OpenSea ↗</a>
        <a class="btn" href="${C.links.etherscan}" target="_blank" rel="noopener">Verify contract on Etherscan ↗</a>
      </div>
      <p class="note">⚠️ Check that the collection contract is <code>${C.contract}</code> before you buy. Fake “Zama OG” collections exist. Prices move; this is not financial advice.</p>`);
  }


  function usdShort(v) { return v >= 1e9 ? '$' + v / 1e9 + 'B' : v >= 1e6 ? '$' + v / 1e6 + 'M' : '$' + fmt(v); }
  function usd(v) { return '$' + v.toLocaleString('en-US', { minimumFractionDigits: v < 100 ? 2 : 0, maximumFractionDigits: v < 100 ? 2 : 0 }); }
  function hookEst() {
    const box = document.getElementById('est'); if (!box) return;
    const tokens = Number(box.dataset.tokens);
    const set = fdv => {
      const price = fdv / C.totalSupply;
      document.getElementById('estV').textContent = '≈ ' + usd(tokens * price);
      document.getElementById('estCalc').textContent = fmt(tokens) + ' × $' + price.toPrecision(2) + ' per $FUNGO (at ' + usdShort(fdv) + ' FDV)';
      box.querySelectorAll('.chip').forEach(c => c.classList.toggle('on', Number(c.dataset.fdv) === fdv));
    };
    box.querySelectorAll('.chip').forEach(c => c.onclick = () => set(Number(c.dataset.fdv)));
    set(C.fdvDefault);
  }

  function hookShare(addr) {
    const b = document.getElementById('share');
    if (!b) return;
    b.onclick = async () => {
      const url = location.origin + location.pathname + '?address=' + encodeURIComponent(addr);
      try { await navigator.clipboard.writeText(url); b.textContent = 'Link copied ✓'; }
      catch { prompt('Copy this link:', url); }
    };
  }

  async function check(raw) {
    const q = raw.trim();
    if (!q) return;
    let addr, label = '';
    btn.disabled = true; btn.innerHTML = '<span class="spinner"></span>';
    show('<p><span class="spinner" style="border-color:#111;border-right-color:transparent"></span>&nbsp; Reading the Zama OG contract on Ethereum…</p>');
    try {
      if (/^0x[0-9a-fA-F]{40}$/.test(q)) addr = q.toLowerCase();
      else if (/^[^\s]+\.[a-z]{2,}$/i.test(q)) { label = q.toLowerCase(); addr = await resolveENS(q); }
      else throw new Error('That doesn’t look like a wallet. Paste a 0x… address (42 characters) or an ENS name like name.eth.');
      const n = await balanceOf(addr);
      n > 0 ? renderHolder(addr, label, n) : renderEmpty(addr, label);
      const u = new URL(location.href); u.searchParams.set('address', label || addr); history.replaceState(null, '', u);
    } catch (e) {
      show(`<p class="err">${esc(e.message || e)}</p>`);
    } finally {
      btn.disabled = false; btn.innerHTML = '<span>Check</span>';
    }
  }

  $('#form').addEventListener('submit', (e) => { e.preventDefault(); check(input.value); });

  const pre = new URLSearchParams(location.search).get('address');
  if (pre) { input.value = pre; check(pre); }
})();
