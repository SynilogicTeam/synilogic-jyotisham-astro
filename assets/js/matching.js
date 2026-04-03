// Global variables for matching generator
let currentMatchingData = {};
let cachedMatchingData = {};
let isApiCallInProgress = false;
let currentApiCall = null;
let apiCallCache = new Map();
let matchingSearchLoadingTimers = { boy: null, girl: null };

// Initialize the matching application (scoped to matching containers only)
document.addEventListener("DOMContentLoaded", function () {
    // Only initialize if at least one matching container exists
    const matchingContainers = document.querySelectorAll(".jyotisham-matching-container");
    if (!matchingContainers.length) {
        return;
    }
    
    initializeGoogleMapsMatching();
    setupMatchingEventListeners();
    fixMobileOverflow();
});

// Handle window resize to fix overflow issues
window.addEventListener("resize", function () {
    setTimeout(() => {
        fixMobileOverflow();
        setupMatchingTabSwipeSupport();
    }, 100);
});

// Initialize Google Maps autocomplete for both boy and girl
function initializeGoogleMapsMatching() {
    initializePersonMapsMatching("boy");
    initializePersonMapsMatching("girl");
}

function initializePersonMapsMatching(person) {
    const placeInput = document.getElementById(`jyotisham-${person}-placeOfBirth`);
    if (!placeInput) return;
    
    let debounceTimer;
    let autocomplete = null;
    let lastSearchTerm = "";
    let searchCount = 0;
    const maxSearchesPerSession = 10;

    // Function to clear autocomplete and dropdown
    function clearMatchingAutocomplete() {
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
            clearMatchingAutocomplete();
            lastSearchTerm = ""; // Reset last search term
            hideMatchingSearchLoading(person);
            return;
        }

        // Don't make API calls if:
        // - Same search term as before
        // - Search limit reached
        // - Empty value
        // - Input is just numbers or special characters
        if (currentValue === lastSearchTerm || 
            searchCount >= maxSearchesPerSession || 
            !currentValue ||
            /^[0-9\s\-_.,!@#$%^&*()]+$/.test(currentValue)) { // Skip if only numbers/special chars
            return;
        }

        // Show loading indicator
        showMatchingSearchLoading(person);

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
                initializeAutocompleteMatching();
            } else {
                hideMatchingSearchLoading(person);
            }
        }, debounceTime);
    }

    function initializeAutocompleteMatching() {
        if (!autocomplete && searchCount <= maxSearchesPerSession) {
            clearMatchingAutocomplete();

            autocomplete = new google.maps.places.Autocomplete(placeInput, {
                types: ["(cities)"],
                fields: ["place_id", "geometry", "name", "formatted_address"],
              
            });

            autocomplete.addListener("place_changed", function () {
                const place = autocomplete.getPlace();
                if (place && place.geometry) {
                    document.getElementById(`jyotisham-${person}-latitude`).value = place.geometry.location.lat();
                    document.getElementById(`jyotisham-${person}-longitude`).value = place.geometry.location.lng();
                    getTimezoneMatching(place.geometry.location.lat(), place.geometry.location.lng(), person);
                    hideMatchingSearchLoading(person);
                }
            });
        } else if (searchCount > maxSearchesPerSession) {
            placeInput.placeholder = "⚠️ Search limit reached. Please refresh to search again.";
            placeInput.disabled = true;
        }
    }

    placeInput.addEventListener("input", debouncedSearch);

    // Hide searching indicator on blur as a safety
    placeInput.addEventListener("blur", () => {
        hideMatchingSearchLoading(person);
    });

    placeInput.addEventListener("keydown", (e) => {
        // Clear autocomplete on backspace when input becomes too short
        if (e.key === "Backspace" && placeInput.value.length <= 2) {
            clearMatchingAutocomplete();
            lastSearchTerm = ""; // Reset search term
            hideMatchingSearchLoading(person);
        }

        // Prevent API calls for certain keys that don't change meaningful content
        if (["Tab", "Shift", "Control", "Alt", "Meta", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End", "PageUp", "PageDown"].includes(e.key)) {
            return; // Don't trigger search for navigation keys
        }

        // Prevent API calls for function keys
        if (e.key.startsWith("F") && e.key.length <= 3) {
            return; // Don't trigger search for function keys (F1, F2, etc.)
        }
    });
}

