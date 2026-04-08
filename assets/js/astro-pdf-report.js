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
        var statusEl = form.querySelector('[data-role="status"]');
        var locationGroups = [];

        function makeLocationGroup(placeSelector, latitudeSelector, longitudeSelector, timezoneSelector, label) {
            var placeInput = form.querySelector(placeSelector);
            var latitudeInput = form.querySelector(latitudeSelector);
            var longitudeInput = form.querySelector(longitudeSelector);
            var timezoneInput = form.querySelector(timezoneSelector);

            if (!placeInput || !latitudeInput || !longitudeInput || !timezoneInput) {
                return null;
            }

            return {
                placeInput: placeInput,
                latitudeInput: latitudeInput,
                longitudeInput: longitudeInput,
                timezoneInput: timezoneInput,
                label: label,
                autocomplete: null,
                inputTimeout: null,
                searchCache: {},
                timezoneCache: {}
            };
        }

        var singleGroup = makeLocationGroup(
            '#jyotisham_astro_pdf_place',
            '#jyotisham_astro_pdf_latitude',
            '#jyotisham_astro_pdf_longitude',
            '#jyotisham_astro_pdf_timezone',
            'Birth place'
        );
        if (singleGroup) {
            locationGroups.push(singleGroup);
        }

        var boyGroup = makeLocationGroup(
            '#jyotisham_astro_pdf_boy_place',
            '#jyotisham_astro_pdf_boy_lat',
            '#jyotisham_astro_pdf_boy_lon',
            '#jyotisham_astro_pdf_boy_tz',
            'Boy birth place'
        );
        if (boyGroup) {
            locationGroups.push(boyGroup);
        }

        var girlGroup = makeLocationGroup(
            '#jyotisham_astro_pdf_girl_place',
            '#jyotisham_astro_pdf_girl_lat',
            '#jyotisham_astro_pdf_girl_lon',
            '#jyotisham_astro_pdf_girl_tz',
            'Girl birth place'
        );
        if (girlGroup) {
            locationGroups.push(girlGroup);
        }

        if (!locationGroups.length) {
            return;
        }

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

        function resetLocationFields(group) {
            group.latitudeInput.value = '';
            group.longitudeInput.value = '';
            group.timezoneInput.value = '';
        }

        // Cache for storing search and timezone results to reduce API calls.
        var minChars = 3;

        function normalizeInput(str) {
            return str.trim().replace(/\s+/g, ' ');
        }

        function getCachedResult(group, query) {
            return group.searchCache[query.toLowerCase()] || null;
        }

        function setCachedResult(group, query, result) {
            group.searchCache[query.toLowerCase()] = result;
        }

        function getTimezoneCacheKey(latitude, longitude) {
            return String(latitude) + ',' + String(longitude);
        }

        function getCachedTimezone(group, latitude, longitude) {
            return group.timezoneCache[getTimezoneCacheKey(latitude, longitude)] || null;
        }

        function setCachedTimezone(group, latitude, longitude, timezone) {
            group.timezoneCache[getTimezoneCacheKey(latitude, longitude)] = timezone;
        }

        function googleMapsReady() {
            return !!(window.google && google.maps && google.maps.places);
        }

        function initAutocomplete(group) {
            if (!googleMapsReady()) {
                return false;
            }

            if (group.autocomplete) {
                return true;
            }

            group.autocomplete = new google.maps.places.Autocomplete(group.placeInput, {
                types: ['(cities)'],
                fields: ['geometry', 'formatted_address', 'name']
            });

            group.autocomplete.addListener('place_changed', function() {
                clearTimeout(group.inputTimeout);
                var inputValue = normalizeInput(group.placeInput.value);

                // Ensure minimum 3 character requirement.
                if (inputValue.length < minChars) {
                    resetLocationFields(group);
                    showStatus(statusEl, 'Please type at least 3 characters for location search.', 'info');
                    return;
                }

                var place = group.autocomplete.getPlace();

                resetLocationFields(group);

                if (!place || !place.geometry || !place.geometry.location) {
                    showStatus(statusEl, config.messages ? config.messages.placeRequired : 'Please select a valid place.', 'error');
                    return;
                }

                var latitude = place.geometry.location.lat();
                var longitude = place.geometry.location.lng();

                var cachedTimezone = getCachedTimezone(group, latitude, longitude);
                setCachedResult(group, inputValue, {
                    latitude: latitude,
                    longitude: longitude,
                    address: place.formatted_address || inputValue,
                    timezone: cachedTimezone || ''
                });

                group.latitudeInput.value = latitude;
                group.longitudeInput.value = longitude;

                if (cachedTimezone) {
                    group.timezoneInput.value = cachedTimezone;
                    showStatus(statusEl, 'Location confirmed (cached).', 'success');
                    return;
                }

                group.timezoneInput.value = '';
                showStatus(statusEl, 'Fetching timezone...', 'info');

                timezoneRequest(latitude, longitude).then(function(timezone) {
                    group.timezoneInput.value = timezone;
                    setCachedTimezone(group, latitude, longitude, timezone);

                    var existing = getCachedResult(group, inputValue);
                    if (existing) {
                        existing.timezone = timezone;
                        setCachedResult(group, inputValue, existing);
                    }

                    showStatus(statusEl, 'Location confirmed.', 'success');
                }).catch(function(error) {
                    showStatus(statusEl, error.message || 'Timezone lookup failed.', 'error');
                });
            });

            return true;
        }

        function waitForGoogleMapsAndInit(group, retries) {
            var attempts = retries || 0;

            if (initAutocomplete(group)) {
                return;
            }

            if (attempts >= 20) {
                return;
            }

            window.setTimeout(function() {
                waitForGoogleMapsAndInit(group, attempts + 1);
            }, 250);
        }

        function handlePlaceInput(group) {
            clearTimeout(group.inputTimeout);
            resetLocationFields(group);
            showStatus(statusEl, '', '');

            var inputValue = normalizeInput(group.placeInput.value);
            var cachedResult = getCachedResult(group, inputValue);

            if (cachedResult) {
                group.latitudeInput.value = cachedResult.latitude;
                group.longitudeInput.value = cachedResult.longitude;
                group.timezoneInput.value = cachedResult.timezone || '';
                showStatus(statusEl, cachedResult.timezone ? 'Location confirmed (cached).' : 'Location found in cache.', 'success');
                return;
            }

            if (inputValue.length < minChars) {
                return;
            }

            // Autocomplete initializes only after 3 words and user pause.
            group.inputTimeout = window.setTimeout(function() {
                waitForGoogleMapsAndInit(group);
            }, 400);
        }

        function attachPlaceInputListener(group) {
            group.placeInput.addEventListener('input', function() {
                handlePlaceInput(group);
            });
        }

        locationGroups.forEach(function(group) {
            attachPlaceInputListener(group);
        });

        form.addEventListener('submit', function(event) {
            var hasValidationError = false;

            locationGroups.forEach(function(group) {
                if (hasValidationError) {
                    return;
                }

                var placeValue = group.placeInput.value ? group.placeInput.value.trim() : '';
                var latitudeValue = group.latitudeInput.value ? group.latitudeInput.value.trim() : '';
                var longitudeValue = group.longitudeInput.value ? group.longitudeInput.value.trim() : '';
                var timezoneValue = group.timezoneInput.value ? group.timezoneInput.value.trim() : '';

                if (!placeValue || !latitudeValue || !longitudeValue) {
                    event.preventDefault();
                    showStatus(statusEl, (config.messages ? config.messages.placeRequired : 'Please select a valid place.') + ' (' + group.label + ')', 'error');
                    hasValidationError = true;
                    return;
                }

                if (!timezoneValue) {
                    event.preventDefault();
                    showStatus(statusEl, (config.messages ? config.messages.timezonePending : 'Timezone is still loading.') + ' (' + group.label + ')', 'error');
                    hasValidationError = true;
                }
            });

            if (hasValidationError) {
                return;
            }

            setLoading(form, true);
        });

        // Do not initialize autocomplete immediately to avoid API calls on early typing.
    }

    ready(function() {
        document.querySelectorAll('[data-jyotisham-astro-pdf-form]').forEach(initForm);
    });
})();
