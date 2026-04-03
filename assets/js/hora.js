// Hora Muhurta frontend (no keys exposed). Uses WP AJAX and server-side timezone.

let jyotishamHoraCurrent = {};

document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('jyotisham-hora-form');
  if (form) {
    // Set defaults
    const dateInput = document.getElementById('jyotisham-date');
    if (dateInput) {
      const today = new Date();
      dateInput.value = today.toISOString().split('T')[0];
    }
    const timeInput = document.getElementById('jyotisham-time');
    if (timeInput) {
      const now = new Date();
      timeInput.value = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    }

    setupPlaceAutocomplete();
    form.addEventListener('submit', handleHoraSubmit);
  }
  // Initial overflow fix for mobile
  setTimeout(() => { fixHoraMobileOverflow(); }, 500);
});

// Re-apply overflow fixes on resize
window.addEventListener('resize', function() {
  setTimeout(() => { fixHoraMobileOverflow(); }, 100);
});

function setupPlaceAutocomplete() {
  // Reuse server-side timezone like other modules
  const placeInput = document.getElementById('jyotisham-place');
  if (!placeInput) return;

  let debounceTimer; let autocomplete = null; let lastSearchTerm = ''; let searchCount = 0; const maxSearchesPerSession = 10;
  let googleMapsLoaded = !!(window.google && google.maps && google.maps.places);
  let googleMapsRetryCount = 0;

  // Wait for Google Maps to be available (aligns with Choghadiya)
  function waitForGoogleMaps(callback) {
    if (googleMapsLoaded) { callback(); return; }
    const maxRetries = 20; // 20 * 250ms = ~5s
    const interval = setInterval(() => {
      if (window.google && google.maps && google.maps.places) {
        clearInterval(interval);
        googleMapsLoaded = true;
        callback();
      } else if (googleMapsRetryCount++ >= maxRetries) {
        clearInterval(interval);
      }
    }, 250);
    setTimeout(() => { clearInterval(interval); }, 6000);
  }

  function debounced() {
    const v = placeInput.value.trim();
    clearTimeout(debounceTimer);
    if (v.length < 1) { clearAutocomplete(); lastSearchTerm=''; searchCount = 0; hideHoraSearchLoading(); return; }
    
    // Show loading indicator
    showHoraSearchLoading();
    
    // Keep delay tiny for instant feel
    const delay = 50;
    debounceTimer = setTimeout(() => {
      const finalV = placeInput.value.trim();
      if (finalV.length >= 1) {
        if (!autocomplete) { initAutocomplete(); }
        hideHoraSearchLoading();
      } else {
        hideHoraSearchLoading();
      }
    }, delay);
  }

  function clearAutocomplete() {
    if (autocomplete && window.google && google.maps) {
      google.maps.event.clearInstanceListeners(placeInput);
    }
    autocomplete = null;
    // Also remove any visible Google Places dropdown (same as Panchang)
    const existingDropdown = document.querySelector('.pac-container');
    if (existingDropdown) {
      existingDropdown.remove();
    }
  }

  function initAutocomplete() {
    if (!window.google || !google.maps || !google.maps.places) {
      return waitForGoogleMaps(() => initAutocomplete());
    }
    if (autocomplete) clearAutocomplete();
    autocomplete = new google.maps.places.Autocomplete(placeInput, { types: ['(cities)'], fields: ['place_id','geometry','name','formatted_address'] });

    // Directly use Places Autocomplete default behavior for instant suggestions

    autocomplete.addListener('place_changed', function() {
      const place = autocomplete.getPlace();
      if (place && place.geometry) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        document.getElementById('jyotisham-latitude').value = lat;
        document.getElementById('jyotisham-longitude').value = lng;
        getTimezoneServer(lat, lng);
        hideHoraSearchLoading();
      }
    });

    // If user already typed, trigger predictions immediately
    if (placeInput.value && placeInput.value.trim().length >= 1) {
      try { placeInput.dispatchEvent(new Event('input', { bubbles: true })); } catch (e) {}
    }
  }

  // Mirror Choghadiya: if exceeded search limit, disable input gracefully
  function handleSearchLimitIfNeeded() {
    if (searchCount > maxSearchesPerSession) {
      placeInput.placeholder = '⚠️ Search limit reached. Please refresh to search again.';
      placeInput.disabled = true;
      hideHoraSearchLoading();
      return true;
    }
    return false;
  }

  placeInput.addEventListener('input', debounced);
  
  // Initialize immediately on focus for instant suggestions
  placeInput.addEventListener('focus', () => {
    if (!autocomplete) { initAutocomplete(); }
    if (placeInput.value && placeInput.value.trim().length >= 1) { debounced(); }
  });
  
  // Remove dropdown when input is cleared manually
  placeInput.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace' && placeInput.value.length <= 1) {
      clearAutocomplete();
      lastSearchTerm = '';
      hideHoraSearchLoading();
    }
    // Prevent searches beyond limit
    if (e.key === 'Enter' && searchCount > maxSearchesPerSession) {
      e.preventDefault();
      handleSearchLimitIfNeeded();
    }
  });
}