// Show loading indicator for Matching search
function showMatchingSearchLoading(person) {
    const placeInput = document.getElementById(`jyotisham-${person}-placeOfBirth`);
    if (!placeInput) return;
    
    // Add loading class to input
    placeInput.classList.add(`jyotisham-matching-${person}-search-loading`);
    
    // Add loading indicator if not exists
    let loadingIndicator = document.querySelector(`.jyotisham-matching-${person}-search-loading-indicator`);
    if (!loadingIndicator) {
        loadingIndicator = document.createElement("div");
        loadingIndicator.className = `jyotisham-matching-${person}-search-loading-indicator`;
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

    // Auto-hide if predictions don't return promptly
    clearTimeout(matchingSearchLoadingTimers[person]);
    matchingSearchLoadingTimers[person] = setTimeout(() => {
        hideMatchingSearchLoading(person);
    }, 2000);
}

// Hide loading indicator for Matching search
function hideMatchingSearchLoading(person) {
    const placeInput = document.getElementById(`jyotisham-${person}-placeOfBirth`);
    if (!placeInput) return;
    
    clearTimeout(matchingSearchLoadingTimers[person]);
    
    // Remove loading class from input
    placeInput.classList.remove(`jyotisham-matching-${person}-search-loading`);
    
    // Hide loading indicator
    const loadingIndicator = document.querySelector(`.jyotisham-matching-${person}-search-loading-indicator`);
    if (loadingIndicator) {
        loadingIndicator.style.display = "none";
    }
}

// Get timezone using WordPress AJAX
function getTimezoneMatching(lat, lng, person) {
    const data = {
        action: 'jyotisham_get_timezone',
        latitude: lat,
        longitude: lng,
        nonce: jyotisham_ajax.nonce
    };

    fetch(jyotisham_ajax.ajax_url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(data)
    })
    .then(response => response.json())
    .then(result => {
        if (result.success && result.data && result.data.timezone !== undefined) {
            const timezoneValue = result.data.timezone;
            const timezoneField = document.getElementById(`jyotisham-${person}-timezone`);
            if (timezoneField) {
                timezoneField.value = timezoneValue;
            }
        } else {
            const timezoneField = document.getElementById(`jyotisham-${person}-timezone`);
            if (timezoneField) {
                timezoneField.value = 5.5;
            }
        }
    })
    .catch(error => {
        const timezoneField = document.getElementById(`jyotisham-${person}-timezone`);
        if (timezoneField) {
            timezoneField.value = 5.5;
        }
    });
}

// Setup touch/swipe support for matching tab navigation (mobile only)
function setupMatchingTabSwipeSupport() {
    const matchingContainer = document.querySelector(".jyotisham-matching-container");
    const tabNavigation = matchingContainer ? matchingContainer.querySelector(".jyotisham-tab-navigation") : null;
    if (!tabNavigation || window.innerWidth > 768) return;

    let startX = 0, scrollLeft = 0, isDown = false, startTime = 0, velocity = 0, lastX = 0, lastTime = 0;

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
            tabNavigation.scrollLeft -= velocity * 100;
        }
    }
    function handleTouchMove(e) {
        if (!isDown) return;
        const currentX = e.touches[0].pageX - tabNavigation.offsetLeft;
        const currentTime = Date.now();
        const deltaX = currentX - lastX;
        const deltaTime = currentTime - lastTime;
        if (deltaTime > 0) velocity = deltaX / deltaTime;
        lastX = currentX;
        lastTime = currentTime;
        e.preventDefault();
        tabNavigation.scrollLeft = scrollLeft - (currentX - startX) * 1.5;
    }

    tabNavigation.addEventListener("touchstart", handleTouchStart, { passive: false });
    tabNavigation.addEventListener("touchend", handleTouchEnd, { passive: false });
    tabNavigation.addEventListener("touchmove", handleTouchMove, { passive: false });
}

