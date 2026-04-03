// Panchang Generator JavaScript
// Secure server-side API handling to protect API keys

// Global variables for panchang
let panchangCurrentData = {};
let panchangCachedData = {};
let panchangSearchLoadingTimer = null;

// Function to wrap table in responsive container
function wrapPanchangTableInContainer(tableHtml) {
  return `<div class="jyotisham-panchang-table-container">${tableHtml}</div>`;
}

// Function to enhance table scrolling on mobile
function enhancePanchangTableScrolling() {
  const tableContainers = document.querySelectorAll(
    ".jyotisham-panchang-table-container"
  );

  tableContainers.forEach((container) => {
    container.style.overflowX = "auto";
    container.style.webkitOverflowScrolling = "touch";
  });
}

// Function to fix any remaining overflow issues
function fixPanchangMobileOverflow() {
  const containers = document.querySelectorAll(
    ".jyotisham-panchang-container, .jyotisham-panchang-results, .jyotisham-panchang-content, .jyotisham-panchang-card"
  );

  containers.forEach((container) => {
    if (!container.classList.contains("jyotisham-panchang-form-container")) {
      container.style.maxWidth = "100%";
    }
    container.style.overflowX = "hidden";
    container.style.boxSizing = "border-box";
  });

  const textElements = document.querySelectorAll(
    ".jyotisham-panchang-card p, .jyotisham-panchang-card h3, .jyotisham-panchang-content h2"
  );

  textElements.forEach((element) => {
    element.style.wordWrap = "break-word";
    element.style.overflowWrap = "break-word";
    element.style.hyphens = "auto";
    element.style.maxWidth = "100%";
  });
}

// Initialize form with default values
function initializePanchangFormWithDefaults() {
  // Always set current date
  const today = new Date();
  const dateInput = document.getElementById("jyotisham-panchang-date");
  if (dateInput) {
    dateInput.value = today.toISOString().split('T')[0];
  }

  // Always set current time
  const timeInput = document.getElementById("jyotisham-panchang-time");
  if (timeInput) {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    timeInput.value = `${hours}:${minutes}`;
  }

  // Set initial timezone for default location (Delhi, India)
  const latInput = document.getElementById("jyotisham-panchang-latitude");
  const lngInput = document.getElementById("jyotisham-panchang-longitude");
  const timezoneInput = document.getElementById("jyotisham-panchang-timezone");
  
  if (latInput && lngInput && timezoneInput) {
    const lat = parseFloat(latInput.value);
    const lng = parseFloat(lngInput.value);
    
    if (lat && lng) {
      // Get timezone for default location
      getPanchangTimezone(lat, lng);
    } else {
      // Fallback to browser timezone
      setBrowserTimezone();
    }
  }
}

// Set timezone based on browser's timezone
function setBrowserTimezone() {
  const timezoneInput = document.getElementById("jyotisham-panchang-timezone");
  if (timezoneInput) {
    const browserTimezone = new Date().getTimezoneOffset() / -60;
    timezoneInput.value = browserTimezone;
  }
}

// Initialize the panchang application
document.addEventListener("DOMContentLoaded", function () {
  // Only initialize if panchang form exists
  if (document.getElementById("jyotisham-panchang-form")) {
    initializePanchangGoogleMaps();
    setupPanchangEventListeners();
    initializePanchangFormWithDefaults();

    // Ensure timezone is set after a short delay
    setTimeout(() => {
      const timezoneInput = document.getElementById("jyotisham-panchang-timezone");
      if (timezoneInput && !timezoneInput.value) {
        setBrowserTimezone();
      }
    }, 1000);

    setTimeout(() => {
      fixPanchangMobileOverflow();
    }, 500);
  }
});

// Handle window resize to fix overflow issues
window.addEventListener("resize", function () {
  setTimeout(() => {
    fixPanchangMobileOverflow();
  }, 100);
});

