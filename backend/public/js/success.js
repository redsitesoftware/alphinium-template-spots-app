    const API = window.location.origin;

    async function verify() {
      const params = new URLSearchParams(window.location.search);
      const sessionId = params.get('session_id');

      if (!sessionId) {
        showError('No session ID found. Please contact support if you were charged.');
        return;
      }

      try {
        const res = await fetch(`${API}/api/payment/verify-payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });
        const data = await res.json();

        if (!res.ok || !data.success) {
          showError(data.error || 'Payment could not be verified. Please contact support.');
          return;
        }

        showSuccess(data);
      } catch (err) {
        showError('Network error verifying payment. Please contact support.');
      }
    }

    function showSuccess(data) {
      const card = document.getElementById('card');
      card.innerHTML = `
        <div class="icon">✅</div>
        <h1>You're subscribed!</h1>
        <p>Welcome aboard. Your subscription is now active.</p>
        <div class="detail" id="sub-detail"></div>
        <a class="btn" href="/pricing.html">Back to Pricing</a>
      `;
      const detail = card.querySelector('#sub-detail');
      if (data.subscriptionId) {
        const row = document.createElement('div');
        row.className = 'detail-row';
        const label = document.createElement('span'); label.textContent = 'Subscription ID';
        const val = document.createElement('span'); val.textContent = data.subscriptionId.slice(0, 20) + '…';
        row.appendChild(label); row.appendChild(val); detail.appendChild(row);
      }
      if (data.subscriptionStatus) {
        const row = document.createElement('div');
        row.className = 'detail-row';
        row.style.cssText = 'color:#16a34a;text-transform:capitalize';
        const label = document.createElement('span'); label.textContent = 'Status';
        const val = document.createElement('span'); val.textContent = data.subscriptionStatus;
        row.appendChild(label); row.appendChild(val); detail.appendChild(row);
      }
    }

    function showError(msg) {
      const card = document.getElementById('card');
      card.innerHTML = `
        <div class="icon">⚠️</div>
        <h1>Verification Issue</h1>
        <div class="error" id="err-msg"></div>
        <a class="btn" href="/pricing.html">Back to Pricing</a>
      `;
      card.querySelector('#err-msg').textContent = msg;
    }

    verify();