// Setup event listeners for matching (scoped to matching containers only)
function setupMatchingEventListeners() {
    document.querySelectorAll(".jyotisham-matching-container").forEach((container) => {
        // Form submission
        const form = container.querySelector("#jyotisham-matching-form");
        if (form) {
            form.addEventListener("submit", handleMatchingFormSubmit);
        }

        // Tab switching - only Matching tabs within this container
        container.querySelectorAll(".jyotisham-tab-btn").forEach((btn) => {
            btn.addEventListener("click", handleMatchingTabClick);
        });
    });

    // Add touch/swipe support for matching tab navigation
    setupMatchingTabSwipeSupport();
}

// Handle matching tab clicks (scoped to Matching container only)
function handleMatchingTabClick(e) {
    const container = e.target.closest(".jyotisham-matching-container");
    if (!container) return;

    const tabName = e.target.dataset.tab;
    if (!tabName) return;

    // Update active tab (only within this container)
    container.querySelectorAll(".jyotisham-tab-btn").forEach((btn) => btn.classList.remove("jyotisham-active"));
    e.target.classList.add("jyotisham-active");

    // Update active pane (only within this container)
    container.querySelectorAll(".jyotisham-tab-pane").forEach((pane) => pane.classList.remove("jyotisham-active"));
    const tabPaneId = "jyotisham-" + tabName;
    const tabPaneEl = container.querySelector("#" + tabPaneId) || document.getElementById(tabPaneId);
    if (tabPaneEl) {
        tabPaneEl.classList.add("jyotisham-active");
    }

    // Load tab data for this container
    loadMatchingTabData(tabName);
}

// Handle matching form submission
async function handleMatchingFormSubmit(e) {
    e.preventDefault();

    const container = e.target.closest(".jyotisham-matching-container");
    if (!container) return;

    // Prevent multiple simultaneous API calls
    if (isApiCallInProgress) {
        return;
    }

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    // Validate required fields
    if (!data.boy_latitude || !data.boy_longitude || !data.girl_latitude || !data.girl_longitude) {
        alert("Please select valid places from the dropdown for both boy and girl");
        return;
    }

    // Ensure timezone values are set
    if (!data.boy_timezone && data.boy_latitude && data.boy_longitude) {
        await getTimezoneMatching(data.boy_latitude, data.boy_longitude, 'boy');
        // Wait a moment for the async call to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
        data.boy_timezone = document.getElementById('jyotisham-boy-timezone').value || 5.5;
    }
    
    if (!data.girl_timezone && data.girl_latitude && data.girl_longitude) {
        await getTimezoneMatching(data.girl_latitude, data.girl_longitude, 'girl');
        // Wait a moment for the async call to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
        data.girl_timezone = document.getElementById('jyotisham-girl-timezone').value || 5.5;
    }

    // Format dates for API
    data.boy_date = formatDateForAPI(data.boy_dateOfBirth);
    data.boy_time = data.boy_timeOfBirth;
    data.girl_date = formatDateForAPI(data.girl_dateOfBirth);
    data.girl_time = data.girl_timeOfBirth;
    data.lang = data.language;

    currentMatchingData = data;

    // Clear cache for fresh data
    apiCallCache.clear();
    cachedMatchingData = {};

    // Disable the submit button to prevent multiple clicks
    const submitButton = e.target.querySelector('button[type="submit"]');
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Generating...';
        submitButton.style.opacity = '0.7';
        submitButton.style.cursor = 'not-allowed';
    }

    // Disable all form inputs during processing
    const formInputs = e.target.querySelectorAll('input, select, button');
    formInputs.forEach(input => {
        if (input !== submitButton) {
            input.disabled = true;
        }
    });

    // Show loading (scoped to this container)
    showMatchingLoading(container);

    try {
        // Set API call in progress flag
        isApiCallInProgress = true;
        
        // Generate matching data
        await generateMatchingData();

        // Hide loading and show results
        hideMatchingLoading(container);
        showMatchingResults(container);

        // Load overview tab data
        await loadMatchingTabData("overview");
    } catch (error) {
        showMatchingError(error.message, container);
    } finally {
        // Reset API call flag
        isApiCallInProgress = false;
        currentApiCall = null;
        
        // Re-enable the submit button
        const submitButton = e.target.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Generate Compatibility Report';
            submitButton.style.opacity = '1';
            submitButton.style.cursor = 'pointer';
        }

        // Re-enable all form inputs
        const formInputs = e.target.querySelectorAll('input, select, button');
        formInputs.forEach(input => {
            input.disabled = false;
        });
    }
}