// Initialize Google Maps autocomplete for panchang
function initializePanchangGoogleMaps() {
  const placeInput = document.getElementById("jyotisham-panchang-place");
  if (!placeInput) return;

  let debounceTimer;
  let autocomplete = null;
  let lastSearchTerm = "";
  let searchCount = 0;
  const maxSearchesPerSession = 10;

  // Function to clear autocomplete and dropdown
  function clearPanchangAutocomplete() {
    if (autocomplete) {
      google.maps.event.clearInstanceListeners(placeInput);
      autocomplete = null;
    }
    // Clear any existing dropdown
    const existingDropdown = document.querySelector('.pac-container');
    if (existingDropdown) {
      existingDropdown.remove();
    }
  }

  function debouncedSearch() {
    const currentValue = placeInput.value.trim();
    clearTimeout(debounceTimer);

    // Clear autocomplete if input is too short
    if (currentValue.length < 2) {
      clearPanchangAutocomplete();
      lastSearchTerm = ""; // Reset last search term
      hidePanchangSearchLoading();
      return;
    }

    // Don't make API calls if:
    // - Same search term as before
    // - Search limit reached
    // - Empty value
    // - Input is just numbers or special characters
    if (
      currentValue === lastSearchTerm ||
      searchCount >= maxSearchesPerSession ||
      !currentValue ||
      /^[0-9\s\-_.,!@#$%^&*()]+$/.test(currentValue) // Skip if only numbers/special chars
    ) {
      return;
    }

    // Show loading indicator
    showPanchangSearchLoading();

    // Much faster response - almost instant
    const debounceTime = searchCount < 5 ? 50 : Math.min(100 + searchCount * 25, 300);

    debounceTimer = setTimeout(() => {
      // Double-check conditions before making API call
      const finalValue = placeInput.value.trim();
      if (finalValue.length >= 2 && 
          finalValue !== lastSearchTerm && 
          searchCount < maxSearchesPerSession &&
          !/^[0-9\s\-_.,!@#$%^&*()]+$/.test(finalValue)) {
        lastSearchTerm = finalValue;
        searchCount++;
        initializePanchangAutocomplete();
      } else {
        hidePanchangSearchLoading();
      }
    }, debounceTime);
  }

  function initializePanchangAutocomplete() {
    if (!autocomplete && searchCount <= maxSearchesPerSession) {
      clearPanchangAutocomplete();

      autocomplete = new google.maps.places.Autocomplete(placeInput, {
        types: ["(cities)"],
        fields: ["place_id", "geometry", "name", "formatted_address"],
      
      });

      const originalGetPlacePredictions = autocomplete.getPlacePredictions;
      autocomplete.getPlacePredictions = function (request, callback) {
        if (request.input && request.input.length >= 2) {
          originalGetPlacePredictions.call(this, request, callback);
        } else {
          callback([]);
        }
      };

      autocomplete.addListener("place_changed", function () {
        const place = autocomplete.getPlace();
        if (place && place.geometry) {
          document.getElementById("jyotisham-panchang-latitude").value =
            place.geometry.location.lat();
          document.getElementById("jyotisham-panchang-longitude").value =
            place.geometry.location.lng();
          getPanchangTimezone(
            place.geometry.location.lat(),
            place.geometry.location.lng()
          );
          hidePanchangSearchLoading();
        }
      });
    } else if (searchCount > maxSearchesPerSession) {
      placeInput.placeholder =
        "⚠️ Search limit reached. Please refresh to search again.";
      placeInput.disabled = true;
    }
  }

  placeInput.addEventListener("input", debouncedSearch);

  // Hide searching indicator when input loses focus
  placeInput.addEventListener("blur", () => {
    hidePanchangSearchLoading();
  });

  placeInput.addEventListener("keydown", (e) => {
    // Clear autocomplete on backspace when input becomes too short
    if (e.key === "Backspace" && placeInput.value.length <= 2) {
      clearPanchangAutocomplete();
      lastSearchTerm = ""; // Reset search term
      hidePanchangSearchLoading();
    }

    // Prevent API calls for certain keys that don't change meaningful content
    if (["Tab", "Shift", "Control", "Alt", "Meta", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End", "PageUp", "PageDown"].includes(e.key)) {
      return; // Don't trigger search for navigation keys
    }

    // Prevent API calls for function keys
    if (e.key.startsWith("F") && e.key.length <= 3) {
      return; // Don't trigger search for function keys (F1, F2, etc.)
    }

    if (e.key === "Enter" && searchCount > maxSearchesPerSession) {
      e.preventDefault();
      alert("Search limit reached. Please refresh the page to search again.");
    }
  });
}

// Show loading indicator for Panchang search
function showPanchangSearchLoading() {
  const placeInput = document.getElementById("jyotisham-panchang-place");
  if (!placeInput) return;
  
  // Add loading class to input
  placeInput.classList.add("jyotisham-panchang-search-loading");
  
  // Add loading indicator if not exists
  let loadingIndicator = document.querySelector(".jyotisham-panchang-search-loading-indicator");
  if (!loadingIndicator) {
    loadingIndicator = document.createElement("div");
    loadingIndicator.className = "jyotisham-panchang-search-loading-indicator";
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

  // Auto-hide if no results arrive shortly (prevents stuck indicators)
  clearTimeout(panchangSearchLoadingTimer);
  panchangSearchLoadingTimer = setTimeout(() => {
    hidePanchangSearchLoading();
  }, 2000);
}

// Hide loading indicator for Panchang search
function hidePanchangSearchLoading() {
  const placeInput = document.getElementById("jyotisham-panchang-place");
  if (!placeInput) return;
  
  clearTimeout(panchangSearchLoadingTimer);
  
  // Remove loading class from input
  placeInput.classList.remove("jyotisham-panchang-search-loading");
  
  // Hide loading indicator
  const loadingIndicator = document.querySelector(".jyotisham-panchang-search-loading-indicator");
  if (loadingIndicator) {
    loadingIndicator.style.display = "none";
  }
}

// Get timezone using server-side AJAX call
function getPanchangTimezone(lat, lng) {
  if (typeof jyotisham_ajax === 'undefined') {
    setBrowserTimezone();
    return;
  }

  const formData = new FormData();
  formData.append('action', 'jyotisham_get_timezone');
  formData.append('nonce', jyotisham_ajax.nonce);
  formData.append('latitude', lat);
  formData.append('longitude', lng);

  fetch(jyotisham_ajax.ajax_url, {
    method: 'POST',
    body: formData
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    if (data.success && data.data && data.data.timezone !== undefined) {
      const timezoneInput = document.getElementById("jyotisham-panchang-timezone");
      if (timezoneInput) {
        timezoneInput.value = data.data.timezone;
      }
    } else {
      setBrowserTimezone();
    }
  })
  .catch(error => {
    setBrowserTimezone();
  });
}

// Setup event listeners for panchang
function setupPanchangEventListeners() {
  // Form submission
  const form = document.getElementById("jyotisham-panchang-form");
  if (form) {
    form.addEventListener("submit", handlePanchangFormSubmit);
  }
}

// Handle panchang form submission
async function handlePanchangFormSubmit(e) {
  e.preventDefault();

  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData);

  // Validate required fields
  if (!data.latitude || !data.longitude) {
    alert("Please select a valid place from the dropdown");
    return;
  }

  // Ensure timezone is set before submission
  if (!data.timezone) {
    setBrowserTimezone();
    data.timezone = document.getElementById("jyotisham-panchang-timezone").value;
  }

  panchangCurrentData = data;

  // Show loading
  showPanchangLoading();

  try {
    // Generate panchang data via AJAX
    const panchangData = await fetchPanchangDataViaAjax();

    // Hide loading and show results
    hidePanchangLoading();
    showPanchangResults();

    // Display all panchang data
    displayPanchangData(panchangData);
  } catch (error) {
    let errorType = "error";
    let errorMessage = error.message;

    if (
      error.message.includes("rate limit") ||
      error.message.includes("API calls")
    ) {
      errorType = "warning";
    }

    showPanchangError(errorMessage, errorType);
  }
}

// Show loading indicator
function showPanchangLoading() {
  const loading = document.getElementById("jyotisham-panchang-loading");
  const results = document.getElementById("jyotisham-panchang-results");
  
  if (loading) loading.classList.remove("jyotisham-panchang-hidden");
  if (results) results.classList.add("jyotisham-panchang-hidden");
}

// Show error message
function showPanchangError(errorMessage, errorType = "error") {
  hidePanchangLoading();

  const errorContainer = document.getElementById("jyotisham-panchang-results");
  if (!errorContainer) return;

  const errorIcon = errorType === "warning" ? "⚠️" : "❌";
  const errorClass =
    errorType === "warning" ? "jyotisham-panchang-warning" : "jyotisham-panchang-error";

  errorContainer.innerHTML = `
    <div class="jyotisham-panchang-card ${errorClass}">
      <div class="jyotisham-panchang-error-content">
        <div class="jyotisham-panchang-error-icon">${errorIcon}</div>
        <div class="jyotisham-panchang-error-message">
          <h3>${errorType === "warning" ? "Warning" : "Error"}</h3>
          <p>${errorMessage}</p>
          <div class="jyotisham-panchang-error-actions">
            <button onclick="location.reload()" class="jyotisham-panchang-retry-btn">Try Again</button>
            <button onclick="document.getElementById('jyotisham-panchang-results').classList.add('jyotisham-panchang-hidden')" class="jyotisham-panchang-close-btn">Close</button>
          </div>
        </div>
      </div>
    </div>
  `;

  errorContainer.classList.remove("jyotisham-panchang-hidden");
}

// Hide loading indicator
function hidePanchangLoading() {
  const loading = document.getElementById("jyotisham-panchang-loading");
  if (loading) loading.classList.add("jyotisham-panchang-hidden");
}

// Show results
function showPanchangResults() {
  const results = document.getElementById("jyotisham-panchang-results");
  if (results) results.classList.remove("jyotisham-panchang-hidden");
}

// Fetch panchang data via AJAX (secure server-side call)
async function fetchPanchangDataViaAjax() {
  if (typeof jyotisham_ajax === 'undefined') {
    throw new Error('AJAX configuration not found');
  }

  const formData = new FormData();
  formData.append('action', 'jyotisham_get_panchang');
  formData.append('nonce', jyotisham_ajax.nonce);
  formData.append('date', panchangCurrentData.date);
  formData.append('time', panchangCurrentData.time);
  formData.append('latitude', panchangCurrentData.latitude);
  formData.append('longitude', panchangCurrentData.longitude);
  formData.append('timezone', panchangCurrentData.timezone);
  formData.append('language', panchangCurrentData.language);

  const response = await fetch(jyotisham_ajax.ajax_url, {
    method: 'POST',
    body: formData
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.data || 'Failed to fetch panchang data');
  }

  return data.data;
}

// Display all panchang data in unified view
function displayPanchangData(data) {
  const container = document.getElementById("jyotisham-panchangData");
  if (!container) return;
  
  if (data.status !== 200) {
    container.innerHTML =
      '<div class="jyotisham-panchang-card"><p>Error loading panchang data</p></div>';
    return;
  }

  const response = data.response;
  
  container.innerHTML = `
    <div class="jyotisham-panchang-content">
      <!-- Main Header -->
      <div class="jyotisham-panchang-score-card">
        <h3>${panchangCurrentData.date}</h3>
        <div class="jyotisham-panchang-day-display">${response.day.name}</div>
        <div class="jyotisham-panchang-score-number">${response.tithi.name}</div>
        <div class="jyotisham-panchang-score-description">${response.tithi.meaning}</div>
      </div>
      
      <!-- Sun & Moon Timings -->
      <div class="jyotisham-panchang-card">
        <h3>Sun & Moon Timings</h3>
        <p class="jyotisham-panchang-section-description">Astronomical timings for the selected date and location</p>
        ${wrapPanchangTableInContainer(`
        <table class="jyotisham-panchang-data-table">
          <tr><td><strong>Sunrise</strong></td><td>${response.advanced_details.sun_rise}</td></tr>
          <tr><td><strong>Sunset</strong></td><td>${response.advanced_details.sun_set}</td></tr>
          <tr><td><strong>Moonrise</strong></td><td>${response.advanced_details.moon_rise}</td></tr>
          <tr><td><strong>Moonset</strong></td><td>${response.advanced_details.moon_set}</td></tr>
          <tr><td><strong>Solar Noon</strong></td><td>${response.advanced_details.solar_noon}</td></tr>
        </table>
        `)}
      </div>
      
      <!-- Auspicious Timings -->
      <div class="jyotisham-panchang-card">
        <h3>Auspicious Timings</h3>
        ${wrapPanchangTableInContainer(`
        <table class="jyotisham-panchang-data-table">
          <tr><td><strong>Rahu Kaal</strong></td><td>${response.rahukaal}</td></tr>
          <tr><td><strong>Gulika</strong></td><td>${response.gulika}</td></tr>
          <tr><td><strong>Yamakanta</strong></td><td>${response.yamakanta}</td></tr>
          <tr><td><strong>Bhadrakaal</strong></td><td>${response.bhadrakaal || 'Not applicable'}</td></tr>
          <tr><td><strong>Abhijit Muhurta Start</strong></td><td>${response.advanced_details.abhijitMuhurta?.start || 'Not available'}</td></tr>
          <tr><td><strong>Abhijit Muhurta End</strong></td><td>${response.advanced_details.abhijitMuhurta?.end || 'Not available'}</td></tr>
        </table>
        `)}
      </div>
      
      <!-- Moon Phases -->
      <div class="jyotisham-panchang-card">
        <h3>Moon Phases</h3>
        ${wrapPanchangTableInContainer(`
        <table class="jyotisham-panchang-data-table">
          <tr><td><strong>Next Full Moon</strong></td><td>${response.advanced_details.next_full_moon || 'Not available'}</td></tr>
          <tr><td><strong>Next New Moon</strong></td><td>${response.advanced_details.next_new_moon || 'Not available'}</td></tr>
        </table>
        `)}
      </div>
      
      <!-- Daily Panchang Details -->
      <div class="jyotisham-panchang-card">
        <h3>Daily Panchang Details</h3>
        <p class="jyotisham-panchang-section-description">Essential astrological elements for the selected date</p>
        ${wrapPanchangTableInContainer(`
        <table class="jyotisham-panchang-data-table">
          <thead>
            <tr>
              <th>Element</th>
              <th>Name</th>
              <th>Type/Lord</th>
              <th>Deity</th>
              <th>Start Time</th>
              <th>End Time</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Tithi</strong></td>
              <td>${response.tithi.name}</td>
              <td>${response.tithi.type}</td>
              <td>${response.tithi.diety}</td>
              <td>${response.tithi.start}</td>
              <td>${response.tithi.end}</td>
            </tr>
            <tr>
              <td><strong>Nakshatra</strong></td>
              <td>${response.nakshatra.name}</td>
              <td>${response.nakshatra.lord}</td>
              <td>${response.nakshatra.diety}</td>
              <td>${response.nakshatra.start}</td>
              <td>${response.nakshatra.end}</td>
            </tr>
            <tr>
              <td><strong>Yoga</strong></td>
              <td>${response.yoga.name}</td>
              <td>Number ${response.yoga.number}</td>
              <td>-</td>
              <td>${response.yoga.start}</td>
              <td>${response.yoga.end}</td>
            </tr>
            <tr>
              <td><strong>Karana</strong></td>
              <td>${response.karana.name}</td>
              <td>${response.karana.type}</td>
              <td>${response.karana.diety}</td>
              <td>${response.karana.start}</td>
              <td>${response.karana.end}</td>
            </tr>
          </tbody>
        </table>
        `)}
      </div>
      
      <!-- Detailed Tithi Information -->
      <div class="jyotisham-panchang-card">
        <h3>Tithi Details</h3>
        ${wrapPanchangTableInContainer(`
        <table class="jyotisham-panchang-data-table">
          <tr><td><strong>Name</strong></td><td>${response.tithi.name}</td></tr>
          <tr><td><strong>Type</strong></td><td>${response.tithi.type}</td></tr>
          <tr><td><strong>Number</strong></td><td>${response.tithi.number}</td></tr>
          <tr><td><strong>Deity</strong></td><td>${response.tithi.diety}</td></tr>
          <tr><td><strong>Start Time</strong></td><td>${response.tithi.start}</td></tr>
          <tr><td><strong>End Time</strong></td><td>${response.tithi.end}</td></tr>
          <tr><td><strong>Next Tithi</strong></td><td>${response.tithi.next_tithi}</td></tr>
          <tr><td><strong>Meaning</strong></td><td>${response.tithi.meaning}</td></tr>
          <tr><td><strong>Special</strong></td><td>${response.tithi.special}</td></tr>
        </table>
        `)}
      </div>
      
      <!-- Detailed Nakshatra Information -->
      <div class="jyotisham-panchang-card">
        <h3>Nakshatra Details</h3>
        ${wrapPanchangTableInContainer(`
        <table class="jyotisham-panchang-data-table">
          <tr><td><strong>Name</strong></td><td>${response.nakshatra.name}</td></tr>
          <tr><td><strong>Lord</strong></td><td>${response.nakshatra.lord}</td></tr>
          <tr><td><strong>Deity</strong></td><td>${response.nakshatra.diety}</td></tr>
          <tr><td><strong>Number</strong></td><td>${response.nakshatra.number}</td></tr>
          <tr><td><strong>Pada</strong></td><td>${response.nakshatra.pada}</td></tr>
          <tr><td><strong>Start Time</strong></td><td>${response.nakshatra.start}</td></tr>
          <tr><td><strong>End Time</strong></td><td>${response.nakshatra.end}</td></tr>
          <tr><td><strong>Next Nakshatra</strong></td><td>${response.nakshatra.next_nakshatra}</td></tr>
          <tr><td><strong>Meaning</strong></td><td>${response.nakshatra.meaning}</td></tr>
          <tr><td><strong>Special</strong></td><td>${response.nakshatra.special}</td></tr>
          <tr><td><strong>Summary</strong></td><td>${response.nakshatra.summary}</td></tr>
          <tr><td><strong>Words</strong></td><td>${response.nakshatra.words}</td></tr>
        </table>
        `)}
      </div>
      
      <!-- Detailed Karana Information -->
      <div class="jyotisham-panchang-card">
        <h3>Karana Details</h3>
        ${wrapPanchangTableInContainer(`
        <table class="jyotisham-panchang-data-table">
          <tr><td><strong>Name</strong></td><td>${response.karana.name}</td></tr>
          <tr><td><strong>Lord</strong></td><td>${response.karana.lord}</td></tr>
          <tr><td><strong>Deity</strong></td><td>${response.karana.diety}</td></tr>
          <tr><td><strong>Type</strong></td><td>${response.karana.type}</td></tr>
          <tr><td><strong>Number</strong></td><td>${response.karana.number}</td></tr>
          <tr><td><strong>Start Time</strong></td><td>${response.karana.start}</td></tr>
          <tr><td><strong>End Time</strong></td><td>${response.karana.end}</td></tr>
          <tr><td><strong>Next Karana</strong></td><td>${response.karana.next_karana}</td></tr>
          <tr><td><strong>Special</strong></td><td>${response.karana.special}</td></tr>
        </table>
        `)}
      </div>
      
      <!-- Detailed Yoga Information -->
      <div class="jyotisham-panchang-card">
        <h3>Yoga Details</h3>
        ${wrapPanchangTableInContainer(`
        <table class="jyotisham-panchang-data-table">
          <tr><td><strong>Name</strong></td><td>${response.yoga.name}</td></tr>
          <tr><td><strong>Number</strong></td><td>${response.yoga.number}</td></tr>
          <tr><td><strong>Start Time</strong></td><td>${response.yoga.start}</td></tr>
          <tr><td><strong>End Time</strong></td><td>${response.yoga.end}</td></tr>
          <tr><td><strong>Next Yoga</strong></td><td>${response.yoga.next_yoga}</td></tr>
          <tr><td><strong>Meaning</strong></td><td>${response.yoga.meaning}</td></tr>
          <tr><td><strong>Special</strong></td><td>${response.yoga.special}</td></tr>
        </table>
        `)}
      </div>
      
      <!-- Calendar Information -->
      <div class="jyotisham-panchang-card">
        <h3>Calendar Information</h3>
        <p class="jyotisham-panchang-section-description">Traditional calendar systems and astrological data</p>
        ${wrapPanchangTableInContainer(`
        <table class="jyotisham-panchang-data-table">
          <tr><td><strong>Day</strong></td><td>${response.day.name} (${response.advanced_details.vaara})</td></tr>
          <tr><td><strong>Zodiac (Rasi)</strong></td><td>${response.rasi.name}</td></tr>
          <tr><td><strong>Ayanamsa</strong></td><td>${response.ayanamsa.name}</td></tr>
          <tr><td><strong>Disha Shool</strong></td><td>${response.advanced_details.disha_shool}</td></tr>
          <tr><td><strong>Moon Yogini Nivas</strong></td><td>${response.advanced_details.moon_yogini_nivas}</td></tr>
        </table>
        `)}
      </div>
      
      <!-- Masa Details -->
      <div class="jyotisham-panchang-card">
        <h3>Masa Details</h3>
        ${wrapPanchangTableInContainer(`
        <table class="jyotisham-panchang-data-table">
          <tr><td><strong>Ayana</strong></td><td>${response.advanced_details.masa.ayana}</td></tr>
          <tr><td><strong>Purnimanta</strong></td><td>${response.advanced_details.masa.purnimanta_name}</td></tr>
          <tr><td><strong>Amanta</strong></td><td>${response.advanced_details.masa.amanta_name}</td></tr>
          <tr><td><strong>Alternate Amanta Name</strong></td><td>${response.advanced_details.masa.alternate_amanta_name}</td></tr>
          <tr><td><strong>Adhik Maasa</strong></td><td>${response.advanced_details.masa.adhik_maasa ? 'Yes' : 'No'}</td></tr>
          <tr><td><strong>Ritu</strong></td><td>${response.advanced_details.masa.ritu}</td></tr>
          <tr><td><strong>Ritu Tamil</strong></td><td>${response.advanced_details.masa.ritu_tamil}</td></tr>
          <tr><td><strong>Ritu Odia</strong></td><td>${response.advanced_details.masa.rituOdia}</td></tr>
          <tr><td><strong>Tamil Month</strong></td><td>${response.advanced_details.masa.tamil_month} (${response.advanced_details.masa.tamil_month_num})</td></tr>
          <tr><td><strong>Tamil Day</strong></td><td>${response.advanced_details.masa.tamil_day}</td></tr>
          <tr><td><strong>Moon Phase</strong></td><td>${response.advanced_details.masa.moon_phase}</td></tr>
          <tr><td><strong>Paksha</strong></td><td>${response.advanced_details.masa.paksha}</td></tr>
        </table>
        `)}
      </div>
      
      <!-- Year Details -->
      <div class="jyotisham-panchang-card">
        <h3>Year Details</h3>
        ${wrapPanchangTableInContainer(`
        <table class="jyotisham-panchang-data-table">
          <tr><td><strong>Kali</strong></td><td>${response.advanced_details.years.kali}</td></tr>
          <tr><td><strong>Kali Samvaat Name</strong></td><td>${response.advanced_details.years.kali_samvaat_name || 'Not available'}</td></tr>
          <tr><td><strong>Kali Samvaat Number</strong></td><td>${response.advanced_details.years.kali_samvaat_number || 'Not available'}</td></tr>
          <tr><td><strong>Saka</strong></td><td>${response.advanced_details.years.saka}</td></tr>
          <tr><td><strong>Saka Samvaat Name</strong></td><td>${response.advanced_details.years.saka_samvaat_name || 'Not available'}</td></tr>
          <tr><td><strong>Saka Samvaat Number</strong></td><td>${response.advanced_details.years.saka_samvaat_number || 'Not available'}</td></tr>
          <tr><td><strong>Vikram Samvaat</strong></td><td>${response.advanced_details.years.vikram_samvaat}</td></tr>
          <tr><td><strong>Vikram Samvaat Name</strong></td><td>${response.advanced_details.years.vikram_samvaat_name || 'Not available'}</td></tr>
          <tr><td><strong>Vikram Samvaat Number</strong></td><td>${response.advanced_details.years.vikram_samvaat_number || 'Not available'}</td></tr>
        </table>
        `)}
      </div>
      
      <!-- Advanced Astrological Data -->
      <div class="jyotisham-panchang-card">
        <h3>Advanced Astrological Data</h3>
        <p class="jyotisham-panchang-section-description">Detailed astrological calculations and measurements</p>
        ${wrapPanchangTableInContainer(`
        <table class="jyotisham-panchang-data-table">
          <tr><td><strong>Ayanamsa</strong></td><td>${response.ayanamsa.name}</td></tr>
          <tr><td><strong>Disha Shool</strong></td><td>${response.advanced_details.disha_shool}</td></tr>
          <tr><td><strong>Ahargana</strong></td><td>${response.advanced_details.ahargana}</td></tr>
          <tr><td><strong>Yogini Nivas</strong></td><td>${response.advanced_details.moon_yogini_nivas}</td></tr>
        </table>
        `)}
      </div>
    </div>
  `;

  setTimeout(() => {
    enhancePanchangTableScrolling();
    fixPanchangMobileOverflow();
  }, 100);
}