// Show loading indicator for Hora search
function showHoraSearchLoading() {
  const placeInput = document.getElementById('jyotisham-place');
  if (!placeInput) return;
  
  // Add loading class to input
  placeInput.classList.add("jyotisham-hora-search-loading");
  
  // Add loading indicator if not exists
  let loadingIndicator = document.querySelector(".jyotisham-hora-search-loading-indicator");
  if (!loadingIndicator) {
    loadingIndicator = document.createElement("div");
    loadingIndicator.className = "jyotisham-hora-search-loading-indicator";
    loadingIndicator.innerHTML = "🔍 Searching...";
    loadingIndicator.style.cssText = `
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 12px;
      color: #666;
      pointer-events: none;
      z-index: 1000;
    `;
    
    const inputContainer = placeInput.parentElement;
    if (inputContainer) {
      inputContainer.style.position = "relative";
      inputContainer.appendChild(loadingIndicator);
    }
  }
  
  loadingIndicator.style.display = "block";
}

// Hide loading indicator for Hora search
function hideHoraSearchLoading() {
  const placeInput = document.getElementById('jyotisham-place');
  if (!placeInput) return;
  
  // Remove loading class from input
  placeInput.classList.remove("jyotisham-hora-search-loading");
  
  // Hide loading indicator
  const loadingIndicator = document.querySelector(".jyotisham-hora-search-loading-indicator");
  if (loadingIndicator) {
    loadingIndicator.style.display = "none";
  }
}

function getTimezoneServer(lat, lng) {
  const payload = new URLSearchParams();
  payload.append('action', 'jyotisham_get_timezone');
  payload.append('nonce', jyotishamHora.nonce);
  payload.append('latitude', lat);
  payload.append('longitude', lng);

  fetch(jyotishamHora.ajaxUrl, {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: payload.toString()
  }).then(r => r.json()).then(j => {
    const tz = j && j.success && j.data && (j.data.timezone !== undefined) ? j.data.timezone : 5.5;
    const tzInput = document.getElementById('jyotisham-timezone');
    if (tzInput) tzInput.value = tz;
  }).catch(() => {
    const tzInput = document.getElementById('jyotisham-timezone');
    if (tzInput) tzInput.value = 5.5;
  });
}

async function handleHoraSubmit(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData);

  if (!data.latitude || !data.longitude) { alert('Please select a valid place from the dropdown'); return; }
  if (!data.timezone) {
    await new Promise(resolve => setTimeout(resolve, 500));
    data.timezone = document.getElementById('jyotisham-timezone').value || 5.5;
  }

  jyotishamHoraCurrent = data;
  showHoraLoading();
  try {
    const result = await fetchHoraViaAjax();
    hideHoraLoading();
    showHoraResults();
    renderHora(result);
    setTimeout(() => { enhanceHoraTableScrolling(); fixHoraMobileOverflow(); }, 100);
  } catch (err) {
    hideHoraLoading();
    showHoraError(err.message || 'Failed to fetch Hora data');
  }
}