// Format date for API (DD/MM/YYYY)
function formatDateForAPI(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// Generate matching data
async function generateMatchingData() {
    const ashtakootData = await fetchAshtakootMatchingData();
    cachedMatchingData.ashtakoot = ashtakootData;
    cachedMatchingData.overview = ashtakootData; // Use ashtakoot for overview initially
}

// Fetch Ashtakoot data via AJAX
async function fetchAshtakootMatchingData() {
    // Create cache key based on the data
    const cacheKey = `ashtakoot_${JSON.stringify({
        boy_name: currentMatchingData.boy_name,
        boy_date: currentMatchingData.boy_date,
        boy_time: currentMatchingData.boy_time,
        boy_latitude: currentMatchingData.boy_latitude,
        boy_longitude: currentMatchingData.boy_longitude,
        boy_tz: currentMatchingData.boy_timezone,
        girl_name: currentMatchingData.girl_name,
        girl_date: currentMatchingData.girl_date,
        girl_time: currentMatchingData.girl_time,
        girl_latitude: currentMatchingData.girl_latitude,
        girl_longitude: currentMatchingData.girl_longitude,
        girl_tz: currentMatchingData.girl_timezone,
        lang: currentMatchingData.lang
    })}`;
    
    // Check cache first
    if (apiCallCache.has(cacheKey)) {
        return apiCallCache.get(cacheKey);
    }
    
    // Check if there's already a call in progress for the same data
    if (currentApiCall && currentApiCall.action === 'jyotisham_generate_matching') {
        return currentApiCall.promise;
    }

    const data = {
        action: 'jyotisham_generate_matching',
        boy_name: currentMatchingData.boy_name,
        boy_date: currentMatchingData.boy_date,
        boy_time: currentMatchingData.boy_time,
        boy_latitude: currentMatchingData.boy_latitude,
        boy_longitude: currentMatchingData.boy_longitude,
        boy_tz: currentMatchingData.boy_timezone,
        girl_name: currentMatchingData.girl_name,
        girl_date: currentMatchingData.girl_date,
        girl_time: currentMatchingData.girl_time,
        girl_latitude: currentMatchingData.girl_latitude,
        girl_longitude: currentMatchingData.girl_longitude,
        girl_tz: currentMatchingData.girl_timezone,
        lang: currentMatchingData.lang,
        nonce: jyotisham_ajax.nonce
    };
    

    // Create a promise for this API call with timeout
    const apiPromise = Promise.race([
        fetch(jyotisham_ajax.ajax_url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams(data)
        }),
        new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), 30000)
        )
    ]).then(async (response) => {
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.data || 'Failed to fetch matching data');
        }

        const resultData = result.data;
        // Cache the result
        apiCallCache.set(cacheKey, resultData);
        return resultData;
    }).finally(() => {
        // Clear the current API call when done
        if (currentApiCall && currentApiCall.action === 'jyotisham_generate_matching') {
            currentApiCall = null;
        }
    });

    // Store the current API call
    currentApiCall = {
        action: 'jyotisham_generate_matching',
        promise: apiPromise
    };

    return await apiPromise;
}

