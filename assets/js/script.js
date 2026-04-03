// Global variables
let currentData = {};
let cachedData = {};
let autocomplete = null;
let locationCache = new Map(); // Cache for location suggestions
let searchLoadingTimeout = null;

// Initialize the application
document.addEventListener("DOMContentLoaded", function () {
  // Try to initialize immediately
  initializeGoogleMaps();
  setupEventListeners();
  fixMobileOverflow();
  
  // If Google Maps is not loaded yet, wait for it
  if (!window.google || !google.maps || !google.maps.places) {
    let retryCount = 0;
    const maxRetries = 20; // 20 attempts * 250ms = 5 seconds
    
    const checkGoogleMaps = setInterval(() => {
      retryCount++;
      
      if (window.google && google.maps && google.maps.places) {
        clearInterval(checkGoogleMaps);
        console.log('Google Maps loaded, re-initializing autocomplete');
        initializeGoogleMaps();
      } else if (retryCount >= maxRetries) {
        clearInterval(checkGoogleMaps);
        console.warn('Google Maps failed to load after 5 seconds');
      }
    }, 250);
  }
});

// Handle window resize to fix overflow issues
window.addEventListener("resize", function () {
  setTimeout(() => {
    fixMobileOverflow();
    setupTabSwipeSupport();
    setupChartTabsSwipeSupport();
  }, 100);
});

