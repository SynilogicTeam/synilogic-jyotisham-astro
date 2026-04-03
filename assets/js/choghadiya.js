/**
 * Choghadiya Generator JavaScript
 * Handles frontend functionality for Choghadiya Muhurat generation
 */

(function($) {
    'use strict';
    
    // Global variables
    let currentData = {};
    let cachedData = {};
    let googleMapsLoaded = false;
    let autocomplete = null;
    let choghadiyaSearchLoadingTimer = null;
    let searchCount = 0;
    let googleMapsRetryCount = 0;
    const maxSearchesPerSession = 10;
    
    // Initialize when document is ready
    $(document).ready(function() {
        initializeChoghadiyaGenerator();
    });
    
    /**
     * Initialize Choghadiya generator
     */
    function initializeChoghadiyaGenerator() {
        // Initialize form with default values
        initializeFormWithDefaults();
        
        // Setup event listeners
        setupEventListeners();
        
        // Wait for Google Maps to be available (it's loaded by the main script)
        waitForGoogleMaps();
        
        // Fix mobile overflow issues
        setTimeout(fixMobileOverflow, 500);
        
        // Ensure timezone is set after a short delay (same as Panchang)
        setTimeout(() => {
            const timezoneInput = document.getElementById("jyotisham-choghadiya-timezone");
            if (timezoneInput && !timezoneInput.value) {
                setChoghadiyaBrowserTimezone();
            }
        }, 1000);
    }
    
    /**
     * Wait for Google Maps to be available
     */
    function waitForGoogleMaps() {
        const maxRetries = 20; // 20 attempts * 500ms = 10 seconds
        const checkInterval = setInterval(() => {
            if (typeof google !== 'undefined' && google.maps && google.maps.places) {
                clearInterval(checkInterval);
                googleMapsLoaded = true;
                initializeGoogleMaps();
            } else if (googleMapsRetryCount >= maxRetries) {
                clearInterval(checkInterval);
            } else {
                googleMapsRetryCount++;
            }
        }, 500);
        
        // Timeout after 10 seconds
        setTimeout(() => {
            clearInterval(checkInterval);
        }, 10000);
    }
    
    
    /**
     * Initialize form with default values
     */
    function initializeFormWithDefaults() {
        // Set current date
        const today = new Date();
        const dateInput = $('#jyotisham-choghadiya-date');
        if (dateInput.length) {
            dateInput.val(today.toISOString().split('T')[0]);
        }
        
        // Set current time
        const timeInput = $('#jyotisham-choghadiya-time');
        if (timeInput.length) {
            const now = new Date();
            const hours = now.getHours().toString().padStart(2, '0');
            const minutes = now.getMinutes().toString().padStart(2, '0');
            timeInput.val(hours + ':' + minutes);
        }
        
        // Set initial timezone for default location (Delhi, India)
        const latInput = document.getElementById("jyotisham-choghadiya-latitude");
        const lngInput = document.getElementById("jyotisham-choghadiya-longitude");
        const timezoneInput = document.getElementById("jyotisham-choghadiya-timezone");
        
        if (latInput && lngInput && timezoneInput) {
            const lat = parseFloat(latInput.value);
            const lng = parseFloat(lngInput.value);
            
            if (lat && lng) {
                // Get timezone for default location
                getChoghadiyaTimezone(lat, lng);
            } else {
                // Fallback to browser timezone
                setChoghadiyaBrowserTimezone();
            }
        }
    }
    
    /**
     * Setup event listeners
     */
    function setupEventListeners() {
        // Form submission
        $('#jyotisham-choghadiya-form').on('submit', handleFormSubmit);
        
        
        // Window resize to fix overflow issues
        $(window).on('resize', function() {
            setTimeout(fixMobileOverflow, 100);
        });
    }
    
    /**
     * Initialize Google Maps autocomplete
     */
    function initializeGoogleMaps() {
        if (!googleMapsLoaded || !google.maps || !google.maps.places) {
            return;
        }
        
        const placeInput = document.getElementById('jyotisham-choghadiya-place');
        if (!placeInput) {
            return;
        }
        
        let debounceTimer;
        let lastSearchTerm = '';
        
        function debouncedSearch() {
            const currentValue = placeInput.value.trim();
            clearTimeout(debounceTimer);
            
            if (currentValue.length < 1) {
                if (autocomplete) {
                    google.maps.event.clearInstanceListeners(placeInput);
                    autocomplete = null;
                }
                // Also remove any visible Google Places dropdown (same as Panchang)
                const existingDropdown = document.querySelector('.pac-container');
                if (existingDropdown) {
                    existingDropdown.remove();
                }
                // Reset last search term so next typing triggers immediately
                lastSearchTerm = '';
                searchCount = 0;
                hideChoghadiyaSearchLoading();
                return;
            }
            
            if (currentValue === lastSearchTerm || searchCount >= maxSearchesPerSession || !currentValue) {
                return;
            }
            
            // Show loading indicator
            showChoghadiyaSearchLoading();
            
            // Much faster response - almost instant
            const debounceTime = searchCount < 5 ? 50 : Math.min(100 + searchCount * 25, 300);
            
            debounceTimer = setTimeout(() => {
                if (currentValue.length >= 1 && currentValue !== lastSearchTerm) {
                    lastSearchTerm = currentValue;
                    searchCount++;
                    initializeAutocomplete();
                } else {
                    hideChoghadiyaSearchLoading();
                }
            }, debounceTime);
        }
        
        function initializeAutocomplete() {
            if (!autocomplete && searchCount <= maxSearchesPerSession) {
                if (autocomplete) {
                    google.maps.event.clearInstanceListeners(placeInput);
                    autocomplete = null;
                }
                
                autocomplete = new google.maps.places.Autocomplete(placeInput, {
                    types: ['(cities)'],
                    fields: ['place_id', 'geometry', 'name', 'formatted_address']
                });
                
                const originalGetPlacePredictions = autocomplete.getPlacePredictions;
                autocomplete.getPlacePredictions = function(request, callback) {
                    if (request.input && request.input.length >= 2) {
                        originalGetPlacePredictions.call(this, request, callback);
                    } else {
                        callback([]);
                    }
                };
                
                autocomplete.addListener('place_changed', function() {
                    const place = autocomplete.getPlace();
                    if (place && place.geometry) {
                        const lat = place.geometry.location.lat();
                        const lng = place.geometry.location.lng();
                        $('#jyotisham-choghadiya-latitude').val(lat);
                        $('#jyotisham-choghadiya-longitude').val(lng);
                        getChoghadiyaTimezone(lat, lng);
                        hideChoghadiyaSearchLoading();
                    }
                });
            } else if (searchCount > maxSearchesPerSession) {
                placeInput.placeholder = '⚠️ Search limit reached. Please refresh to search again.';
                placeInput.disabled = true;
            }
        }
        
        placeInput.addEventListener('input', debouncedSearch);
        
        // Hide searching indicator on blur as a safety
        placeInput.addEventListener('blur', () => {
            hideChoghadiyaSearchLoading();
        });
        
        // Initialize immediately on focus for instant suggestions
        placeInput.addEventListener('focus', () => {
            if (!autocomplete) { initializeAutocomplete(); }
            if (placeInput.value && placeInput.value.trim().length >= 1) { debouncedSearch(); }
        });
        
        placeInput.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && placeInput.value.length <= 1) {
                if (autocomplete) {
                    google.maps.event.clearInstanceListeners(placeInput);
                    autocomplete = null;
                }
                // Remove Google Places dropdown when clearing
                const existingDropdown = document.querySelector('.pac-container');
                if (existingDropdown) {
                    existingDropdown.remove();
                }
                // Reset last search term so next typing triggers immediately
                lastSearchTerm = '';
                searchCount = 0;
                hideChoghadiyaSearchLoading();
            }
            
            if (e.key === 'Enter' && searchCount > maxSearchesPerSession) {
                e.preventDefault();
                alert('Search limit reached. Please refresh the page to search again.');
            }
        });
    }
    
    // Show loading indicator for Choghadiya search
    function showChoghadiyaSearchLoading() {
        const placeInput = document.getElementById('jyotisham-choghadiya-place');
        if (!placeInput) return;
        
        // Add loading class to input
        placeInput.classList.add("jyotisham-choghadiya-search-loading");
        
        // Add loading indicator if not exists
        let loadingIndicator = document.querySelector(".jyotisham-choghadiya-search-loading-indicator");
        if (!loadingIndicator) {
            loadingIndicator = document.createElement("div");
            loadingIndicator.className = "jyotisham-choghadiya-search-loading-indicator";
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
        
        // Auto-hide if predictions don't return promptly (prevents stuck state)
        clearTimeout(choghadiyaSearchLoadingTimer);
        choghadiyaSearchLoadingTimer = setTimeout(() => {
            hideChoghadiyaSearchLoading();
        }, 2000);
    }
    
    // Hide loading indicator for Choghadiya search
    function hideChoghadiyaSearchLoading() {
        const placeInput = document.getElementById('jyotisham-choghadiya-place');
        if (!placeInput) return;
        
        clearTimeout(choghadiyaSearchLoadingTimer);
        
        // Remove loading class from input
        placeInput.classList.remove("jyotisham-choghadiya-search-loading");
        
        // Hide loading indicator
        const loadingIndicator = document.querySelector(".jyotisham-choghadiya-search-loading-indicator");
        if (loadingIndicator) {
            loadingIndicator.style.display = "none";
        }
    }
    
    /**
     * Get timezone using server-side AJAX call (same as Panchang)
     */
    function getChoghadiyaTimezone(lat, lng) {
        if (typeof jyotishamChoghadiya === 'undefined') {
            setChoghadiyaBrowserTimezone();
            return;
        }

        const formData = new FormData();
        formData.append('action', 'jyotisham_get_timezone');
        formData.append('nonce', jyotishamChoghadiya.nonce);
        formData.append('latitude', lat);
        formData.append('longitude', lng);

        fetch(jyotishamChoghadiya.ajaxUrl, {
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
                const timezoneInput = document.getElementById("jyotisham-choghadiya-timezone");
                if (timezoneInput) {
                    timezoneInput.value = data.data.timezone;
                }
            } else {
                setChoghadiyaBrowserTimezone();
            }
        })
        .catch(error => {
            setChoghadiyaBrowserTimezone();
        });
    }
    
    /**
     * Set timezone based on browser's timezone (same as Panchang)
     */
    function setChoghadiyaBrowserTimezone() {
        const timezoneInput = document.getElementById("jyotisham-choghadiya-timezone");
        if (timezoneInput) {
            const browserTimezone = new Date().getTimezoneOffset() / -60;
            timezoneInput.value = browserTimezone;
        }
    }
    
    /**
     * Get default timezone based on coordinates
     */
    function getDefaultTimezone(lat, lng) {
        // India timezone for coordinates in India region
        if (lat >= 6 && lat <= 37 && lng >= 68 && lng <= 97) {
            return 5.5;
        }
        // US Eastern timezone
        else if (lat >= 24 && lat <= 49 && lng >= -125 && lng <= -66) {
            return -5;
        }
        // US Central timezone
        else if (lat >= 25 && lat <= 49 && lng >= -106 && lng <= -93) {
            return -6;
        }
        // US Mountain timezone
        else if (lat >= 31 && lat <= 49 && lng >= -125 && lng <= -102) {
            return -7;
        }
        // US Pacific timezone
        else if (lat >= 32 && lat <= 49 && lng >= -125 && lng <= -114) {
            return -8;
        }
        // UK timezone
        else if (lat >= 50 && lat <= 60 && lng >= -10 && lng <= 2) {
            return 0;
        }
        // Default to India timezone
        else {
            return 5.5;
        }
    }
    
    
    
    
    /**
     * Handle form submission
     */
    function handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        
        // Validate required fields
        if (!data.latitude || !data.longitude) {
            alert('Please select a valid place from the dropdown');
            return;
        }
        
        // Ensure timezone is set before submission (same as Panchang)
        if (!data.timezone) {
            data.timezone = document.getElementById("jyotisham-choghadiya-timezone").value;
        }
        
        
        currentData = data;
        
        // Show loading
        showLoading();
        
        // Generate choghadiya data
        generateChoghadiyaData(data);
    }
    
    /**
     * Generate Choghadiya data via AJAX
     */
    function generateChoghadiyaData(data) {
        $.ajax({
            url: jyotishamChoghadiya.ajaxUrl,
            type: 'POST',
            data: {
                action: 'jyotisham_get_choghadiya',
                date: data.date,
                time: data.time,
                latitude: data.latitude,
                longitude: data.longitude,
                timezone: data.timezone,
                language: data.language,
                nonce: jyotishamChoghadiya.nonce
            },
            success: function(response) {
                hideLoading();
                
                if (response.success) {
                    showResults();
                    displayChoghadiyaData(response.data);
                } else {
                    showError(response.data || 'Error generating Choghadiya data');
                }
            },
            error: function(xhr, status, error) {
                hideLoading();
                showError('Network error. Please try again.');
            }
        });
    }
    
    /**
     * Show loading indicator
     */
    function showLoading() {
        $('#jyotisham-choghadiya-loading').removeClass('jyotisham-choghadiya-hidden');
        $('#jyotisham-choghadiya-results').addClass('jyotisham-choghadiya-hidden');
    }
    
    /**
     * Hide loading indicator
     */
    function hideLoading() {
        $('#jyotisham-choghadiya-loading').addClass('jyotisham-choghadiya-hidden');
    }
    
    /**
     * Show results
     */
    function showResults() {
        $('#jyotisham-choghadiya-results').removeClass('jyotisham-choghadiya-hidden');
    }
    
    /**
     * Show error message
     */
    function showError(errorMessage, errorType = 'error') {
        const errorContainer = $('#jyotisham-choghadiya-results');
        const errorIcon = errorType === 'warning' ? '⚠️' : '❌';
        const errorClass = errorType === 'warning' ? 'jyotisham-choghadiya-warning' : 'jyotisham-choghadiya-error';
        
        errorContainer.html(`
            <div class="jyotisham-choghadiya-card ${errorClass}">
                <div class="jyotisham-choghadiya-error-content">
                    <div class="jyotisham-choghadiya-error-icon">${errorIcon}</div>
                    <div class="jyotisham-choghadiya-error-message">
                        <h3>${errorType === 'warning' ? 'Warning' : 'Error'}</h3>
                        <p>${errorMessage}</p>
                        <div class="jyotisham-choghadiya-error-actions">
                            <button onclick="location.reload()" class="jyotisham-choghadiya-retry-btn">Try Again</button>
                            <button onclick="$('#jyotisham-choghadiya-results').addClass('jyotisham-choghadiya-hidden')" class="jyotisham-choghadiya-close-btn">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `);
        
        errorContainer.removeClass('jyotisham-choghadiya-hidden');
    }
    
    /**
     * Get type color class for muhurat
     */
    function getMuhuratTypeClass(type) {
        switch (type.toLowerCase()) {
            case 'auspicious':
                return 'jyotisham-choghadiya-auspicious';
            case 'inauspicious':
                return 'jyotisham-choghadiya-inauspicious';
            case 'good':
                return 'jyotisham-choghadiya-good';
            default:
                return 'jyotisham-choghadiya-neutral';
        }
    }
    
    /**
     * Display Choghadiya data
     */
    function displayChoghadiyaData(data) {
        const container = $('#jyotisham-choghadiyaData');
        
        if (data.status !== 200) {
            container.html('<div class="jyotisham-choghadiya-card"><p>Error loading Choghadiya data</p></div>');
            return;
        }
        
        const response = data.response;
        
        container.html(`
            <div class="jyotisham-choghadiya-content">
                <!-- Day of Week -->
                <div class="jyotisham-choghadiya-card">
                    <h3>List of Choghadiya Muhurtas for ${response.day_of_week}</h3>
                    <p><strong>${response.day_of_week}, ${currentData.date}</strong></p>
                </div>
                
                <!-- Day Choghadiya -->
                <div class="jyotisham-choghadiya-card">
                    <h3>Day Choghadiya</h3>
                    ${wrapTableInContainer(`
                    <table class="jyotisham-choghadiya-data-table">
                        <thead>
                            <tr>
                                <th>Start</th>
                                <th>End</th>
                                <th>Muhurat</th>
                                <th>Type</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${response.day.map((period, index) => `
                                <tr class="${getMuhuratTypeClass(period.type)}">
                                    <td>${period.start}</td>
                                    <td>${period.end}</td>
                                    <td>${period.muhurat}</td>
                                    <td>${period.type}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    `)}
                </div>
                
                <!-- Night Choghadiya -->
                <div class="jyotisham-choghadiya-card">
                    <h3>Night Choghadiya</h3>
                    ${wrapTableInContainer(`
                    <table class="jyotisham-choghadiya-data-table">
                        <thead>
                            <tr>
                                <th>Start</th>
                                <th>End</th>
                                <th>Muhurat</th>
                                <th>Type</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${response.night.map((period, index) => `
                                <tr class="${getMuhuratTypeClass(period.type)}">
                                    <td>${period.start}</td>
                                    <td>${period.end}</td>
                                    <td>${period.muhurat}</td>
                                    <td>${period.type}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    `)}
                </div>
            </div>
        `);
        
        setTimeout(() => {
            enhanceTableScrolling();
            fixMobileOverflow();
        }, 100);
    }
    
    /**
     * Wrap table in responsive container
     */
    function wrapTableInContainer(tableHtml) {
        return `<div class="jyotisham-choghadiya-table-container">${tableHtml}</div>`;
    }
    
    /**
     * Enhance table scrolling on mobile
     */
    function enhanceTableScrolling() {
        $('.jyotisham-choghadiya-table-container').each(function() {
            $(this).css({
                'overflow-x': 'auto',
                '-webkit-overflow-scrolling': 'touch'
            });
        });
    }
    
    /**
     * Fix mobile overflow issues
     */
    function fixMobileOverflow() {
        $('.jyotisham-choghadiya-container, .jyotisham-choghadiya-results, .jyotisham-choghadiya-content, .jyotisham-choghadiya-card').each(function() {
            if (!$(this).hasClass('jyotisham-choghadiya-form-container')) {
                $(this).css({
                    'max-width': '100%',
                    'overflow-x': 'hidden',
                    'box-sizing': 'border-box'
                });
            }
        });
        
        $('.jyotisham-choghadiya-card p, .jyotisham-choghadiya-card h3').each(function() {
            $(this).css({
                'word-wrap': 'break-word',
                'overflow-wrap': 'break-word',
                'hyphens': 'auto',
                'max-width': '100%'
            });
        });
    }
    
})(jQuery);