// Show shimmer loader for matching tab content
function showMatchingTabShimmer(tabName) {
    const contentDiv = document.getElementById("jyotisham-" + tabName + "Content");
    if (!contentDiv) return;

    const shimmerHTML = `
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
    contentDiv.innerHTML = shimmerHTML;
}

// Load matching tab data (uses cache when available to avoid repeated API calls)
async function loadMatchingTabData(tabName) {
    try {
        let data = null;

        // Check cache first - if we already have data for this tab, display and skip API call
        switch (tabName) {
            case "overview":
                data = cachedMatchingData.overview || cachedMatchingData.ashtakoot;
                break;
            case "ashtakoot":
                data = cachedMatchingData.ashtakoot;
                break;
            case "dashakoot":
                data = cachedMatchingData.dashakoot;
                break;
            case "aggregate":
                data = cachedMatchingData.aggregate;
                break;
            case "nakshatra":
                data = cachedMatchingData.nakshatra;
                break;
            case "boy-details":
                data = cachedMatchingData["boy-details"];
                if (!data && cachedMatchingData.ashtakoot?.response?.boy_astro_details) {
                    data = cachedMatchingData.ashtakoot.response.boy_astro_details;
                    cachedMatchingData["boy-details"] = data;
                }
                break;
            case "girl-details":
                data = cachedMatchingData["girl-details"];
                if (!data && cachedMatchingData.ashtakoot?.response?.girl_astro_details) {
                    data = cachedMatchingData.ashtakoot.response.girl_astro_details;
                    cachedMatchingData["girl-details"] = data;
                }
                break;
        }

        // Use cached data when available (no API call, no shimmer)
        if (data !== undefined && data !== null) {
            displayMatchingTabData(tabName, data);
            return;
        }

        // No cache: show shimmer and fetch from API
        showMatchingTabShimmer(tabName);

        switch (tabName) {
            case "overview":
                data = cachedMatchingData.ashtakoot || await fetchAshtakootMatchingData();
                cachedMatchingData.overview = data;
                break;
            case "ashtakoot":
                data = await fetchAshtakootMatchingData();
                cachedMatchingData.ashtakoot = data;
                break;
            case "dashakoot":
                data = await fetchDashakootMatchingData();
                cachedMatchingData.dashakoot = data;
                break;
            case "aggregate":
                data = await fetchAggregateMatchingData();
                cachedMatchingData.aggregate = data;
                break;
            case "nakshatra":
                data = await fetchNakshatraMatchingData();
                cachedMatchingData.nakshatra = data;
                break;
            case "boy-details":
                data = cachedMatchingData.ashtakoot?.response?.boy_astro_details || {};
                cachedMatchingData["boy-details"] = data;
                break;
            case "girl-details":
                data = cachedMatchingData.ashtakoot?.response?.girl_astro_details || {};
                cachedMatchingData["girl-details"] = data;
                break;
        }

        displayMatchingTabData(tabName, data);
    } catch (error) {
        showMatchingTabError(tabName, error.message);
    }
}

// Fetch other matching data types
async function fetchDashakootMatchingData() {
    return await fetchMatchingTabData('dashakoot');
}

async function fetchAggregateMatchingData() {
    return await fetchMatchingTabData('aggregate');
}

async function fetchNakshatraMatchingData() {
    return await fetchMatchingTabData('nakshatra');
}

async function fetchMatchingTabData(tab) {
    // Check if there's already a call in progress for the same tab
    const callKey = `jyotisham_get_matching_tab_data_${tab}`;
    if (currentApiCall && currentApiCall.action === callKey) {
        return currentApiCall.promise;
    }

    const data = {
        action: 'jyotisham_get_matching_tab_data',
        tab: tab,
        boy_name: currentMatchingData.boy_name,
        boy_date: currentMatchingData.boy_date,
        boy_time: currentMatchingData.boy_time,
        boy_latitude: currentMatchingData.boy_latitude,
        boy_longitude: currentMatchingData.boy_longitude,
        boy_tz: currentMatchingData.boy_timezone,
        girl_name: currentMatchingData.girl_name,
        girl_date: currentMatchingData.girl_date,
        girl_time: currentMatchingData.girl_time,
        girl_latitude: currentMatchingData.girl_latitude,
        girl_longitude: currentMatchingData.girl_longitude,
        girl_tz: currentMatchingData.girl_timezone,
        lang: currentMatchingData.lang,
        nonce: jyotisham_ajax.nonce
    };

    // Create a promise for this API call
    const apiPromise = fetch(jyotisham_ajax.ajax_url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(data)
    }).then(async (response) => {
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.data || 'Failed to fetch tab data');
        }

        return result.data;
    }).finally(() => {
        // Clear the current API call when done
        if (currentApiCall && currentApiCall.action === callKey) {
            currentApiCall = null;
        }
    });

    // Store the current API call
    currentApiCall = {
        action: callKey,
        promise: apiPromise
    };

    return await apiPromise;
}

// Display matching tab data
function displayMatchingTabData(tabName, data) {
    const contentDiv = document.getElementById(`jyotisham-${tabName}Content`);

    switch (tabName) {
        case "overview":
            displayOverviewMatchingData(data, contentDiv);
            break;
        case "ashtakoot":
            displayAshtakootMatchingData(data, contentDiv);
            break;
        case "dashakoot":
            displayDashakootMatchingData(data, contentDiv);
            break;
        case "aggregate":
            displayAggregateMatchingData(data, contentDiv);
            break;
        case "nakshatra":
            displayNakshatraMatchingData(data, contentDiv);
            break;
        case "boy-details":
            displayPersonMatchingDetails(data, contentDiv, "Boy");
            break;
        case "girl-details":
            displayPersonMatchingDetails(data, contentDiv, "Girl");
            break;
    }
}

// Display functions for matching data
function displayOverviewMatchingData(data, container) {
    if (data.status !== 200) {
        container.innerHTML = '<div class="jyotisham-card"><p>Error loading overview data</p></div>';
        return;
    }

    const response = data.response;
    
    // Calculate compatibility percentage
    const compatibilityPercentage = Math.round((response.score / (response.total_score || 36)) * 100);
    const compatibilityClass = compatibilityPercentage >= 70 ? 'excellent' : compatibilityPercentage >= 50 ? 'good' : 'fair';
    
    container.innerHTML = `
        <div class="jyotisham-content">
            <div class="jyotisham-score-card ${compatibilityClass}">
                <div class="jyotisham-score-header">
                    <h3>💕 Compatibility Overview</h3>
                    <div class="jyotisham-compatibility-badge">${compatibilityPercentage}% Compatible</div>
                </div>
                <div class="jyotisham-score-number">${response.score}/${response.total_score || 36}</div>
                <div class="jyotisham-score-description">${response.bot_response || 'Comprehensive compatibility analysis based on ancient Vedic principles'}</div>
            </div>
            
            <div class="jyotisham-card">
                <h3>📊 Quick Compatibility Overview</h3>
                <div class="jyotisham-matching-grid">
                    <div class="jyotisham-matching-item">
                        <div class="jyotisham-matching-header">
                            <h4>🕉️ Varna (Spiritual Compatibility)</h4>
                            <div class="jyotisham-score-badge">${response.varna?.varna || 0}/${response.varna?.full_score || 1}</div>
                        </div>
                        <div class="jyotisham-matching-content">
                            <div class="description">${response.varna?.description || 'Spiritual compatibility analysis'}</div>
                            <div class="jyotisham-person-details">
                                <span class="boy-detail"><strong>Boy:</strong> ${response.varna?.boy_varna || 'N/A'}</span>
                                <span class="girl-detail"><strong>Girl:</strong> ${response.varna?.girl_varna || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="jyotisham-matching-item">
                        <div class="jyotisham-matching-header">
                            <h4>💕 Vasya (Mutual Attraction)</h4>
                            <div class="jyotisham-score-badge">${response.vasya?.vasya || 0}/${response.vasya?.full_score || 2}</div>
                        </div>
                        <div class="jyotisham-matching-content">
                            <div class="description">${response.vasya?.description || 'Mutual attraction and compatibility'}</div>
                            <div class="jyotisham-person-details">
                                <span class="boy-detail"><strong>Boy:</strong> ${response.vasya?.boy_vasya || 'N/A'}</span>
                                <span class="girl-detail"><strong>Girl:</strong> ${response.vasya?.girl_vasya || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="jyotisham-matching-item">
                        <div class="jyotisham-matching-header">
                            <h4>🎭 Gana (Temperament)</h4>
                            <div class="jyotisham-score-badge">${response.gana?.gana || 0}/${response.gana?.full_score || 6}</div>
                        </div>
                        <div class="jyotisham-matching-content">
                            <div class="description">${response.gana?.description || 'Temperament and nature compatibility'}</div>
                            <div class="jyotisham-person-details">
                                <span class="boy-detail"><strong>Boy:</strong> ${response.gana?.boy_gana || 'N/A'}</span>
                                <span class="girl-detail"><strong>Girl:</strong> ${response.gana?.girl_gana || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="jyotisham-matching-item">
                        <div class="jyotisham-matching-header">
                            <h4>🌹 Yoni (Intimacy)</h4>
                            <div class="jyotisham-score-badge">${response.yoni?.yoni || 0}/${response.yoni?.full_score || 4}</div>
                        </div>
                        <div class="jyotisham-matching-content">
                            <div class="description">${response.yoni?.description || 'Intimate compatibility analysis'}</div>
                            <div class="jyotisham-person-details">
                                <span class="boy-detail"><strong>Boy:</strong> ${response.yoni?.boy_yoni || 'N/A'}</span>
                                <span class="girl-detail"><strong>Girl:</strong> ${response.yoni?.girl_yoni || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="jyotisham-card">
                <h3>👫 Personal Information</h3>
                <div class="jyotisham-table-container">
                    <table class="jyotisham-data-table">
                        <tr><td><strong>Boy's Name</strong></td><td>${currentMatchingData.boy_name || 'N/A'}</td></tr>
                        <tr><td><strong>Girl's Name</strong></td><td>${currentMatchingData.girl_name || 'N/A'}</td></tr>
                        <tr><td><strong>Boy's DOB</strong></td><td>${currentMatchingData.boy_dateOfBirth || 'N/A'}</td></tr>
                        <tr><td><strong>Girl's DOB</strong></td><td>${currentMatchingData.girl_dateOfBirth || 'N/A'}</td></tr>
                        <tr><td><strong>Boy's Place</strong></td><td>${currentMatchingData.boy_placeOfBirth || 'N/A'}</td></tr>
                        <tr><td><strong>Girl's Place</strong></td><td>${currentMatchingData.girl_placeOfBirth || 'N/A'}</td></tr>
                        <tr><td><strong>Language</strong></td><td>${currentMatchingData.lang || 'English'}</td></tr>
                    </table>
                </div>
            </div>
            
            ${response.summary ? `
            <div class="jyotisham-card">
                <h3>📝 Summary</h3>
                <div class="jyotisham-summary-content">
                    <p>${response.summary}</p>
                </div>
            </div>
            ` : ''}
        </div>
    `;
}

// Show/hide functions (scoped to matching container)
function showMatchingLoading(container) {
    if (!container) container = document.querySelector(".jyotisham-matching-container");
    const loading = container ? container.querySelector("[data-role='loading']") : null;
    const results = container ? container.querySelector("[data-role='results']") : null;
    if (loading) loading.classList.remove("jyotisham-hidden");
    if (results) results.classList.add("jyotisham-hidden");
}

function hideMatchingLoading(container) {
    if (!container) container = document.querySelector(".jyotisham-matching-container");
    const loading = container ? container.querySelector("[data-role='loading']") : null;
    if (loading) loading.classList.add("jyotisham-hidden");
}

function showMatchingResults(container) {
    if (!container) container = document.querySelector(".jyotisham-matching-container");
    const results = container ? container.querySelector("[data-role='results']") : null;
    if (results) results.classList.remove("jyotisham-hidden");
}

function showMatchingError(message, container) {
    if (!container) container = document.querySelector(".jyotisham-matching-container");
    hideMatchingLoading(container);
    const results = container ? container.querySelector("[data-role='results']") : null;
    if (results) {
        results.innerHTML = `
            <div class="jyotisham-card jyotisham-error">
                <div class="jyotisham-error-content">
                    <div class="jyotisham-error-icon">❌</div>
                    <div class="jyotisham-error-message">
                        <h3>Error</h3>
                        <p>${message}</p>
                        <button onclick="location.reload()" class="jyotisham-retry-btn">Try Again</button>
                    </div>
                </div>
            </div>
        `;
        results.classList.remove("jyotisham-hidden");
    }
}

function showMatchingTabError(tabName, message) {
    const contentDiv = document.getElementById(`jyotisham-${tabName}Content`);
    if (contentDiv) {
        contentDiv.innerHTML = `
            <div class="jyotisham-card jyotisham-error">
                <div class="jyotisham-error-content">
                    <div class="jyotisham-error-icon">❌</div>
                    <div class="jyotisham-error-message">
                        <h4>Error Loading ${tabName.charAt(0).toUpperCase() + tabName.slice(1)} Data</h4>
                        <p>${message}</p>
                        <button onclick="loadMatchingTabData('${tabName}')" class="jyotisham-retry-btn">Retry</button>
                    </div>
                </div>
            </div>
        `;
    }
}

// Include other display functions from the original script
// (These would be similar to the original but adapted for matching data)

