/**
 * Sade Sati Report - WordPress plugin frontend
 * Uses WordPress AJAX; API key stays server-side.
 */

(function($) {
    'use strict';

    let currentData = {};
    let googleMapsLoaded = false;
    let autocomplete = null;
    let searchCount = 0;
    const maxSearchesPerSession = 10;

    $(document).ready(function() {
        initSadesati();
    });

    function initSadesati() {
        initializeFormWithDefaults();
        setupEventListeners();
        waitForGoogleMaps();
        setTimeout(fixMobileOverflow, 500);
        setTimeout(function() {
            const tzInput = document.getElementById('jyotisham-sadesati-timezone');
            if (tzInput && !tzInput.value) {
                setSadesatiBrowserTimezone();
            }
        }, 1000);
    }

    function waitForGoogleMaps() {
        let retries = 0;
        const maxRetries = 20;
        const interval = setInterval(function() {
            if (typeof google !== 'undefined' && google.maps && google.maps.places) {
                clearInterval(interval);
                googleMapsLoaded = true;
                initializeGoogleMaps();
            } else if (retries >= maxRetries) {
                clearInterval(interval);
            } else {
                retries++;
            }
        }, 500);
        setTimeout(function() { clearInterval(interval); }, 10000);
    }

    function initializeFormWithDefaults() {
        const today = new Date();
        const dateInput = $('#jyotisham-sadesati-date');
        if (dateInput.length) {
            dateInput.val(today.toISOString().split('T')[0]);
        }
        const timeInput = $('#jyotisham-sadesati-time');
        if (timeInput.length) {
            const now = new Date();
            const hours = now.getHours().toString().padStart(2, '0');
            const minutes = now.getMinutes().toString().padStart(2, '0');
            timeInput.val(hours + ':' + minutes);
        }
    }

    function setupEventListeners() {
        $('#jyotisham-sadesati-form').on('submit', handleFormSubmit);
        $(window).on('resize', function() {
            setTimeout(fixMobileOverflow, 100);
        });
    }

    function initializeGoogleMaps() {
        if (!googleMapsLoaded || !google.maps || !google.maps.places) return;

        const placeInput = document.getElementById('jyotisham-sadesati-place');
        if (!placeInput) return;

        let debounceTimer;
        let lastSearchTerm = '';

        function debouncedSearch() {
            const currentValue = placeInput.value.trim();
            clearTimeout(debounceTimer);
            if (currentValue.length < 2) {
                if (autocomplete) {
                    google.maps.event.clearInstanceListeners(placeInput);
                    autocomplete = null;
                }
                // Remove visible Google Places dropdown when input is cleared (same as Choghadiya/Panchang)
                var existingDropdown = document.querySelector('.pac-container');
                if (existingDropdown) {
                    existingDropdown.remove();
                }
                lastSearchTerm = '';
                searchCount = 0;
                return;
            }
            if (currentValue === lastSearchTerm || searchCount >= maxSearchesPerSession) return;

            debounceTimer = setTimeout(function() {
                if (currentValue.length >= 2 && currentValue !== lastSearchTerm) {
                    lastSearchTerm = currentValue;
                    searchCount++;
                    initAutocomplete();
                }
            }, 400);
        }

        function initAutocomplete() {
            if (!autocomplete && searchCount <= maxSearchesPerSession) {
                autocomplete = new google.maps.places.Autocomplete(placeInput, {
                    types: ['(cities)'],
                    fields: ['place_id', 'geometry', 'name', 'formatted_address']
                });
                autocomplete.addListener('place_changed', function() {
                    const place = autocomplete.getPlace();
                    if (place && place.geometry) {
                        const lat = place.geometry.location.lat();
                        const lng = place.geometry.location.lng();
                        $('#jyotisham-sadesati-latitude').val(lat);
                        $('#jyotisham-sadesati-longitude').val(lng);
                        getSadesatiTimezone(lat, lng);
                    }
                });
            } else if (searchCount > maxSearchesPerSession) {
                placeInput.placeholder = '⚠️ Search limit reached. Please refresh to search again.';
                placeInput.disabled = true;
            }
        }

        placeInput.addEventListener('input', debouncedSearch);
        placeInput.addEventListener('keydown', function(e) {
            if (e.key === 'Backspace' && placeInput.value.length <= 1) {
                if (autocomplete) {
                    google.maps.event.clearInstanceListeners(placeInput);
                    autocomplete = null;
                }
                var existingDropdown = document.querySelector('.pac-container');
                if (existingDropdown) {
                    existingDropdown.remove();
                }
                lastSearchTerm = '';
                searchCount = 0;
            }
        });
    }

    function getSadesatiTimezone(lat, lng) {
        if (typeof jyotishamSadesati === 'undefined') {
            setSadesatiBrowserTimezone();
            return;
        }
        var formData = new FormData();
        formData.append('action', 'jyotisham_get_timezone');
        formData.append('nonce', jyotishamSadesati.nonce);
        formData.append('latitude', lat);
        formData.append('longitude', lng);

        fetch(jyotishamSadesati.ajaxUrl, {
            method: 'POST',
            body: formData
        })
        .then(function(response) { return response.json(); })
        .then(function(data) {
            var tzInput = document.getElementById('jyotisham-sadesati-timezone');
            if (data.success && data.data && data.data.timezone !== undefined && tzInput) {
                tzInput.value = data.data.timezone;
            } else {
                setSadesatiBrowserTimezone();
            }
        })
        .catch(function() {
            setSadesatiBrowserTimezone();
        });
    }

    function setSadesatiBrowserTimezone() {
        var offset = -new Date().getTimezoneOffset() / 60;
        var tzInput = document.getElementById('jyotisham-sadesati-timezone');
        if (tzInput) tzInput.value = offset;
    }

    function handleFormSubmit(e) {
        e.preventDefault();
        var formData = new FormData(e.target);
        var data = {};
        formData.forEach(function(value, key) { data[key] = value; });

        if (!data.latitude || !data.longitude) {
            alert('Please select a valid place from the dropdown');
            return;
        }
        if (!data.timezone) {
            var tzEl = document.getElementById('jyotisham-sadesati-timezone');
            data.tz = tzEl ? tzEl.value : '';
        } else {
            data.tz = data.timezone;
        }

        currentData = data;
        showLoading();

        $.ajax({
            url: typeof jyotishamSadesati !== 'undefined' ? jyotishamSadesati.ajaxUrl : (typeof jyotisham_ajax !== 'undefined' ? jyotisham_ajax.ajax_url : ''),
            type: 'POST',
            data: {
                action: 'jyotisham_get_sadesati',
                nonce: typeof jyotishamSadesati !== 'undefined' ? jyotishamSadesati.nonce : (typeof jyotisham_ajax !== 'undefined' ? jyotisham_ajax.nonce : ''),
                name: data.name,
                date: data.date,
                time: data.time,
                latitude: data.latitude,
                longitude: data.longitude,
                tz: data.tz,
                lang: data.language || data.lang || 'en'
            },
            success: function(response) {
                hideLoading();
                if (response.success && response.data) {
                    showResults();
                    displaySadesatiData(response.data);
                } else {
                    showError(response.data || 'Failed to load Sade Sati data.');
                }
            },
            error: function(xhr, status, err) {
                hideLoading();
                showError(err && err.message ? err.message : 'Request failed. Please try again.');
            }
        });
    }

    function showLoading() {
        $('#jyotisham-sadesati-loading').removeClass('jyotisham-hidden');
        $('#jyotisham-sadesati-results').addClass('jyotisham-hidden');
    }

    function hideLoading() {
        $('#jyotisham-sadesati-loading').addClass('jyotisham-hidden');
    }

    function showResults() {
        $('#jyotisham-sadesati-results').removeClass('jyotisham-hidden');
    }

    function showError(message, type) {
        type = type || 'error';
        var icon = type === 'warning' ? '⚠️' : '❌';
        var cls = type === 'warning' ? 'jyotisham-warning' : 'jyotisham-error';
        $('#jyotisham-sadesatiData').html(
            '<div class="jyotisham-card ' + cls + '">' +
            '<div class="jyotisham-error-content">' +
            '<div class="jyotisham-error-icon">' + icon + '</div>' +
            '<div class="jyotisham-error-message"><h3>' + (type === 'warning' ? 'Warning' : 'Error') + '</h3><p>' + (message || 'Something went wrong.') + '</p></div></div></div>'
        );
        $('#jyotisham-sadesati-results').removeClass('jyotisham-hidden');
    }

    function displaySadesatiData(data) {
        var container = document.getElementById('jyotisham-sadesatiData');
        if (!container) return;

        if (!data || data.status !== 200) {
            container.innerHTML = '<div class="jyotisham-card"><p>Error loading Sade Sati data.</p></div>';
            return;
        }

        var response = data.response || {};
        var remedies = Array.isArray(response.remedies) ? response.remedies : [];
        var remediesHtml = remedies.map(function(r, i) {
            return '<li class="jyotisham-remedy-item"><span class="jyotisham-remedy-number">' + (i + 1) + '.</span><span class="jyotisham-remedy-text">' + (r || '').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</span></li>';
        }).join('');

        container.innerHTML =
            '<div class="jyotisham-content">' +
            '<div class="jyotisham-card"><h3>Sade Sati Report for ' + (currentData.name || '').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</h3>' +
            '<p><strong>Name:</strong> ' + (currentData.name || '-').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</p>' +
            '<p><strong>Date of Birth:</strong> ' + (currentData.date || '-') + '</p>' +
            '<p><strong>Time of Birth:</strong> ' + (currentData.time || '-') + '</p>' +
            '<p><strong>Place of Birth:</strong> ' + (currentData.place || '-').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</p></div>' +
            '<div class="jyotisham-card"><h3>Current Sade Sati Status</h3>' +
            '<div class="jyotisham-status-display">' +
            '<div class="jyotisham-status-indicator ' + (response.is_sade_sati_period ? 'jyotisham-active-sadesati' : 'jyotisham-inactive-sadesati') + '">' +
            (response.is_sade_sati_period ? 'Currently in Sade Sati Period' : 'Not in Sade Sati Period') + '</div>' +
            '<p><strong>Date Considered:</strong> ' + (response.date_considered || '-') + '</p>' +
            '<p><strong>Shani Period Type:</strong> ' + (response.shani_period_type || '-') + '</p>' +
            '<p><strong>Age:</strong> ' + (response.age != null ? response.age : '-') + ' years</p>' +
            '<p><strong>Saturn Retrograde:</strong> ' + (response.saturn_retrograde ? 'Yes' : 'No') + '</p></div></div>' +
            '<div class="jyotisham-card"><h3>About Sade Sati</h3><p class="jyotisham-description">' + (response.description || '').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</p></div>' +
            '<div class="jyotisham-card"><h3>Your Sade Sati Analysis</h3><p class="jyotisham-analysis">' + (response.bot_response || '').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</p></div>' +
            '<div class="jyotisham-card"><h3>Remedies for Sade Sati</h3><p class="jyotisham-section-description">Recommended remedies to help mitigate the effects of Sade Sati</p>' +
            '<ul class="jyotisham-remedies-list">' + remediesHtml + '</ul></div></div>';

        setTimeout(function() {
            if (typeof fixMobileOverflow === 'function') fixMobileOverflow();
        }, 100);
    }

    function fixMobileOverflow() {
        var containers = document.querySelectorAll('.jyotisham-sadesati-wrapper .jyotisham-container, .jyotisham-sadesati-wrapper .jyotisham-results, .jyotisham-sadesati-wrapper .jyotisham-card');
        if (containers && containers.length) {
            for (var i = 0; i < containers.length; i++) {
                containers[i].style.maxWidth = '100%';
                containers[i].style.overflowX = 'hidden';
                containers[i].style.boxSizing = 'border-box';
            }
        }
    }
})(jQuery);
