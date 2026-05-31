// Landing page — check API health and update status indicator
(async () => {
  const el = document.getElementById('api-status');
  try {
    const r = await fetch('/api/payment/plans');
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const d = await r.json();
    const tiers = Object.keys(d.tiers || {}).length;
    el.textContent = `API live · ${tiers} plans available · Stripe test mode`;
  } catch (e) {
    el.textContent = `API check failed: ${e.message}`;
    el.style.color = '#ef4444';
    document.querySelector('.dot').style.background = '#ef4444';
    document.querySelector('.dot').style.animation = 'none';
  }
})();