// Initialize Google Maps autocomplete (only for Kundli containers)
function initializeGoogleMaps() {
  const kundliContainer = document.querySelector(".jyotisham-kundli-container");
  const placeInput = kundliContainer ? kundliContainer.querySelector("#jyotisham-placeOfBirth") : document.getElementById("jyotisham-placeOfBirth");
  if (!placeInput) return;

  let debounceTimer;
  let lastSearchTerm = "";
  let searchCount = 0;
  const maxSearchesPerSession = 10;

  // Pre-initialize autocomplete for instant response
  if (window.google && google.maps && google.maps.places) {
    try {
      autocomplete = new google.maps.places.Autocomplete(placeInput, {
        types: ["(cities)"],
        fields: ["place_id", "geometry", "name", "formatted_address"],
        componentRestrictions: { country: [] },
        bounds: new google.maps.LatLngBounds(
          new google.maps.LatLng(-90, -180),
          new google.maps.LatLng(90, 180)
        )
      });

      // Set up event listeners immediately
      autocomplete.addListener("place_changed", function () {
        const place = autocomplete.getPlace();
        if (place && place.geometry) {
          document.getElementById("jyotisham-latitude").value =
            place.geometry.location.lat();
          document.getElementById("jyotisham-longitude").value =
            place.geometry.location.lng();
          getTimezone(
            place.geometry.location.lat(),
            place.geometry.location.lng()
          );
          hideSearchLoading();
        }
      });

      // Add error handling
      autocomplete.addListener("status_changed", function() {
        if (autocomplete.getStatus() === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          hideSearchLoading();
        }
      });

      console.log('Google Maps Autocomplete pre-initialized for instant response');
    } catch (error) {
      console.error('Error pre-initializing Google Maps Autocomplete:', error);
      autocomplete = null;
    }
  }

  // Function to clear autocomplete and dropdown
  function clearKundliAutocomplete() {
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
      lastSearchTerm = ""; // Reset last search term
      hideSearchLoading();
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

    // Show loading indicator immediately
    showSearchLoading();

    // Since autocomplete is pre-initialized, we just need minimal debounce
    let debounceTime;
    if (searchCount < 5) {
      debounceTime = 50; // Very fast for first searches
    } else {
      debounceTime = Math.min(100 + searchCount * 25, 300); // Progressive delay
    }

    debounceTimer = setTimeout(() => {
      // Double-check conditions before making API call
      const finalValue = placeInput.value.trim();
      if (finalValue.length >= 2 && 
          finalValue !== lastSearchTerm && 
          searchCount < maxSearchesPerSession &&
          !/^[0-9\s\-_.,!@#$%^&*()]+$/.test(finalValue)) {
        lastSearchTerm = finalValue;
        searchCount++;
        
        // If autocomplete is already initialized, just trigger it
        if (autocomplete) {
          // The autocomplete will handle the search automatically
          hideSearchLoading();
        } else {
          // Fallback to manual initialization
          initializeAutocomplete();
        }
      } else {
        hideSearchLoading();
      }
    }, debounceTime);
  }

  function initializeAutocomplete() {
    if (!autocomplete && searchCount <= maxSearchesPerSession) {
      clearKundliAutocomplete();

      // Check cache first
      const cacheKey = placeInput.value.trim().toLowerCase();
      if (locationCache.has(cacheKey)) {
        const cachedResult = locationCache.get(cacheKey);
        if (cachedResult && cachedResult.length > 0) {
          // Use cached result immediately
          displayCachedSuggestions(cachedResult);
          hideSearchLoading();
          return;
        }
      }

      // Check if Google Maps is available
      if (!window.google || !google.maps || !google.maps.places) {
        console.warn('Google Maps Places API not loaded yet');
        hideSearchLoading();
        return;
      }

      try {
        autocomplete = new google.maps.places.Autocomplete(placeInput, {
          types: ["(cities)"],
          fields: ["place_id", "geometry", "name", "formatted_address"],
          componentRestrictions: { country: [] }, // Allow all countries for better results
          bounds: new google.maps.LatLngBounds(
            new google.maps.LatLng(-90, -180),
            new google.maps.LatLng(90, 180)
          )
        });

        // Override the getPlacePredictions method for better caching
        const originalGetPlacePredictions = autocomplete.getPlacePredictions;
        autocomplete.getPlacePredictions = function (request, callback) {
          if (request.input && request.input.length >= 2) {
            // Cache the request
            const cacheKey = request.input.toLowerCase();
            if (locationCache.has(cacheKey)) {
              callback(locationCache.get(cacheKey), google.maps.places.PlacesServiceStatus.OK);
              hideSearchLoading();
              return;
            }
            
            // Add timeout to prevent hanging
            const timeoutId = setTimeout(() => {
              hideSearchLoading();
            }, 5000);
            
            originalGetPlacePredictions.call(this, request, (predictions, status) => {
              clearTimeout(timeoutId);
              
              if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
                // Cache the results
                locationCache.set(cacheKey, predictions);
              }
              callback(predictions, status);
              hideSearchLoading();
            });
          } else {
            callback([]);
            hideSearchLoading();
          }
        };

        autocomplete.addListener("place_changed", function () {
          const place = autocomplete.getPlace();
          if (place && place.geometry) {
            document.getElementById("jyotisham-latitude").value =
              place.geometry.location.lat();
            document.getElementById("jyotisham-longitude").value =
              place.geometry.location.lng();
            getTimezone(
              place.geometry.location.lat(),
              place.geometry.location.lng()
            );
            hideSearchLoading();
          }
        });

        // Add error handling
        autocomplete.addListener("status_changed", function() {
          if (autocomplete.getStatus() === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
            hideSearchLoading();
          }
        });

      } catch (error) {
        console.error('Error initializing Google Maps Autocomplete:', error);
        hideSearchLoading();
      }
    } else if (searchCount > maxSearchesPerSession) {
      placeInput.placeholder =
        "⚠️ Search limit reached. Please refresh to search again.";
      placeInput.disabled = true;
      hideSearchLoading();
    }
  }

  placeInput.addEventListener("input", debouncedSearch);

  placeInput.addEventListener("keydown", (e) => {
    // Clear autocomplete on backspace when input becomes too short
    if (e.key === "Backspace" && placeInput.value.length <= 2) {
      clearKundliAutocomplete();
      lastSearchTerm = ""; // Reset search term
      hideSearchLoading();
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

// Show loading indicator for search
function showSearchLoading() {
  const kundliContainer = document.querySelector(".jyotisham-kundli-container");
  const placeInput = kundliContainer ? kundliContainer.querySelector("#jyotisham-placeOfBirth") : document.getElementById("jyotisham-placeOfBirth");
  if (!placeInput) return;
  
  clearTimeout(searchLoadingTimeout);
  
  // Add loading class to input
  placeInput.classList.add("jyotisham-search-loading");
  
  // Add loading indicator if not exists
  let loadingIndicator = document.querySelector(".jyotisham-search-loading-indicator");
  if (!loadingIndicator) {
    loadingIndicator = document.createElement("div");
    loadingIndicator.className = "jyotisham-search-loading-indicator";
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

// Hide loading indicator for search
function hideSearchLoading() {
  const kundliContainer = document.querySelector(".jyotisham-kundli-container");
  const placeInput = kundliContainer ? kundliContainer.querySelector("#jyotisham-placeOfBirth") : document.getElementById("jyotisham-placeOfBirth");
  if (!placeInput) return;
  
  clearTimeout(searchLoadingTimeout);
  
  // Remove loading class from input
  placeInput.classList.remove("jyotisham-search-loading");
  
  // Hide loading indicator
  const loadingIndicator = document.querySelector(".jyotisham-search-loading-indicator");
  if (loadingIndicator) {
    loadingIndicator.style.display = "none";
  }
}

// Display cached suggestions (fallback for when Google Maps API is slow)
function displayCachedSuggestions(predictions) {
  // This is a fallback - the main autocomplete should handle this
  // But we can show a visual indicator that cached results are being used
  console.log("Using cached location suggestions:", predictions.length, "results");
}

// Get timezone using server-side AJAX
function getTimezone(lat, lng) {
  jQuery.ajax({
    url: jyotisham_ajax.ajax_url,
    type: 'POST',
    data: {
      action: 'jyotisham_get_timezone',
      latitude: lat,
      longitude: lng,
      nonce: jyotisham_ajax.nonce
    },
    success: function(response) {
      if (response.success) {
        document.getElementById("jyotisham-timezone").value = response.data.timezone;
      } else {
        // Default to UTC+5.5 (India)
        document.getElementById("jyotisham-timezone").value = 5.5;
      }
    },
    error: function() {
      // Default to UTC+5.5 (India)
      document.getElementById("jyotisham-timezone").value = 5.5;
    }
  });
}

// Setup event listeners (scoped to Kundli containers only)
function setupEventListeners() {
  document.querySelectorAll(".jyotisham-kundli-container").forEach((container) => {
    // Form submission
    const form = container.querySelector("#jyotisham-astro-api-form");
    if (form) {
      form.addEventListener("submit", handleFormSubmit);
    }

    // Tab switching - only Kundli tabs
    container.querySelectorAll(".jyotisham-tab-btn").forEach((btn) => {
      btn.addEventListener("click", handleTabClick);
    });

    // Chart style switching
    container.querySelectorAll(".jyotisham-style-btn").forEach((btn) => {
      btn.addEventListener("click", handleStyleClick);
    });

    // Chart division switching
    container.querySelectorAll(".jyotisham-division-btn").forEach((btn) => {
      btn.addEventListener("click", handleDivisionClick);
    });
  });

  // Add touch/swipe support (scoped to Kundli)
  setupTabSwipeSupport();
  setupChartTabsSwipeSupport();
}

// Setup touch/swipe support for tab navigation (mobile only) - Kundli only
function setupTabSwipeSupport() {
  const kundliContainer = document.querySelector(".jyotisham-kundli-container");
  const tabNavigation = kundliContainer ? kundliContainer.querySelector(".jyotisham-tab-navigation") : document.querySelector(".jyotisham-tab-navigation");
  if (!tabNavigation || window.innerWidth > 768) return;

  let startX = 0;
  let scrollLeft = 0;
  let isDown = false;
  let startTime = 0;
  let velocity = 0;
  let lastX = 0;
  let lastTime = 0;

  function handleTouchStart(e) {
    isDown = true;
    startX = e.touches[0].pageX - tabNavigation.offsetLeft;
    scrollLeft = tabNavigation.scrollLeft;
    startTime = Date.now();
    lastX = startX;
    lastTime = startTime;
    velocity = 0;
  }

  function handleTouchEnd(e) {
    if (!isDown) return;
    isDown = false;

    if (Math.abs(velocity) > 0.5) {
      const momentum = velocity * 100;
      tabNavigation.scrollLeft -= momentum;
    }
  }

  function handleTouchMove(e) {
    if (!isDown) return;

    const currentX = e.touches[0].pageX - tabNavigation.offsetLeft;
    const currentTime = Date.now();
    const deltaX = currentX - lastX;
    const deltaTime = currentTime - lastTime;

    if (deltaTime > 0) {
      velocity = deltaX / deltaTime;
    }

    lastX = currentX;
    lastTime = currentTime;

    e.preventDefault();
    const walk = (currentX - startX) * 1.5;
    tabNavigation.scrollLeft = scrollLeft - walk;
  }

  tabNavigation.addEventListener("touchstart", handleTouchStart, { passive: false });
  tabNavigation.addEventListener("touchend", handleTouchEnd, { passive: false });
  tabNavigation.addEventListener("touchmove", handleTouchMove, { passive: false });
}

// Setup touch/swipe support for chart division tabs (mobile only) - Kundli only
function setupChartTabsSwipeSupport() {
  const kundliContainer = document.querySelector(".jyotisham-kundli-container");
  const chartDivisionTabs = kundliContainer ? kundliContainer.querySelector(".jyotisham-chart-division-tabs") : document.querySelector(".jyotisham-chart-division-tabs");
  if (!chartDivisionTabs || window.innerWidth > 768) return;

  let startX = 0;
  let scrollLeft = 0;
  let isDown = false;
  let startTime = 0;
  let velocity = 0;
  let lastX = 0;
  let lastTime = 0;

  function handleChartTouchStart(e) {
    isDown = true;
    startX = e.touches[0].pageX - chartDivisionTabs.offsetLeft;
    scrollLeft = chartDivisionTabs.scrollLeft;
    startTime = Date.now();
    lastX = startX;
    lastTime = startTime;
    velocity = 0;
  }

  function handleChartTouchEnd(e) {
    if (!isDown) return;
    isDown = false;

    if (Math.abs(velocity) > 0.5) {
      const momentum = velocity * 100;
      chartDivisionTabs.scrollLeft -= momentum;
    }
  }

  function handleChartTouchMove(e) {
    if (!isDown) return;

    const currentX = e.touches[0].pageX - chartDivisionTabs.offsetLeft;
    const currentTime = Date.now();
    const deltaX = currentX - lastX;
    const deltaTime = currentTime - lastTime;

    if (deltaTime > 0) {
      velocity = deltaX / deltaTime;
    }

    lastX = currentX;
    lastTime = currentTime;

    e.preventDefault();
    const walk = (currentX - startX) * 1.5;
    chartDivisionTabs.scrollLeft = scrollLeft - walk;
  }

  chartDivisionTabs.addEventListener("touchstart", handleChartTouchStart, { passive: false });
  chartDivisionTabs.addEventListener("touchend", handleChartTouchEnd, { passive: false });
  chartDivisionTabs.addEventListener("touchmove", handleChartTouchMove, { passive: false });
}

// Handle form submission
async function handleFormSubmit(e) {
  e.preventDefault();

  const container = e.target.closest(".jyotisham-kundli-container");
  if (!container) return;

  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData);

  // Validate required fields
  if (!data.latitude || !data.longitude) {
    alert("Please select a valid place from the dropdown");
    return;
  }

  // Format data for API
  const apiData = {
    name: data.name,
    date: formatDate(data.dateOfBirth),
    time: data.timeOfBirth,
    latitude: data.latitude,
    longitude: data.longitude,
    tz: data.timezone,
    lang: data.language
  };

  currentData = apiData;

  // Show loading (scoped to this container)
  showLoading(container);

  try {
    // Generate basic kundli data first
    await generateKundli(apiData);

    // Hide loading and show results
    hideLoading(container);
    showResults(container);

    // Load basic tab data
    await loadTabData("basic");
  } catch (error) {
    console.error("Error generating kundli:", error);
    showError(error.message, container);
  }
}

// Format date for API
function formatDate(dateString) {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

// Generate basic kundli data using AJAX
async function generateKundli(data) {
  return new Promise((resolve, reject) => {
    jQuery.ajax({
      url: jyotisham_ajax.ajax_url,
      type: 'POST',
      data: {
        action: 'jyotisham_generate_kundli',
        ...data,
        nonce: jyotisham_ajax.nonce
      },
      success: function(response) {
        if (response.success) {
          cachedData.basic = response.data;
          resolve(response.data);
        } else {
          reject(new Error(response.data));
        }
      },
      error: function(xhr, status, error) {
        reject(new Error('Network error: ' + error));
      }
    });
  });
}

// Show loading indicator (scoped to container)
function showLoading(container) {
  if (!container) container = document.querySelector(".jyotisham-kundli-container");
  const loading = container ? container.querySelector("[data-role='loading']") : document.getElementById("jyotisham-loading");
  const results = container ? container.querySelector("[data-role='results']") : document.getElementById("jyotisham-results");
  if (loading) loading.classList.remove("jyotisham-hidden");
  if (results) results.classList.add("jyotisham-hidden");
}

// Hide loading indicator (scoped to container)
function hideLoading(container) {
  if (!container) container = document.querySelector(".jyotisham-kundli-container");
  const loading = container ? container.querySelector("[data-role='loading']") : document.getElementById("jyotisham-loading");
  if (loading) loading.classList.add("jyotisham-hidden");
}

// Show results (scoped to container)
function showResults(container) {
  if (!container) container = document.querySelector(".jyotisham-kundli-container");
  const results = container ? container.querySelector("[data-role='results']") : document.getElementById("jyotisham-results");
  if (results) results.classList.remove("jyotisham-hidden");
}

// Show error message (scoped to container)
function showError(errorMessage, container) {
  if (!container) container = document.querySelector(".jyotisham-kundli-container");
  hideLoading(container);
  const errorContainer = container ? container.querySelector("[data-role='results']") : document.getElementById("jyotisham-results");
  if (!errorContainer) return;

  errorContainer.innerHTML = `
    <div class="jyotisham-card jyotisham-error">
      <div class="jyotisham-error-content">
        <div class="jyotisham-error-icon">❌</div>
        <div class="jyotisham-error-message">
          <h3>Error</h3>
          <p>${errorMessage}</p>
          <div class="jyotisham-error-actions">
            <button onclick="location.reload()" class="jyotisham-retry-btn">Try Again</button>
            <button onclick="this.closest('[data-role=results]').classList.add('jyotisham-hidden')" class="jyotisham-close-btn">Close</button>
          </div>
        </div>
      </div>
    </div>
  `;

  errorContainer.classList.remove("jyotisham-hidden");
}

// Handle tab clicks (scoped to Kundli container)
async function handleTabClick(e) {
  const container = e.target.closest(".jyotisham-kundli-container");
  if (!container) return;

  const tabName = e.target.dataset.tab;

  if (!tabName) {
    console.error("No tab name found in dataset");
    return;
  }

  // Update active tab (only within this container)
  container.querySelectorAll(".jyotisham-tab-btn").forEach((btn) => btn.classList.remove("jyotisham-active"));
  e.target.classList.add("jyotisham-active");

  // Smooth scroll to active tab (mobile only)
  if (window.innerWidth <= 768) {
    const tabNavigation = container.querySelector(".jyotisham-tab-navigation");
    if (tabNavigation) {
      e.target.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }

  // Update active pane (only within this container)
  container.querySelectorAll(".jyotisham-tab-pane").forEach((pane) => pane.classList.remove("jyotisham-active"));

  const tabPane = container.querySelector(`#jyotisham-${tabName}`) || document.getElementById(`jyotisham-${tabName}`);
  if (tabPane) {
    tabPane.classList.add("jyotisham-active");
  } else {
    console.error(`Tab pane with ID 'jyotisham-${tabName}' not found`);
    return;
  }

  // Special handling for chart tab - use chart-specific loading
  if (tabName === 'chart') {
    // Load default chart (North style + D1 division) if not already loaded
    if (!cachedData[tabName]) {
      loadChartData('north', 'd1');
    }
    return; // Don't call loadTabData for chart
  }

  // Load tab data if not cached (for all other tabs)
  if (!cachedData[tabName]) {
    showTabShimmer(tabName);
    await loadTabData(tabName);
  } else {
    displayTabData(tabName, cachedData[tabName]);
    setTimeout(() => {
      enhanceTableScrolling();
      fixMobileOverflow();
    }, 100);
  }
}

// Handle chart style clicks (scoped to Kundli container)
function handleStyleClick(e) {
  const container = e.target.closest(".jyotisham-kundli-container");
  if (!container) return;
  container.querySelectorAll(".jyotisham-style-btn").forEach((btn) => btn.classList.remove("jyotisham-active"));
  e.target.classList.add("jyotisham-active");

  // Reload chart with new style
  loadChartData(e.target.dataset.style, getCurrentDivision(container));
}

// Handle chart division clicks (scoped to Kundli container)
function handleDivisionClick(e) {
  const container = e.target.closest(".jyotisham-kundli-container");
  if (!container) return;
  container.querySelectorAll(".jyotisham-division-btn").forEach((btn) => btn.classList.remove("jyotisham-active"));
  e.target.classList.add("jyotisham-active");

  // Reload chart with new division
  loadChartData(getCurrentStyle(container), e.target.dataset.division);
}

// Get current chart style (scoped to container)
function getCurrentStyle(container) {
  if (!container) container = document.querySelector(".jyotisham-kundli-container");
  const activeStyle = container ? container.querySelector(".jyotisham-style-btn.jyotisham-active") : document.querySelector(".jyotisham-style-btn.jyotisham-active");
  return activeStyle ? activeStyle.dataset.style : "north";
}

// Get current chart division (scoped to container)
function getCurrentDivision(container) {
  if (!container) container = document.querySelector(".jyotisham-kundli-container");
  const activeDivision = container ? container.querySelector(".jyotisham-division-btn.jyotisham-active") : document.querySelector(".jyotisham-division-btn.jyotisham-active");
  return activeDivision ? activeDivision.dataset.division : "d1";
}

// Load tab data using AJAX
async function loadTabData(tabName) {
  try {
    let data;

    if (tabName === "basic") {
      data = cachedData.basic;
    } else {
      data = await fetchTabData(tabName);
      cachedData[tabName] = data;
    }

    displayTabData(tabName, data);

    setTimeout(() => {
      enhanceTableScrolling();
      fixMobileOverflow();
    }, 100);
  } catch (error) {
    console.error(`Error loading ${tabName} data:`, error);
    showTabError(tabName, error.message);
  }
}

// Fetch tab data using AJAX
async function fetchTabData(tabName) {
  return new Promise((resolve, reject) => {
    jQuery.ajax({
      url: jyotisham_ajax.ajax_url,
      type: 'POST',
      data: {
        action: 'jyotisham_get_tab_data',
        tab: tabName,
        ...currentData,
        nonce: jyotisham_ajax.nonce
      },
      success: function(response) {
        if (response.success) {
          resolve(response.data);
        } else {
          reject(new Error(response.data));
        }
      },
      error: function(xhr, status, error) {
        reject(new Error('Network error: ' + error));
      }
    });
  });
}

// Load chart data using AJAX
async function loadChartData(style, division) {
  try {
    showTabShimmer("chart");
    
    const data = await fetchChartData(style, division);
    
    displayChartData(data, document.getElementById("jyotisham-chartContent"));
  } catch (error) {
    console.error("Error loading chart data:", error);
    showTabError("chart", error.message);
  }
}

// Fetch chart data using AJAX
async function fetchChartData(style, division) {
  return new Promise((resolve, reject) => {
    jQuery.ajax({
      url: jyotisham_ajax.ajax_url,
      type: 'POST',
      data: {
        action: 'jyotisham_get_chart_data',
        style: style,
        division: division,
        ...currentData,
        nonce: jyotisham_ajax.nonce
      },
      success: function(response) {
        if (response.success) {
          resolve(response.data);
        } else {
          reject(new Error(response.data));
        }
      },
      error: function(xhr, status, error) {
        reject(new Error('Network error: ' + error));
      }
    });
  });
}

// Show shimmer loader for tab content
function showTabShimmer(tabName) {
  const contentDiv = document.getElementById(`jyotisham-${tabName}Content`);
  if (!contentDiv) return;

  let shimmerHTML = "";

  switch (tabName) {
    case "basic":
      shimmerHTML = `
        <div class="jyotisham-content">
          <div class="jyotisham-shimmer jyotisham-shimmer-card">
            <div class="jyotisham-shimmer-line long"></div>
            <div class="jyotisham-shimmer-line medium"></div>
            <div class="jyotisham-shimmer-line short"></div>
          </div>
          <div class="jyotisham-shimmer jyotisham-shimmer-card">
            <div class="jyotisham-shimmer-line long"></div>
            <div class="jyotisham-shimmer-line medium"></div>
            <div class="jyotisham-shimmer-line short"></div>
          </div>
          <div class="jyotisham-shimmer jyotisham-shimmer-card">
            <div class="jyotisham-shimmer-line long"></div>
            <div class="jyotisham-shimmer-line medium"></div>
            <div class="jyotisham-shimmer-line short"></div>
          </div>
        </div>
      `;
      break;
    case "chart":
      shimmerHTML = `
        <div class="jyotisham-content">
          <div class="jyotisham-shimmer jyotisham-shimmer-chart"></div>
        </div>
      `;
      break;
    case "planetary":
      shimmerHTML = `
        <div class="jyotisham-content">
          <div class="jyotisham-shimmer-table">
            <div class="jyotisham-shimmer-table-header"></div>
            <div class="jyotisham-shimmer-table-row">
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
            </div>
            <div class="jyotisham-shimmer-table-row">
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
            </div>
            <div class="jyotisham-shimmer-table-row">
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
            </div>
            <div class="jyotisham-shimmer-table-row">
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
            </div>
            <div class="jyotisham-shimmer-table-row">
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
            </div>
          </div>
          <div class="jyotisham-shimmer jyotisham-shimmer-card">
            <div class="jyotisham-shimmer-line long"></div>
            <div class="jyotisham-shimmer-line medium"></div>
            <div class="jyotisham-shimmer-line short"></div>
          </div>
        </div>
      `;
      break;
    case "dashas":
      shimmerHTML = `
        <div class="jyotisham-content">
          <div class="jyotisham-shimmer jyotisham-shimmer-card">
            <div class="jyotisham-shimmer-line long"></div>
            <div class="jyotisham-shimmer-line medium"></div>
            <div class="jyotisham-shimmer-line short"></div>
          </div>
          <div class="jyotisham-shimmer-table">
            <div class="jyotisham-shimmer-table-header"></div>
            <div class="jyotisham-shimmer-table-row">
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
            </div>
            <div class="jyotisham-shimmer-table-row">
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
            </div>
            <div class="jyotisham-shimmer-table-row">
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
            </div>
            <div class="jyotisham-shimmer-table-row">
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
            </div>
          </div>
        </div>
      `;
      break;
    case "ashtakvarga":
      shimmerHTML = `
        <div class="jyotisham-content">
          <div class="jyotisham-shimmer-table">
            <div class="jyotisham-shimmer-table-header"></div>
            <div class="jyotisham-shimmer-table-row">
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
            </div>
            <div class="jyotisham-shimmer-table-row">
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
            </div>
            <div class="jyotisham-shimmer-table-row">
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
            </div>
            <div class="jyotisham-shimmer-table-row">
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
            </div>
            <div class="jyotisham-shimmer-table-row">
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
            </div>
          </div>
        </div>
      `;
      break;
    case "kp":
      shimmerHTML = `
        <div class="jyotisham-content">
          <div class="jyotisham-shimmer-table">
            <div class="jyotisham-shimmer-table-header"></div>
            <div class="jyotisham-shimmer-table-row">
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
            </div>
            <div class="jyotisham-shimmer-table-row">
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
            </div>
            <div class="jyotisham-shimmer-table-row">
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
            </div>
            <div class="jyotisham-shimmer-table-row">
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
            </div>
            <div class="jyotisham-shimmer-table-row">
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
            </div>
          </div>
        </div>
      `;
      break;
    case "ascendant":
      shimmerHTML = `
        <div class="jyotisham-content">
          <div class="jyotisham-shimmer jyotisham-shimmer-card">
            <div class="jyotisham-shimmer-line long"></div>
            <div class="jyotisham-shimmer-line medium"></div>
            <div class="jyotisham-shimmer-line short"></div>
          </div>
          <div class="jyotisham-shimmer jyotisham-shimmer-card">
            <div class="jyotisham-shimmer-line long"></div>
            <div class="jyotisham-shimmer-line medium"></div>
          </div>
          <div class="jyotisham-shimmer jyotisham-shimmer-card">
            <div class="jyotisham-shimmer-line long"></div>
            <div class="jyotisham-shimmer-line medium"></div>
            <div class="jyotisham-shimmer-line short"></div>
          </div>
        </div>
      `;
      break;
    case "dosh":
      shimmerHTML = `
        <div class="jyotisham-content">
          <div class="jyotisham-shimmer jyotisham-shimmer-card">
            <div class="jyotisham-shimmer-line long"></div>
            <div class="jyotisham-shimmer-line medium"></div>
            <div class="jyotisham-shimmer-line short"></div>
          </div>
          <div class="jyotisham-shimmer jyotisham-shimmer-card">
            <div class="jyotisham-shimmer-line long"></div>
            <div class="jyotisham-shimmer-line medium"></div>
            <div class="jyotisham-shimmer-line short"></div>
          </div>
          <div class="jyotisham-shimmer jyotisham-shimmer-card">
            <div class="jyotisham-shimmer-line long"></div>
            <div class="jyotisham-shimmer-line medium"></div>
          </div>
        </div>
      `;
      break;
    case "rudraksh":
      shimmerHTML = `
        <div class="jyotisham-content">
          <div class="jyotisham-shimmer-table">
            <div class="jyotisham-shimmer-table-header"></div>
            <div class="jyotisham-shimmer-table-row">
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
            </div>
            <div class="jyotisham-shimmer-table-row">
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
            </div>
            <div class="jyotisham-shimmer-table-row">
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
              <div class="jyotisham-shimmer-table-cell"></div>
            </div>
          </div>
          <div class="jyotisham-shimmer jyotisham-shimmer-card">
            <div class="jyotisham-shimmer-line long"></div>
            <div class="jyotisham-shimmer-line medium"></div>
          </div>
        </div>
      `;
      break;
    case "gem":
      shimmerHTML = `
        <div class="jyotisham-content">
          <div class="jyotisham-shimmer jyotisham-shimmer-card">
            <div class="jyotisham-shimmer-line long"></div>
            <div class="jyotisham-shimmer-line medium"></div>
            <div class="jyotisham-shimmer-line short"></div>
          </div>
          <div class="jyotisham-shimmer jyotisham-shimmer-card">
            <div class="jyotisham-shimmer-line long"></div>
            <div class="jyotisham-shimmer-line medium"></div>
            <div class="jyotisham-shimmer-line short"></div>
          </div>
          <div class="jyotisham-shimmer jyotisham-shimmer-card">
            <div class="jyotisham-shimmer-line long"></div>
            <div class="jyotisham-shimmer-line medium"></div>
          </div>
        </div>
      `;
      break;
    default:
      shimmerHTML = `
        <div class="jyotisham-content">
          <div class="jyotisham-shimmer jyotisham-shimmer-card">
            <div class="jyotisham-shimmer-line long"></div>
            <div class="jyotisham-shimmer-line medium"></div>
            <div class="jyotisham-shimmer-line short"></div>
          </div>
        </div>
      `;
  }

  contentDiv.innerHTML = shimmerHTML;
}

// Show tab error
function showTabError(tabName, errorMessage) {
  const contentDiv = document.getElementById(`jyotisham-${tabName}Content`);
  if (!contentDiv) return;

  contentDiv.innerHTML = `
    <div class="jyotisham-card jyotisham-error">
      <div class="jyotisham-error-content">
        <div class="jyotisham-error-icon">❌</div>
        <div class="jyotisham-error-message">
          <h4>Error Loading ${tabName.charAt(0).toUpperCase() + tabName.slice(1)} Data</h4>
          <p>${errorMessage}</p>
          <button onclick="loadTabData('${tabName}')" class="jyotisham-retry-btn">Retry</button>
        </div>
      </div>
    </div>
  `;
}

// Display tab data (using the same functions from original code)
function displayTabData(tabName, data) {
  const contentDiv = document.getElementById(`jyotisham-${tabName}Content`);
  if (!contentDiv) return;

  switch (tabName) {
    case "basic":
      displayBasicData(data, contentDiv);
      break;
    case "chart":
      displayChartData(data, contentDiv);
      break;
    case "planetary":
      displayPlanetaryData(data, contentDiv);
      break;
    case "dashas":
      displayDashasData(data, contentDiv);
      break;
    case "ashtakvarga":
      displayAshtakvargaData(data, contentDiv);
      break;
    case "ascendant":
      displayAscendantData(data, contentDiv);
      break;
    case "kp":
      displayKPData(data, contentDiv);
      break;
    case "dosh":
      displayDoshData(data, contentDiv);
      break;
    case "rudraksh":
      displayRudrakshData(data, contentDiv);
      break;
    case "gem":
      displayGemData(data, contentDiv);
      break;
  }
}

// Display functions (simplified versions from original code)
function displayBasicData(data, container) {
  if (data.status !== 200) {
    container.innerHTML = '<div class="jyotisham-card"><p>Error loading basic data</p></div>';
    return;
  }

  const response = data.response;
  container.innerHTML = `
    <div class="jyotisham-content">
      <div class="jyotisham-card">
        <h3>Personal Information</h3>
        ${wrapTableInContainer(`
        <table class="jyotisham-data-table">
          <tr><td><strong>Name</strong></td><td>${currentData.name}</td></tr>
          <tr><td><strong>Date of Birth</strong></td><td>${currentData.date}</td></tr>
          <tr><td><strong>Time of Birth</strong></td><td>${currentData.time}</td></tr>
          <tr><td><strong>Place of Birth</strong></td><td>${document.getElementById("jyotisham-placeOfBirth").value}</td></tr>
        </table>
        `)}
      </div>
      
      <div class="jyotisham-card">
        <h3>Astrological Details</h3>
        ${wrapTableInContainer(`
        <table class="jyotisham-data-table">
          <tr><td><strong>Ascendant Sign</strong></td><td>${response.ascendant_sign}</td></tr>
          <tr><td><strong>Ascendant Nakshatra</strong></td><td>${response.ascendant_nakshatra}</td></tr>
          <tr><td><strong>Rasi</strong></td><td>${response.rasi}</td></tr>
          <tr><td><strong>Rasi Lord</strong></td><td>${response.rasi_lord}</td></tr>
          <tr><td><strong>Nakshatra</strong></td><td>${response.nakshatra}</td></tr>
          <tr><td><strong>Nakshatra Lord</strong></td><td>${response.nakshatra_lord}</td></tr>
          <tr><td><strong>Nakshatra Pada</strong></td><td>${response.nakshatra_pada}</td></tr>
          <tr><td><strong>Sun Sign</strong></td><td>${response.sun_sign}</td></tr>
        </table>
        `)}
      </div>
      
      <div class="jyotisham-card">
        <h3>Vedic Details</h3>
        ${wrapTableInContainer(`
        <table class="jyotisham-data-table">
          <tr><td><strong>Gana</strong></td><td>${response.gana}</td></tr>
          <tr><td><strong>Yoni</strong></td><td>${response.yoni}</td></tr>
          <tr><td><strong>Vasya</strong></td><td>${response.vasya}</td></tr>
          <tr><td><strong>Nadi</strong></td><td>${response.nadi}</td></tr>
          <tr><td><strong>Varna</strong></td><td>${response.varna}</td></tr>
          <tr><td><strong>Paya</strong></td><td>${response.paya}</td></tr>
          <tr><td><strong>Tatva</strong></td><td>${response.tatva}</td></tr>
        </table>
        `)}
      </div>
      
      <div class="jyotisham-card">
        <h3>Gemstone Recommendations</h3>
        ${wrapTableInContainer(`
        <table class="jyotisham-data-table">
          <tr><td><strong>Life Stone</strong></td><td>${response.life_stone}</td></tr>
          <tr><td><strong>Lucky Stone</strong></td><td>${response.lucky_stone}</td></tr>
          <tr><td><strong>Fortune Stone</strong></td><td>${response.fortune_stone}</td></tr>
        </table>
        `)}
      </div>
      
      <div class="jyotisham-card">
        <h3>Panchang Details</h3>
        <table class="jyotisham-data-table">
          <tr><td><strong>Tithi</strong></td><td>${response.tithi}</td></tr>
          <tr><td><strong>Karana</strong></td><td>${response.karana}</td></tr>
          <tr><td><strong>Yoga</strong></td><td>${response.yoga}</td></tr>
          <tr><td><strong>Name Start</strong></td><td>${response.name_start}</td></tr>
        </table>
      </div>
    </div>
  `;
}

function displayChartData(data, container) {
  if (typeof data === "string") {
    container.innerHTML = `
      <div class="jyotisham-chart-container">
        <div class="jyotisham-chart-svg">${data}</div>
      </div>
    `;
    return;
  }

  if (data.status && data.status !== 200) {
    container.innerHTML = '<div class="jyotisham-card"><p>Error loading chart data. Status: ' + data.status + "</p></div>";
    return;
  }

  const svgContent = data.response || data;

  if (!svgContent || typeof svgContent !== "string") {
    container.innerHTML = '<div class="jyotisham-card"><p>Invalid chart data received</p></div>';
    return;
  }

  container.innerHTML = `
    <div class="jyotisham-chart-container">
      <div class="jyotisham-chart-svg">${svgContent}</div>
    </div>
  `;
}

// Complete display functions for all tabs
function displayPlanetaryData(data, container) {
  if (data.status !== 200) {
    container.innerHTML = '<div class="jyotisham-card"><p>Error loading planetary data</p></div>';
    return;
  }

  const response = data.response;
  let html = '<div class="jyotisham-content">';

  // Display planets in a compact table format
  html += `
    <div class="jyotisham-card">
      <h3>Planetary Positions</h3>
      <div class="jyotisham-table-container">
      <table class="jyotisham-data-table">
        <thead>
          <tr>
            <th>Planet</th>
            <th>Zodiac</th>
            <th>House</th>
            <th>Nakshatra</th>
            <th>Nakshatra Lord</th>
            <th>Pada</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
  `;

  for (let i = 0; i < 10; i++) {
    const planet = response[i];
    if (planet) {
      html += `
        <tr>
          <td><strong>${planet.full_name}</strong><br><small>${planet.name}</small></td>
          <td>${planet.zodiac}</td>
          <td>${planet.house}</td>
          <td>${planet.nakshatra}</td>
          <td>${planet.nakshatra_lord}</td>
          <td>${planet.nakshatra_pada}</td>
          <td>${planet.is_combust === "Yes" ? "Combust" : "Normal"}</td>
        </tr>
      `;
    }
  }

  html += `
        </tbody>
      </table>
      </div>
    </div>
  `;

  // Display lucky details in compact format
  if (response.lucky_gem) {
    html += `
      <div class="jyotisham-card">
        <h3>Lucky Details</h3>
        <div class="jyotisham-table-container">
        <table class="jyotisham-data-table">
          <tr><td><strong>Lucky Gem</strong></td><td>${response.lucky_gem.join(", ")}</td></tr>
          <tr><td><strong>Lucky Number</strong></td><td>${response.lucky_num.join(", ")}</td></tr>
          <tr><td><strong>Lucky Colors</strong></td><td>${response.lucky_colors.join(", ")}</td></tr>
          <tr><td><strong>Lucky Letters</strong></td><td>${response.lucky_letters.join(", ")}</td></tr>
        </table>
        </div>
      </div>
    `;
  }

  html += "</div>";
  container.innerHTML = html;
}

function displayDashasData(data, container) {
  if (data.status !== 200) {
    container.innerHTML = '<div class="jyotisham-card"><p>Error loading dashas data</p></div>';
    return;
  }

  const response = data.response;
  let html = '<div class="jyotisham-content">';

  // Current dashas
  html += `
    <div class="jyotisham-card">
      <h3>Current Dashas</h3>
      <p><strong>Mahadasha:</strong> <span class="jyotisham-value">${response.order_of_dashas.major.name}</span></p>
      <p><strong>Start:</strong> <span class="jyotisham-value">${response.order_of_dashas.major.start}</span></p>
      <p><strong>End:</strong> <span class="jyotisham-value">${response.order_of_dashas.major.end}</span></p>
      <br>
      <p><strong>Antardasha:</strong> <span class="jyotisham-value">${response.order_of_dashas.minor.name}</span></p>
      <p><strong>Start:</strong> <span class="jyotisham-value">${response.order_of_dashas.minor.start}</span></p>
      <p><strong>End:</strong> <span class="jyotisham-value">${response.order_of_dashas.minor.end}</span></p>
    </div>
  `;

  // Mahadasha list
  html += `
    <div class="jyotisham-card">
      <h3>Mahadasha Periods</h3>
      <div class="jyotisham-table-container">
      <table class="jyotisham-data-table">
        <thead>
          <tr>
            <th>Planet</th>
            <th>Start Date</th>
            <th>End Date</th>
          </tr>
        </thead>
        <tbody>
  `;

  response.mahadasha.forEach((dasha) => {
    html += `
      <tr>
        <td>${dasha.name}</td>
        <td>${dasha.start}</td>
        <td>${dasha.end}</td>
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>
      </div>
    </div>
  `;

  html += "</div>";
  container.innerHTML = html;
}

function displayAshtakvargaData(data, container) {
  if (data.status !== 200) {
    container.innerHTML = '<div class="jyotisham-card"><p>Error loading ashtakvarga data</p></div>';
    return;
  }

  const response = data.response;
  let html = '<div class="jyotisham-content">';

  // Ashtakvarga table
  html += `
    <div class="jyotisham-card">
      <h3>Ashtakvarga Points</h3>
      <div class="jyotisham-table-container">
      <table class="jyotisham-data-table">
        <thead>
          <tr>
            <th>House</th>
            <th>Total Points</th>
            ${response.ashtakvarga_order.map((planet) => `<th>${planet}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
  `;

  for (let i = 0; i < 12; i++) {
    html += `
      <tr>
        <td>${i + 1}</td>
        <td><strong>${response.ashtakvarga_total[i]}</strong></td>
        ${response.ashtakvarga_points.map((planetPoints) => `<td>${planetPoints[i]}</td>`).join("")}
      </tr>
    `;
  }

  html += `
        </tbody>
      </table>
      </div>
    </div>
  `;

  html += "</div>";
  container.innerHTML = html;
}

function displayAscendantData(data, container) {
  if (data.status !== 200) {
    container.innerHTML = '<div class="jyotisham-card"><p>Error loading ascendant data</p></div>';
    return;
  }

  const response = data.response[0];
  container.innerHTML = `
    <div class="jyotisham-content">
      <div class="jyotisham-card">
        <h3>${response.ascendant} Ascendant Details</h3>
        <div class="jyotisham-table-container">
        <table class="jyotisham-data-table">
          <tr><td><strong>Ascendant Lord</strong></td><td>${response.ascendant_lord}</td></tr>
          <tr><td><strong>Location</strong></td><td>${response.ascendant_lord_location}</td></tr>
          <tr><td><strong>House Location</strong></td><td>${response.ascendant_lord_house_location}</td></tr>
          <tr><td><strong>Strength</strong></td><td>${response.ascendant_lord_strength}</td></tr>
          <tr><td><strong>Symbol</strong></td><td>${response.symbol}</td></tr>
          <tr><td><strong>Lucky Gem</strong></td><td>${response.lucky_gem}</td></tr>
          <tr><td><strong>Day for Fasting</strong></td><td>${response.day_for_fasting}</td></tr>
        </table>
        </div>
      </div>
      
      <div class="jyotisham-card">
        <h3>Zodiac Characteristics</h3>
        <p>${response.zodiac_characteristics}</p>
      </div>
      
      <div class="jyotisham-card">
        <h3>Predictions</h3>
        <div style="margin-bottom: 16px;">
          <h4 style="margin-bottom: 8px; color: #374151;">General Prediction</h4>
          <p>${response.general_prediction}</p>
        </div>
        <div>
          <h4 style="margin-bottom: 8px; color: #374151;">Personalized Prediction</h4>
          <p>${response.personalised_prediction}</p>
        </div>
      </div>
      
      <div class="jyotisham-card">
        <h3>Qualities</h3>
        <div class="jyotisham-table-container">
        <table class="jyotisham-data-table">
          <tr><td><strong>Flagship Qualities</strong></td><td>${response.flagship_qualities}</td></tr>
          <tr><td><strong>Good Qualities</strong></td><td>${response.good_qualities}</td></tr>
          <tr><td><strong>Bad Qualities</strong></td><td>${response.bad_qualities}</td></tr>
        </table>
        </div>
      </div>
      
      <div class="jyotisham-card">
        <h3>Gayatri Mantra</h3>
        <p style="font-style: italic; text-align: center; padding: 20px; background: #f8fafc; border-radius: 8px; color: #4a5568;">
          ${response.gayatri_mantra}
        </p>
      </div>
    </div>
  `;
}

function displayKPData(data, container) {
  if (data.status !== 200) {
    container.innerHTML = '<div class="jyotisham-card"><p>Error loading KP data</p></div>';
    return;
  }

  const response = data.response;
  let html = '<div class="jyotisham-content">';

  html += `
    <div class="jyotisham-card">
      <h3>KP Planetary Positions</h3>
      <div class="jyotisham-table-container">
      <table class="jyotisham-data-table">
        <thead>
          <tr>
            <th>Planet</th>
            <th>Pseudo Rasi</th>
            <th>Pseudo Rasi Lord</th>
            <th>Pseudo Nakshatra</th>
            <th>Pseudo Nakshatra Lord</th>
            <th>Pada</th>
            <th>Sub Lord</th>
            <th>Sub Sub Lord</th>
          </tr>
        </thead>
        <tbody>
  `;

  for (let i = 0; i < 10; i++) {
    const planet = response[i];
    if (planet) {
      html += `
        <tr>
          <td><strong>${planet.full_name}</strong><br><small>${planet.name}</small></td>
          <td>${planet.pseudo_rasi}</td>
          <td>${planet.pseudo_rasi_lord}</td>
          <td>${planet.pseudo_nakshatra}</td>
          <td>${planet.pseudo_nakshatra_lord}</td>
          <td>${planet.pseudo_nakshatra_pada}</td>
          <td>${planet.sub_lord}</td>
          <td>${planet.sub_sub_lord}</td>
        </tr>
      `;
    }
  }

  html += `
        </tbody>
      </table>
      </div>
    </div>
  `;

  html += "</div>";
  container.innerHTML = html;
}

function displayDoshData(data, container) {
  let html = '<div class="jyotisham-content">';

  // Mangal Dosh
  if (data.mangalDosh && data.mangalDosh.status === 200) {
    const mangal = data.mangalDosh.response;
    html += `
      <div class="jyotisham-card">
        <h3>Mangal Dosh</h3>
        <div class="jyotisham-table-container">
        <table class="jyotisham-data-table">
          <tr><td><strong>Present</strong></td><td>${mangal.is_dosha_present ? "Yes" : "No"}</td></tr>
          <tr><td><strong>Score</strong></td><td>${mangal.score}%</td></tr>
          <tr><td><strong>Type</strong></td><td>${mangal.is_anshik ? "Anshik" : "Full"}</td></tr>
          ${mangal.factors ? `<tr><td><strong>Factors</strong></td><td>${Object.values(mangal.factors).join(", ")}</td></tr>` : ""}
        </table>
        </div>
        <div style="margin-top: 16px;">
          <h4 style="margin-bottom: 8px; color: #374151;">Analysis</h4>
          <p>${mangal.bot_response}</p>
        </div>
      </div>
    `;
  }

  // Kaal Sarp Dosh
  if (data.kaalSarpDosh && data.kaalSarpDosh.status === 200) {
    const kaalSarp = data.kaalSarpDosh.response;
    html += `
      <div class="jyotisham-card">
        <h3>Kaal Sarp Dosh</h3>
        <div class="jyotisham-table-container">
        <table class="jyotisham-data-table">
          <tr><td><strong>Present</strong></td><td>${kaalSarp.is_dosha_present ? "Yes" : "No"}</td></tr>
        </table>
        </div>
        <div style="margin-top: 16px;">
          <h4 style="margin-bottom: 8px; color: #374151;">Analysis</h4>
          <p>${kaalSarp.bot_response}</p>
        </div>
        ${kaalSarp.remedies ? `
        <div class="jyotisham-remedies-section">
          <h4 class="jyotisham-remedies-title">Remedies</h4>
          <div class="jyotisham-remedies-list">
            ${kaalSarp.remedies.map((remedy) => `<div class="jyotisham-remedy-item">${remedy}</div>`).join("")}
          </div>
        </div>
        ` : ""}
      </div>
    `;
  }

  // Manglik Dosh
  if (data.manglikDosh && data.manglikDosh.status === 200) {
    const manglik = data.manglikDosh.response;
    html += `
      <div class="jyotisham-card">
        <h3>Manglik Dosh</h3>
        <div class="jyotisham-table-container">
        <table class="jyotisham-data-table">
          <tr><td><strong>Score</strong></td><td>${manglik.score}%</td></tr>
          <tr><td><strong>By Mars</strong></td><td>${manglik.manglik_by_mars ? "Yes" : "No"}</td></tr>
          <tr><td><strong>By Saturn</strong></td><td>${manglik.manglik_by_saturn ? "Yes" : "No"}</td></tr>
          <tr><td><strong>By Rahu-Ketu</strong></td><td>${manglik.manglik_by_rahuketu ? "Yes" : "No"}</td></tr>
        </table>
        </div>
        <div style="margin-top: 16px;">
          <h4 style="margin-bottom: 8px; color: #374151;">Analysis</h4>
          <p>${manglik.bot_response}</p>
        </div>
        ${manglik.factors ? `
        <div style="margin-top: 16px;">
          <h4 style="margin-bottom: 8px; color: #374151;">Factors</h4>
          <ul style="margin-left: 20px;">
            ${manglik.factors.map((factor) => `<li>${factor}</li>`).join("")}
          </ul>
        </div>
        ` : ""}
      </div>
    `;
  }

  // Pitra Dosh
  if (data.pitraDosh && data.pitraDosh.status === 200) {
    const pitra = data.pitraDosh.response;
    html += `
      <div class="jyotisham-card">
        <h3>Pitra Dosh</h3>
        <div class="jyotisham-table-container">
        <table class="jyotisham-data-table">
          <tr><td><strong>Present</strong></td><td>${pitra.is_dosha_present ? "Yes" : "No"}</td></tr>
        </table>
        </div>
        <div style="margin-top: 16px;">
          <h4 style="margin-bottom: 8px; color: #374151;">Analysis</h4>
          <p>${pitra.bot_response}</p>
        </div>
        ${pitra.effects ? `
        <div class="jyotisham-effects-section">
          <h4 class="jyotisham-effects-title">Effects</h4>
          <div class="jyotisham-effects-list">
            ${pitra.effects.map((effect) => `<div class="jyotisham-effect-item">${effect}</div>`).join("")}
          </div>
        </div>
        ` : ""}
        ${pitra.remedies ? `
        <div class="jyotisham-remedies-section">
          <h4 class="jyotisham-remedies-title">Remedies</h4>
          <div class="jyotisham-remedies-list">
            ${pitra.remedies.map((remedy) => `<div class="jyotisham-remedy-item">${remedy}</div>`).join("")}
          </div>
        </div>
        ` : ""}
      </div>
    `;
  }

  html += "</div>";
  container.innerHTML = html;
}

function displayRudrakshData(data, container) {
  if (data.status !== 200) {
    container.innerHTML = '<div class="jyotisham-card"><p>Error loading rudraksh data</p></div>';
    return;
  }

  const response = data.response;
  container.innerHTML = `
    <div class="jyotisham-content">
      <div class="jyotisham-card">
        <h3>Recommended Rudraksh</h3>
        <div class="jyotisham-table-container">
        <table class="jyotisham-data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Qualities</th>
              <th>Mantra</th>
            </tr>
          </thead>
          <tbody>
            ${response.rudraksh.map((rudraksh, index) => `
            <tr>
              <td><strong>${response.name[index]}</strong></td>
              <td>${rudraksh}</td>
              <td>${response.qualities[index]}</td>
              <td>${response.mantra[index]}</td>
            </tr>
          `).join("")}
          </tbody>
        </table>
        </div>
      </div>
      
      <div class="jyotisham-card">
        <h3>Wearing Instructions</h3>
        <div class="jyotisham-table-container">
        <table class="jyotisham-data-table">
          <tr><td><strong>How to Wear</strong></td><td>${response.how_to_wear}</td></tr>
          <tr><td><strong>Time to Wear</strong></td><td>${response.time_to_wear}</td></tr>
          <tr><td><strong>Purification</strong></td><td>${response.purification}</td></tr>
        </table>
        </div>
      </div>
      
      <div class="jyotisham-card">
        <h3>Personalized Response</h3>
        <p>${response.personalized_response}</p>
      </div>
    </div>
  `;
}

function displayGemData(data, container) {
  if (data.status !== 200) {
    container.innerHTML = '<div class="jyotisham-card"><p>Error loading gem data</p></div>';
    return;
  }

  const response = data.response;
  container.innerHTML = `
    <div class="jyotisham-content">
      <div class="jyotisham-card">
        <h3>${response.name} (${response.other_name})</h3>
        <div class="jyotisham-table-container">
        <table class="jyotisham-data-table">
          <tr><td><strong>Color</strong></td><td>${response.color}</td></tr>
          <tr><td><strong>Planet</strong></td><td>${response.planet}</td></tr>
          <tr><td><strong>Description</strong></td><td>${response.description}</td></tr>
        </table>
        </div>
      </div>
      
      <div class="jyotisham-card">
        <h3>Benefits</h3>
        <div class="jyotisham-benefits-section">
          <h4 class="jyotisham-benefits-title">Good Results</h4>
          <div class="jyotisham-benefits-list">
            ${response.good_results.map((result) => `<div class="jyotisham-benefit-item jyotisham-positive">${result}</div>`).join("")}
          </div>
        </div>
        <div class="jyotisham-benefits-section">
          <h4 class="jyotisham-benefits-title">Diseases Cured</h4>
          <div class="jyotisham-benefits-list">
            ${response.diseases_cure.map((disease) => `<div class="jyotisham-benefit-item jyotisham-healing">${disease}</div>`).join("")}
          </div>
        </div>
      </div>
      
      <div class="jyotisham-card">
        <h3>Wearing Instructions</h3>
        <div class="jyotisham-table-container">
        <table class="jyotisham-data-table">
          <tr><td><strong>Finger</strong></td><td>${response.finger}</td></tr>
          <tr><td><strong>Weight</strong></td><td>${response.weight}</td></tr>
          <tr><td><strong>Day</strong></td><td>${response.day}</td></tr>
          <tr><td><strong>Metal</strong></td><td>${response.metal}</td></tr>
          <tr><td><strong>Time to Wear</strong></td><td>${response.time_to_wear_short}</td></tr>
        </table>
        </div>
      </div>
      
      <div class="jyotisham-card">
        <h3>Substitutes</h3>
        <div class="jyotisham-table-container">
        <table class="jyotisham-data-table">
          <tr><td><strong>Can be replaced with</strong></td><td>${response.substitute.join(", ")}</td></tr>
          <tr><td><strong>Do not wear with</strong></td><td>${response.not_to_wear_with.join(", ")}</td></tr>
        </table>
        </div>
      </div>
      
      <div class="jyotisham-card">
        <h3>Mantra</h3>
        <p style="font-style: italic; text-align: center; padding: 20px; background: #f8fafc; border-radius: 8px; color: #4a5568;">
          ${response.mantra}
        </p>
      </div>
      
      <div class="jyotisham-card">
        <h3>Other Recommendations</h3>
        <p><strong>Life Stone:</strong> <span class="jyotisham-value">${response.life_stone}</span></p>
        <p><strong>Lucky Stone:</strong> <span class="jyotisham-value">${response.lucky_stone}</span></p>
        <p><strong>Fortune Stone:</strong> <span class="jyotisham-value">${response.fortune_stone}</span></p>
      </div>
    </div>
  `;
}

// Utility functions
function wrapTableInContainer(tableHtml) {
  return `<div class="jyotisham-table-container">${tableHtml}</div>`;
}

function enhanceTableScrolling() {
  const tableContainers = document.querySelectorAll(".jyotisham-table-container");

  tableContainers.forEach((container) => {
    container.style.overflowX = "auto";
    container.style.webkitOverflowScrolling = "touch";
  });
}

function fixMobileOverflow() {
  const containers = document.querySelectorAll(
    ".jyotisham-container, .jyotisham-results, .jyotisham-tab-content, .jyotisham-card"
  );

  containers.forEach((container) => {
    if (!container.classList.contains("jyotisham-form-container")) {
      container.style.maxWidth = "100%";
    }
    container.style.overflowX = "hidden";
    container.style.boxSizing = "border-box";
  });

  const textElements = document.querySelectorAll(
    ".jyotisham-card p, .jyotisham-card h3, .jyotisham-tab-pane h2"
  );

  textElements.forEach((element) => {
    element.style.wordWrap = "break-word";
    element.style.overflowWrap = "break-word";
    element.style.hyphens = "auto";
    element.style.maxWidth = "100%";
  });
}