function showHoraLoading() {
  const l = document.getElementById('jyotisham-hora-loading'); const r = document.getElementById('jyotisham-hora-results');
  if (l) l.classList.remove('jyotisham-hora-hidden'); if (r) r.classList.add('jyotisham-hora-hidden');
}
function hideHoraLoading() { const l = document.getElementById('jyotisham-hora-loading'); if (l) l.classList.add('jyotisham-hora-hidden'); }
function showHoraResults() { const r = document.getElementById('jyotisham-hora-results'); if (r) r.classList.remove('jyotisham-hora-hidden'); }
function showHoraError(msg) {
  const r = document.getElementById('jyotisham-hora-results'); if (!r) return;
  r.innerHTML = `<div class="jyotisham-hora-card jyotisham-hora-error"><div class="jyotisham-hora-error-content"><div class="jyotisham-hora-error-icon">❌</div><div class="jyotisham-hora-error-message"><h3>Error</h3><p>${msg}</p><button onclick="location.reload()" class="jyotisham-hora-retry-btn">Try Again</button></div></div></div>`;
}

async function fetchHoraViaAjax() {
  const p = new URLSearchParams();
  p.append('action', 'jyotisham_get_hora');
  p.append('nonce', jyotishamHora.nonce);
  p.append('date', jyotishamHoraCurrent.date);
  p.append('time', jyotishamHoraCurrent.time);
  p.append('latitude', jyotishamHoraCurrent.latitude);
  p.append('longitude', jyotishamHoraCurrent.longitude);
  p.append('timezone', jyotishamHoraCurrent.timezone);
  p.append('language', jyotishamHoraCurrent.language);

  const resp = await fetch(jyotishamHora.ajaxUrl, { method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'}, body:p.toString() });
  const json = await resp.json();
  if (!json.success) throw new Error(json.data || 'Request failed');
  return json.data;
}

function renderHora(data) {
  const container = document.getElementById('jyotisham-horaData'); if (!container) return;
  if (data.status !== 200) { container.innerHTML = '<div class="jyotisham-hora-card"><p>Error loading Hora data</p></div>'; return; }
  const r = data.response;

  container.innerHTML = `
    <div class="jyotisham-hora-content">
      <div class="jyotisham-hora-card">
        <h3>List of Hora Muhurtas for ${r.day_of_week}</h3>
        <p><strong>${r.day_of_week}, ${jyotishamHoraCurrent.date}</strong></p>
      </div>
      <div class="jyotisham-hora-card">
        <h3>Hora Muhurta Timings</h3>
        <p class="jyotisham-hora-section-description">Planetary hours and their benefits for the selected date</p>
        <div class="jyotisham-hora-table-container">
          <table class="jyotisham-hora-data-table">
            <thead>
              <tr><th>Start Time</th><th>End Time</th><th>Hora (Planet)</th><th>Benefits</th><th>Lucky Gem</th></tr>
            </thead>
            <tbody>
              ${r.horas.map(h => `<tr><td>${h.start}</td><td>${h.end}</td><td><strong>${h.hora}</strong></td><td style="white-space:normal;min-width:250px;">${h.benefits}</td><td>${h.lucky_gem}</td></tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

// Ensure tables are horizontally scrollable on mobile
function enhanceHoraTableScrolling() {
  const containers = document.querySelectorAll('.jyotisham-hora-table-container');
  containers.forEach((c) => {
    c.style.overflowX = 'auto';
    c.style.webkitOverflowScrolling = 'touch';
  });
}

// Prevent parent containers from clipping horizontal scroll
function fixHoraMobileOverflow() {
  const nodes = document.querySelectorAll(
    '.jyotisham-hora-container, .jyotisham-hora-results, .jyotisham-hora-content, .jyotisham-hora-card'
  );
  nodes.forEach((el) => {
    el.style.maxWidth = '100%';
    el.style.overflowX = 'hidden';
    el.style.boxSizing = 'border-box';
  });
}


