(function() {
    'use strict';

    var config = window.jyotishamAstroPdfReport || {};

    function ready(fn) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', fn);
        } else {
            fn();
        }
    }

    function parseNumber(value) {
        var parsed = parseFloat(value);
        return Number.isFinite(parsed) ? parsed : null;
    }

    function showStatus(statusEl, message, type) {
        if (!statusEl) {
            return;
        }

        statusEl.textContent = message || '';
        statusEl.className = 'jyotisham-astro-pdf-status ' + (type ? 'is-' + type : '');
    }

    function setLoading(form, isLoading) {
        var spinner = form.querySelector('[data-role="spinner"]');
        var button = form.closest('form.cart') ? form.closest('form.cart').querySelector('button.single_add_to_cart_button') : null;

        if (spinner) {
            spinner.classList.toggle('is-visible', isLoading);
        }

        if (button) {
            button.disabled = isLoading;
            button.classList.toggle('is-loading', isLoading);
        }
    }

    function initForm(form) {
        var placeInput = form.querySelector('#jyotisham_astro_pdf_place');
        var latitudeInput = form.querySelector('#jyotisham_astro_pdf_latitude');
        var longitudeInput = form.querySelector('#jyotisham_astro_pdf_longitude');
        var timezoneInput = form.querySelector('#jyotisham_astro_pdf_timezone');
        var statusEl = form.querySelector('[data-role="status"]');
        var priceInput = form.querySelector('#jyotisham_astro_pdf_price');
        var autocomplete = null;

        function timezoneRequest(latitude, longitude) {
            if (!config.ajaxUrl || !config.nonce) {
                return Promise.reject(new Error('Configuration missing'));
            }

            var formData = new FormData();
            formData.append('action', config.timezoneAction || 'jyotisham_get_timezone');
            formData.append('nonce', config.nonce);
            formData.append('latitude', latitude);
            formData.append('longitude', longitude);

            return fetch(config.ajaxUrl, {
                method: 'POST',
                credentials: 'same-origin',
                body: formData
            }).then(function(response) {
                return response.json();
            }).then(function(data) {
                if (!data || !data.success) {
                    throw new Error((data && data.data) || 'Timezone lookup failed');
                }

                return data.data.timezone;
            });
        }

        function resetLocationFields() {
            latitudeInput.value = '';
            longitudeInput.value = '';
            timezoneInput.value = '';
        }

        // Cache for storing search and timezone results to reduce API calls.
        var searchCache = {};
        var timezoneCache = {};
        var inputTimeout = null;
        var minChars = 3;

        function normalizeInput(str) {
            return str.trim().replace(/\s+/g, ' ');
        }

        function getCachedResult(query) {
            return searchCache[query.toLowerCase()] || null;
        }

        function setCachedResult(query, result) {
            searchCache[query.toLowerCase()] = result;
        }

        function getTimezoneCacheKey(latitude, longitude) {
            return String(latitude) + ',' + String(longitude);
        }

        function getCachedTimezone(latitude, longitude) {
            return timezoneCache[getTimezoneCacheKey(latitude, longitude)] || null;
        }

        function setCachedTimezone(latitude, longitude, timezone) {
            timezoneCache[getTimezoneCacheKey(latitude, longitude)] = timezone;
        }

        function googleMapsReady() {
            return !!(window.google && google.maps && google.maps.places);
        }

        function initAutocomplete() {
            if (!googleMapsReady() || !placeInput) {
                return false;
            }

            if (autocomplete) {
                return true;
            }

            autocomplete = new google.maps.places.Autocomplete(placeInput, {
                types: ['(cities)'],
                fields: ['geometry', 'formatted_address', 'name']
            });

            autocomplete.addListener('place_changed', function() {
                clearTimeout(inputTimeout);
                var inputValue = normalizeInput(placeInput.value);

                // Ensure minimum 3 character requirement.
                if (inputValue.length < minChars) {
                    resetLocationFields();
                    showStatus(statusEl, 'Please type at least 3 characters for location search.', 'info');
                    return;
                }

                var place = autocomplete.getPlace();

                resetLocationFields();

                if (!place || !place.geometry || !place.geometry.location) {
                    showStatus(statusEl, config.messages ? config.messages.placeRequired : 'Please select a valid place.', 'error');
                    return;
                }

                var latitude = place.geometry.location.lat();
                var longitude = place.geometry.location.lng();

                var cachedTimezone = getCachedTimezone(latitude, longitude);
                setCachedResult(inputValue, {
                    latitude: latitude,
                    longitude: longitude,
                    address: place.formatted_address || inputValue,
                    timezone: cachedTimezone || ''
                });

                latitudeInput.value = latitude;
                longitudeInput.value = longitude;

                if (cachedTimezone) {
                    timezoneInput.value = cachedTimezone;
                    showStatus(statusEl, 'Location confirmed (cached).', 'success');
                    return;
                }

                timezoneInput.value = '';
                showStatus(statusEl, 'Fetching timezone...', 'info');

                timezoneRequest(latitude, longitude).then(function(timezone) {
                    timezoneInput.value = timezone;
                    setCachedTimezone(latitude, longitude, timezone);

                    var existing = getCachedResult(inputValue);
                    if (existing) {
                        existing.timezone = timezone;
                        setCachedResult(inputValue, existing);
                    }

                    showStatus(statusEl, 'Location confirmed.', 'success');
                }).catch(function(error) {
                    showStatus(statusEl, error.message || 'Timezone lookup failed.', 'error');
                });
            });

            return true;
        }

        function waitForGoogleMapsAndInit(retries) {
            var attempts = retries || 0;

            if (initAutocomplete()) {
                return;
            }

            if (attempts >= 20) {
                return;
            }

            window.setTimeout(function() {
                waitForGoogleMapsAndInit(attempts + 1);
            }, 250);
        }

        function handlePlaceInput() {
            clearTimeout(inputTimeout);
            resetLocationFields();
            showStatus(statusEl, '', '');

            var inputValue = normalizeInput(placeInput.value);
            var cachedResult = getCachedResult(inputValue);

            if (cachedResult) {
                latitudeInput.value = cachedResult.latitude;
                longitudeInput.value = cachedResult.longitude;
                timezoneInput.value = cachedResult.timezone || '';
                showStatus(statusEl, cachedResult.timezone ? 'Location confirmed (cached).' : 'Location found in cache.', 'success');
                return;
            }

            if (inputValue.length < minChars) {
                return;
            }

            // Autocomplete initializes only after 3 words and user pause.
            inputTimeout = window.setTimeout(function() {
                waitForGoogleMapsAndInit();
            }, 400);
        }

        function attachPlaceInputListener() {
            if (!placeInput) {
                return;
            }

            placeInput.addEventListener('input', handlePlaceInput);
        }

        attachPlaceInputListener();

        form.addEventListener('submit', function(event) {
            var timezoneValue = timezoneInput ? timezoneInput.value.trim() : '';
            var latitudeValue = latitudeInput ? latitudeInput.value.trim() : '';
            var longitudeValue = longitudeInput ? longitudeInput.value.trim() : '';
            var placeValue = placeInput ? placeInput.value.trim() : '';

            if (!placeValue || !latitudeValue || !longitudeValue) {
                event.preventDefault();
                showStatus(statusEl, config.messages ? config.messages.placeRequired : 'Please select a valid place.', 'error');
                return;
            }

            if (!timezoneValue) {
                event.preventDefault();
                showStatus(statusEl, config.messages ? config.messages.timezonePending : 'Timezone is still loading.', 'error');
                return;
            }

            if (priceInput) {
                var priceValue = parseNumber(priceInput.value);
                if (priceValue === null || priceValue <= 0) {
                    event.preventDefault();
                    showStatus(statusEl, config.messages ? config.messages.priceRequired : 'Please enter a valid price.', 'error');
                    return;
                }
            }

            setLoading(form, true);
        });

        // Do not initialize autocomplete immediately to avoid API calls on early typing.
    }

    ready(function() {
        document.querySelectorAll('[data-jyotisham-astro-pdf-form]').forEach(initForm);
    });
})();
