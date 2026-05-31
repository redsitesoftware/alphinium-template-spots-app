  const API = window.location.origin;
  let plans = null;
  let interval = 'monthly';
  let pendingPriceId = null;

  // ── Auth state ───────────────────────────────────────────────
  function getAuth() {
    try {
      const jwt = localStorage.getItem('strapi_jwt');
      const user = JSON.parse(localStorage.getItem('strapi_user') || 'null');
      return { jwt, user };
    } catch { return { jwt: null, user: null }; }
  }

  function setAuth(jwt, user) {
    localStorage.setItem('strapi_jwt', jwt);
    localStorage.setItem('strapi_user', JSON.stringify(user));
  }

  function clearAuth() {
    localStorage.removeItem('strapi_jwt');
    localStorage.removeItem('strapi_user');
  }

  function renderAuthArea() {
    const { jwt, user } = getAuth();
    const area = document.getElementById('auth-area');
    area.innerHTML = '';
    if (jwt && user) {
      const badge = document.createElement('span');
      badge.className = 'user-badge';
      badge.textContent = `👤 ${user.email}`;
      const btn = document.createElement('button');
      btn.className = 'btn-link'; btn.id = 'btn-signout';
      btn.textContent = 'Sign Out';
      btn.addEventListener('click', logout);
      area.appendChild(badge); area.appendChild(btn);
    } else {
      const btn = document.createElement('button');
      btn.className = 'btn-link'; btn.id = 'btn-signin-nav';
      btn.textContent = 'Sign In';
      btn.addEventListener('click', () => openModal(null));
      area.appendChild(btn);
    }
  }

  function logout() {
    clearAuth();
    renderAuthArea();
  }

  // ── Plans ────────────────────────────────────────────────────
  async function loadPlans() {
    try {
      const res = await fetch(`${API}/api/payment/plans`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      plans = await res.json();

      document.getElementById('product-name').textContent = plans.product || 'your product';
      document.getElementById('header-brand').textContent = plans.product || 'Pricing';
      document.title = `${plans.product || 'Pricing'} — Plans`;

      // Show toggle only if any paid tier has annual pricing
      const hasAnnual = Object.values(plans.tiers || {})
        .some(t => t.prices && t.prices.annual);
      if (hasAnnual) {
        document.getElementById('toggle-wrap').style.display = '';
        document.getElementById('save-badge').style.display = '';
      }

      renderCards();
    } catch (err) {
      const container = document.getElementById('cards-container');
      container.innerHTML = '<div class="error-state"><h2>Could not load plans</h2><p></p></div>';
      container.querySelector('p').textContent = err.message;
    }
  }

  function renderCards() {
    const tiers = Object.entries(plans.tiers || {});
    const currency = plans.currency || 'USD';
    const symbol = currency === 'USD' ? '$' : currency === 'AUD' ? 'A$' : currency;

    const html = tiers.map(([key, tier], idx) => {
      const isFree = !tier.prices && tier.amount === 0;
      const isFeatured = idx === 1 && !isFree;

      // Price display
      let priceHtml = '';
      let priceId = null;
      if (isFree) {
        priceHtml = `<div class="price"><sup>${symbol}</sup>0</div><div class="price-interval">Free forever</div>`;
      } else if (tier.prices) {
        const amount = tier.amounts?.[interval] ?? '?';
        const annualMonthly = tier.amounts?.annual ? Math.round(tier.amounts.annual / 12) : null;
        priceId = tier.prices[interval] || tier.prices.monthly || null;

        if (interval === 'annual' && annualMonthly) {
          priceHtml = `
            <div class="price"><sup>${symbol}</sup>${annualMonthly}</div>
            <div class="price-interval">per month, billed annually</div>
            <div class="price-annual-note">${symbol}${tier.amounts.annual}/yr — save ${symbol}${(tier.amounts.monthly * 12 - tier.amounts.annual)}</div>
          `;
        } else {
          priceHtml = `
            <div class="price"><sup>${symbol}</sup>${amount}</div>
            <div class="price-interval">per month</div>
          `;
        }
      }

      // Features
      const features = Object.entries(tier.features || {}).map(([feat, val]) => {
        const label = feat.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        const display = val === true ? '✓' : val === false ? '✗' : `<span class="val">${val}</span>`;
        return `<li><span class="check">✦</span>${label}: ${display}</li>`;
      }).join('');

      // CTA
      let ctaHtml = '';
      if (isFree) {
        ctaHtml = `<button class="cta-btn secondary" disabled>Current plan</button>`;
      } else if (!priceId) {
        ctaHtml = `<button class="cta-btn secondary" disabled>Not available</button>`;
      } else {
        ctaHtml = `<button class="cta-btn ${isFeatured ? 'primary' : 'secondary'}" data-price-id="${priceId}">
          Get ${tier.name}
        </button>`;
      }

      return `
        <div class="card${isFeatured ? ' featured' : ''}">
          ${isFeatured ? '<div class="badge">POPULAR</div>' : ''}
          <div class="tier-name">${tier.name}</div>
          <div class="price-wrap">${priceHtml}</div>
          <ul class="features">${features}</ul>
          ${ctaHtml}
        </div>
      `;
    }).join('');

    document.getElementById('cards-container').innerHTML = `<div class="cards">${html}</div>`;
    // Event delegation for subscribe buttons (avoids inline onclick CSP violation)
    document.getElementById('cards-container').querySelectorAll('[data-price-id]').forEach(btn => {
      btn.addEventListener('click', () => handleSubscribe(btn.dataset.priceId));
    });
  }

  // ── Interval toggle ──────────────────────────────────────────
  document.getElementById('interval-toggle').addEventListener('click', function() {
    interval = interval === 'monthly' ? 'annual' : 'monthly';
    this.classList.toggle('annual', interval === 'annual');
    document.getElementById('lbl-monthly').classList.toggle('active', interval === 'monthly');
    document.getElementById('lbl-annual').classList.toggle('active', interval === 'annual');
    if (plans) renderCards();
  });

  // ── Subscribe ────────────────────────────────────────────────
  async function handleSubscribe(priceId) {
    const { jwt, user } = getAuth();
    if (!jwt || !user) {
      pendingPriceId = priceId;
      openModal(priceId);
      return;
    }
    await checkout(priceId, user.id, jwt);
  }

  async function checkout(priceId, userId, jwt) {
    try {
      const res = await fetch(`${API}/api/payment/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwt}` },
        body: JSON.stringify({ priceId, userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Checkout failed');
      if (!data.url) throw new Error('No checkout URL returned');
      window.location.href = data.url;
    } catch (err) {
      alert(`Checkout error: ${err.message}`);
    }
  }

  // ── Auth modal ───────────────────────────────────────────────
  function openModal(priceId) {
    if (priceId) pendingPriceId = priceId;
    clearFormError();
    document.getElementById('modal').classList.add('open');
  }

  function closeModal() {
    document.getElementById('modal').classList.remove('open');
  }

  function switchTab(tab) {
    document.getElementById('form-login').style.display = tab === 'login' ? '' : 'none';
    document.getElementById('form-register').style.display = tab === 'register' ? '' : 'none';
    document.getElementById('tab-login').classList.toggle('active', tab === 'login');
    document.getElementById('tab-register').classList.toggle('active', tab === 'register');
    clearFormError();
  }

  function showFormError(msg) {
    const el = document.getElementById('form-error');
    el.textContent = msg;
    el.classList.add('show');
  }

  function clearFormError() {
    document.getElementById('form-error').classList.remove('show');
  }

  async function doLogin() {
    const btn = document.getElementById('btn-login');
    const identifier = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    if (!identifier || !password) { showFormError('Please fill in all fields.'); return; }
    btn.disabled = true; btn.textContent = 'Signing in…';
    clearFormError();
    try {
      const res = await fetch(`${API}/api/auth/local`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Login failed');
      setAuth(data.jwt, data.user);
      closeModal();
      renderAuthArea();
      if (pendingPriceId) { const p = pendingPriceId; pendingPriceId = null; await checkout(p, data.user.id, data.jwt); }
    } catch (err) {
      showFormError(err.message);
    } finally {
      btn.disabled = false; btn.textContent = 'Sign In';
    }
  }

  async function doRegister() {
    const btn = document.getElementById('btn-register');
    const username = document.getElementById('reg-username').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    if (!username || !email || !password) { showFormError('Please fill in all fields.'); return; }
    if (password.length < 6) { showFormError('Password must be at least 6 characters.'); return; }
    btn.disabled = true; btn.textContent = 'Creating account…';
    clearFormError();
    try {
      const res = await fetch(`${API}/api/auth/local/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Registration failed');
      setAuth(data.jwt, data.user);
      closeModal();
      renderAuthArea();
      if (pendingPriceId) { const p = pendingPriceId; pendingPriceId = null; await checkout(p, data.user.id, data.jwt); }
    } catch (err) {
      showFormError(err.message);
    } finally {
      btn.disabled = false; btn.textContent = 'Create Account';
    }
  }

  // ── Keyboard / overlay close ─────────────────────────────────
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal').addEventListener('click', function(e) {
    if (e.target === this) closeModal();
  });
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeModal();
  });

  // ── Modal tab + form buttons (replace inline onclick) ────────
  document.getElementById('tab-login').addEventListener('click', () => switchTab('login'));
  document.getElementById('tab-register').addEventListener('click', () => switchTab('register'));
  document.getElementById('btn-login').addEventListener('click', doLogin);
  document.getElementById('btn-register').addEventListener('click', doRegister);

  // ── Init ─────────────────────────────────────────────────────
  renderAuthArea();
  loadPlans();
