// Numerology frontend - uses WordPress AJAX, no API keys exposed

let jyotishamNumerologyCurrent = {};

document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('jyotisham-numerology-form');
  if (form) {
    // Default date to today
    const dateInput = document.getElementById('jyotisham-date');
    if (dateInput) {
      const today = new Date();
      dateInput.value = today.toISOString().split('T')[0];
    }

    form.addEventListener('submit', handleNumerologySubmit);
  }
});

async function handleNumerologySubmit(e) {
  e.preventDefault();

  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData);

  if (!data.name || !data.date) {
    alert('Please fill in all required fields');
    return;
  }

  jyotishamNumerologyCurrent = data;
  showNumerologyLoading();

  try {
    const result = await fetchNumerologyViaAjax();
    hideNumerologyLoading();
    showNumerologyResults();
    renderNumerology(result);
  } catch (err) {
    hideNumerologyLoading();
    showNumerologyError(err.message || 'Failed to fetch numerology data');
  }
}

function showNumerologyLoading() {
  const loading = document.getElementById('jyotisham-numerology-loading');
  const results = document.getElementById('jyotisham-numerology-results');
  if (loading) loading.classList.remove('jyotisham-numerology-hidden');
  if (results) results.classList.add('jyotisham-numerology-hidden');
}

function hideNumerologyLoading() {
  const loading = document.getElementById('jyotisham-numerology-loading');
  if (loading) loading.classList.add('jyotisham-numerology-hidden');
}

function showNumerologyResults() {
  const results = document.getElementById('jyotisham-numerology-results');
  if (results) results.classList.remove('jyotisham-numerology-hidden');
}

function showNumerologyError(message) {
  const results = document.getElementById('jyotisham-numerology-results');
  if (!results) return;
  results.innerHTML = `
    <div class="jyotisham-numerology-card jyotisham-numerology-error">
      <div class="jyotisham-numerology-error-content">
        <div class="jyotisham-numerology-error-icon">❌</div>
        <div class="jyotisham-numerology-error-message">
          <h3>Error</h3>
          <p>${message}</p>
          <div class="jyotisham-numerology-error-actions">
            <button onclick="location.reload()" class="jyotisham-numerology-retry-btn">Try Again</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function fetchNumerologyViaAjax() {
  const payload = new URLSearchParams();
  payload.append('action', 'jyotisham_get_numerology');
  payload.append('nonce', jyotishamNumerology.nonce);
  payload.append('date', jyotishamNumerologyCurrent.date);
  payload.append('name', jyotishamNumerologyCurrent.name);
  payload.append('language', jyotishamNumerologyCurrent.language);

  const resp = await fetch(jyotishamNumerology.ajaxUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: payload.toString()
  });

  const json = await resp.json();
  if (!json.success) {
    throw new Error(json.data || 'Request failed');
  }
  return json.data;
}

function renderNumerology(data) {
  const container = document.getElementById('jyotisham-numerologyData');
  if (!container) return;

  if (data.status !== 200) {
    container.innerHTML = '<div class="jyotisham-numerology-card"><p>Error loading numerology data</p></div>';
    return;
  }

  const r = data.response;
  container.innerHTML = `
    <div class="jyotisham-numerology-content">
      <div class="jyotisham-numerology-card jyotisham-numerology-full-width">
        <h3>Numerology Report for ${escapeHtml(jyotishamNumerologyCurrent.name)}</h3>
        <p><strong>Date of Birth: ${escapeHtml(jyotishamNumerologyCurrent.date)}</strong></p>
      </div>
      <div class="jyotisham-numerology-two-columns">
        <div class="jyotisham-numerology-column">
          ${renderSection(r.destiny)}
          ${renderSection(r.personality)}
          ${renderSection(r.attitude)}
          ${renderSection(r.character)}
        </div>
        <div class="jyotisham-numerology-column">
          ${renderSection(r.soul)}
          ${renderSection(r.agenda)}
          ${renderSection(r.purpose)}
        </div>
      </div>
    </div>
  `;
}

function renderSection(section) {
  if (!section) return '';
  return `
    <div class="jyotisham-numerology-card">
      <h3>${escapeHtml(section.title || '')}</h3>
      <p class="jyotisham-numerology-section-description">${escapeHtml(section.description || '')}</p>
      <div class="jyotisham-numerology-number-display">
        <div class="jyotisham-numerology-number">${escapeHtml(String(section.number || ''))}</div>
        <div class="jyotisham-numerology-master">${section.master ? 'Master Number' : 'Regular Number'}</div>
      </div>
      <p class="jyotisham-numerology-meaning">${escapeHtml(section.meaning || '')}</p>
    </div>
  `;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}


