// Horoscope Generator JavaScript - WordPress AJAX Version
// Secure server-side API handling to protect API keys

(function($) {
    'use strict';

    // Get plugin URL from localized script or use default
    const pluginUrl = (typeof jyotishamHoroscope !== 'undefined' && jyotishamHoroscope.pluginUrl) 
        ? jyotishamHoroscope.pluginUrl 
        : '';

    // Zodiac signs data with Unicode symbols (fallback) and optional image paths
    const zodiacSigns = [
        { id: 1, name: 'Aries', symbol: '♈', image: 'ic_horo_aries.png' },
        { id: 2, name: 'Taurus', symbol: '♉', image: 'ic_horo_taurus.png' },
        { id: 3, name: 'Gemini', symbol: '♊', image: 'ic_horo_gemini.png' },
        { id: 4, name: 'Cancer', symbol: '♋', image: 'ic_horo_cancer.png' },
        { id: 5, name: 'Leo', symbol: '♌', image: 'ic_horo_leo.png' },
        { id: 6, name: 'Virgo', symbol: '♍', image: 'ic_horo_virgo.png' },
        { id: 7, name: 'Libra', symbol: '♎', image: 'ic_horo_libra.png' },
        { id: 8, name: 'Scorpio', symbol: '♏', image: 'ic_horo_scorpio.png' },
        { id: 9, name: 'Sagittarius', symbol: '♐', image: 'ic_horo_sagittarius.png' },
        { id: 10, name: 'Capricorn', symbol: '♑', image: 'ic_horo_capricorn.png' },
        { id: 11, name: 'Aquarius', symbol: '♒', image: 'ic_horo_aquarius.png' },
        { id: 12, name: 'Pisces', symbol: '♓', image: 'ic_horo_pisces.png' }
    ];

    // State
    let selectedZodiac = null;
    let currentTab = 'daily';
    let currentDay = 'today';
    let currentLang = 'en';
    
    // Cache configuration
    const CACHE_PREFIX = 'jyotisham_horoscope_';
    const CACHE_DURATION = {
        daily: 60 * 60 * 1000,      // 1 hour for daily
        weekly: 24 * 60 * 60 * 1000, // 24 hours for weekly
        monthly: 24 * 60 * 60 * 1000, // 24 hours for monthly
        yearly: 7 * 24 * 60 * 60 * 1000 // 7 days for yearly
    };
    
    // Generate cache key
    function getCacheKey(zodiacId, type, day, year, lang) {
        let key = CACHE_PREFIX + zodiacId + '_' + type + '_' + lang;
        if (type === 'daily' && day) {
            key += '_' + day;
        }
        if (type === 'yearly' && year) {
            key += '_' + year;
        }
        return key;
    }
    
    // Get cached data
    function getCachedData(zodiacId, type, day, year, lang) {
        try {
            const cacheKey = getCacheKey(zodiacId, type, day, year, lang);
            const cached = localStorage.getItem(cacheKey);
            
            if (!cached) {
                return null;
            }
            
            const cacheData = JSON.parse(cached);
            const now = new Date().getTime();
            const cacheDuration = CACHE_DURATION[type] || CACHE_DURATION.daily;
            
            // Check if cache is expired
            if (now - cacheData.timestamp > cacheDuration) {
                localStorage.removeItem(cacheKey);
                return null;
            }
            
            return cacheData.data;
        } catch (e) {
            console.error('Error reading cache:', e);
            return null;
        }
    }
    
    // Save data to cache
    function saveToCache(zodiacId, type, day, year, lang, data) {
        try {
            const cacheKey = getCacheKey(zodiacId, type, day, year, lang);
            const cacheData = {
                timestamp: new Date().getTime(),
                data: data
            };
            localStorage.setItem(cacheKey, JSON.stringify(cacheData));
        } catch (e) {
            console.error('Error saving cache:', e);
            // If localStorage is full, try to clear old cache entries
            try {
                clearOldCache();
                localStorage.setItem(cacheKey, JSON.stringify(cacheData));
            } catch (e2) {
                console.error('Failed to save cache after cleanup:', e2);
            }
        }
    }
    
    // Clear old cache entries
    function clearOldCache() {
        try {
            const now = new Date().getTime();
            const keysToRemove = [];
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(CACHE_PREFIX)) {
                    try {
                        const cached = JSON.parse(localStorage.getItem(key));
                        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days max
                        if (now - cached.timestamp > maxAge) {
                            keysToRemove.push(key);
                        }
                    } catch (e) {
                        keysToRemove.push(key);
                    }
                }
            }
            
            keysToRemove.forEach(function(key) {
                localStorage.removeItem(key);
            });
        } catch (e) {
            console.error('Error clearing old cache:', e);
        }
    }

    // Initialize
    $(document).ready(function() {
        const container = $('.jyotisham-horoscope-container');
        if (container.length === 0) return;

        initializeZodiacGrid();
        setupEventListeners();
        
        // Set initial language from dropdown
        const langSelect = $('#jyotisham-horoscope-language');
        if (langSelect.length) {
            currentLang = langSelect.val();
        }
    });

    // Initialize zodiac grid
    function initializeZodiacGrid() {
        const grid = $('#jyotisham-horoscope-zodiac-grid');
        if (grid.length === 0) return;

        grid.empty();

        zodiacSigns.forEach(function(sign) {
            // Try to use image if available, otherwise use Unicode symbol
            let iconHtml = '';
            if (pluginUrl && sign.image) {
                const imagePath = pluginUrl + 'assets/images/zodiac/' + sign.image;
                iconHtml = '<img src="' + imagePath + '" alt="' + sign.name + '" class="jyotisham-horoscope-zodiac-icon-img" onerror="this.style.display=\'none\'; this.nextElementSibling.style.display=\'block\';">' +
                          '<span class="jyotisham-horoscope-zodiac-icon-symbol" style="display:none;">' + sign.symbol + '</span>';
            } else {
                iconHtml = '<span class="jyotisham-horoscope-zodiac-icon-symbol">' + sign.symbol + '</span>';
            }

            const card = $('<div>')
                .addClass('jyotisham-horoscope-zodiac-card')
                .attr('data-zodiac-id', sign.id)
                .html(
                    '<div class="jyotisham-horoscope-zodiac-icon">' + iconHtml + '</div>' +
                    '<div class="jyotisham-horoscope-zodiac-name">' + sign.name + '</div>'
                )
                .on('click', function() {
                    selectZodiac(sign);
                });
            grid.append(card);
        });
    }

    // Setup event listeners
    function setupEventListeners() {
        // Tab buttons
        $(document).on('click', '.jyotisham-horoscope-tab-btn', function() {
            const tab = $(this).data('tab');
            switchTab(tab);
        });

        // Language selector
        $(document).on('change', '#jyotisham-horoscope-language', function() {
            currentLang = $(this).val();
            if (selectedZodiac) {
                loadHoroscope(selectedZodiac.id, currentTab);
            }
        });
    }

    // Select zodiac sign
    function selectZodiac(sign) {
        // Update selected state
        $('.jyotisham-horoscope-zodiac-card').removeClass('jyotisham-horoscope-selected');
        $('[data-zodiac-id="' + sign.id + '"]').addClass('jyotisham-horoscope-selected');

        selectedZodiac = sign;
        currentTab = 'daily';
        
        // Update horoscope title
        $('#jyotisham-selected-zodiac-name').text(sign.name);
        
        // Update tabs
        $('.jyotisham-horoscope-tab-btn').removeClass('jyotisham-horoscope-active');
        $('[data-tab="daily"]').addClass('jyotisham-horoscope-active');

        // Reset day to today when selecting new zodiac
        currentDay = 'today';

        // Show horoscope section and load horoscope
        showHoroscopeSection();
        const content = $('#jyotisham-horoscope-content');
        content.html(createSpinnerLoader('Loading horoscope...'));
        
        setTimeout(function() {
            loadHoroscope(sign.id, 'daily');
        }, 300);
    }

    // Switch tab
    function switchTab(tab) {
        currentTab = tab;
        
        // Reset day to today when switching away from daily
        if (tab !== 'daily') {
            currentDay = 'today';
        }
        
        // Update tab buttons
        $('.jyotisham-horoscope-tab-btn').removeClass('jyotisham-horoscope-active');
        $('[data-tab="' + tab + '"]').addClass('jyotisham-horoscope-active');

        // Load horoscope for selected tab
        if (selectedZodiac) {
            const content = $('#jyotisham-horoscope-content');
            content.html(createSpinnerLoader('Loading horoscope...'));
            
            setTimeout(function() {
                loadHoroscope(selectedZodiac.id, tab);
            }, 300);
        }
    }

    // Show horoscope section
    function showHoroscopeSection() {
        const horoscopeSection = $('#jyotisham-horoscope-section');
        horoscopeSection.show();
        
        setTimeout(function() {
            $('html, body').animate({
                scrollTop: horoscopeSection.offset().top - 50
            }, 500);
        }, 100);
    }

    // Load horoscope data via WordPress AJAX with caching
    function loadHoroscope(zodiacId, type) {
        const content = $('#jyotisham-horoscope-content');
        
        // Check cache first
        const day = (type === 'daily') ? currentDay : null;
        const year = (type === 'yearly') ? new Date().getFullYear() : null;
        const cachedData = getCachedData(zodiacId, type, day, year, currentLang);
        
        if (cachedData) {
            // Use cached data - display immediately without API call
            displayHoroscope(cachedData, type);
            return;
        }
        
        // Show loading skeleton
        content.html(createSkeletonShimmer(type));

        const formData = {
            action: 'jyotisham_get_horoscope',
            nonce: jyotishamHoroscope.nonce,
            type: type,
            zodiac: zodiacId,
            lang: currentLang
        };

        if (type === 'daily') {
            formData.day = currentDay;
        } else if (type === 'yearly') {
            formData.year = new Date().getFullYear();
        }

        $.ajax({
            url: jyotishamHoroscope.ajaxUrl,
            type: 'POST',
            data: formData,
            success: function(response) {
                if (response.success && response.data && response.data.response) {
                    const horoscopeData = response.data.response;
                    
                    // Save to cache
                    saveToCache(zodiacId, type, day, year, currentLang, horoscopeData);
                    
                    // Display the data
                    displayHoroscope(horoscopeData, type);
                } else {
                    showError('Failed to load horoscope data');
                }
            },
            error: function(xhr, status, error) {
                console.error('Error loading horoscope:', error);
                showError('Error loading horoscope. Please try again.');
            }
        });
    }

    // Display horoscope data
    function displayHoroscope(data, type) {
        const content = $('#jyotisham-horoscope-content');
        let html = '';

        switch (type) {
            case 'daily':
                html = displayDailyHoroscope(data);
                break;
            case 'weekly':
                html = displayWeeklyHoroscope(data);
                break;
            case 'monthly':
                html = displayMonthlyHoroscope(data);
                break;
            case 'yearly':
                html = displayYearlyHoroscope(data);
                break;
        }

        content.html(html);
        
        // Setup sub-tabs for daily view
        if (type === 'daily') {
            setupDailySubTabs();
        }
    }

    // Setup daily sub-tabs (today/tomorrow/yesterday)
    function setupDailySubTabs() {
        $('.jyotisham-horoscope-sub-tab-btn').remove();
        
        const datePeriod = $('.jyotisham-horoscope-date-period');
        if (datePeriod.length) {
            const subTabsContainer = $('<div>').addClass('jyotisham-horoscope-sub-tabs');
            const yesterdayBtn = $('<button>')
                .addClass('jyotisham-horoscope-sub-tab-btn' + (currentDay === 'yesterday' ? ' jyotisham-horoscope-active' : ''))
                .attr('data-day', 'yesterday')
                .text('Yesterday');
            const todayBtn = $('<button>')
                .addClass('jyotisham-horoscope-sub-tab-btn' + (currentDay === 'today' ? ' jyotisham-horoscope-active' : ''))
                .attr('data-day', 'today')
                .text('Today');
            const tomorrowBtn = $('<button>')
                .addClass('jyotisham-horoscope-sub-tab-btn' + (currentDay === 'tomorrow' ? ' jyotisham-horoscope-active' : ''))
                .attr('data-day', 'tomorrow')
                .text('Tomorrow');
            
            subTabsContainer.append(yesterdayBtn, todayBtn, tomorrowBtn);
            datePeriod.after(subTabsContainer);
            
            $('.jyotisham-horoscope-sub-tab-btn').on('click', function() {
                const day = $(this).data('day');
                currentDay = day;
                $('.jyotisham-horoscope-sub-tab-btn').removeClass('jyotisham-horoscope-active');
                $(this).addClass('jyotisham-horoscope-active');
                if (selectedZodiac) {
                    loadHoroscope(selectedZodiac.id, 'daily');
                }
            });
        }
    }

    // Display daily horoscope
    function displayDailyHoroscope(data) {
        let html = '';

        if (data.date) {
            html += '<div class="jyotisham-horoscope-date-period">' + escapeHtml(data.date) + '</div>';
        }

        html += '<div class="jyotisham-horoscope-lucky-info">';
        if (data.lucky_color) {
            const colorCode = data.color_code || '#008080';
            html += '<div class="jyotisham-horoscope-lucky-item">' +
                '<div class="jyotisham-horoscope-lucky-color-box" style="background-color: ' + colorCode + ';"></div>' +
                '<div><span class="jyotisham-horoscope-lucky-label">Lucky Color:</span> ' +
                '<span class="jyotisham-horoscope-lucky-value">' + escapeHtml(data.lucky_color) + '</span></div></div>';
        }
        if (data.lucky_numbers && data.lucky_numbers.length > 0) {
            html += '<div class="jyotisham-horoscope-lucky-item">' +
                '<span class="jyotisham-horoscope-lucky-label">Lucky Numbers:</span> ' +
                '<span class="jyotisham-horoscope-lucky-value">' + data.lucky_numbers.join(', ') + '</span></div>';
        }
        html += '</div>';

        html += '<div class="jyotisham-horoscope-category-list">';

        const categories = [
            { key: 'total', name: 'Total', priority: 1 },
            { key: 'health', name: 'Health', priority: 2 },
            { key: 'friends', name: 'Friends', priority: 3 },
            { key: 'family', name: 'Family', priority: 4 },
            { key: 'travel', name: 'Travel', priority: 5 },
            { key: 'career', name: 'Career', priority: 6 },
            { key: 'relationship', name: 'Relationship', priority: 7 },
            { key: 'finance', name: 'Finance', priority: 8 },
            { key: 'status', name: 'Status', priority: 9 },
            { key: 'physique', name: 'Physique', priority: 10 }
        ];

        const availableCategories = categories
            .filter(function(cat) { return data[cat.key] !== undefined; })
            .sort(function(a, b) { return a.priority - b.priority; });

        availableCategories.forEach(function(cat) {
            if (cat.key === 'total' && data.horoscope_data) {
                html += createTotalCategoryItem(cat.name, data[cat.key], data.horoscope_data);
            } else {
                html += createCategoryItem(cat.name, data[cat.key], '');
            }
        });

        html += '</div>';
        return html;
    }

    // Display weekly horoscope
    function displayWeeklyHoroscope(data) {
        let html = '';

        if (data.week) {
            html += '<div class="jyotisham-horoscope-date-period">' + escapeHtml(data.week) + '</div>';
        }

        html += '<div class="jyotisham-horoscope-lucky-info">';
        if (data.lucky_color) {
            const colorCode = data.color_code || '#008080';
            html += '<div class="jyotisham-horoscope-lucky-item">' +
                '<div class="jyotisham-horoscope-lucky-color-box" style="background-color: ' + colorCode + ';"></div>' +
                '<div><span class="jyotisham-horoscope-lucky-label">Lucky Color:</span> ' +
                '<span class="jyotisham-horoscope-lucky-value">' + escapeHtml(data.lucky_color) + '</span></div></div>';
        }
        if (data.lucky_numbers && data.lucky_numbers.length > 0) {
            html += '<div class="jyotisham-horoscope-lucky-item">' +
                '<span class="jyotisham-horoscope-lucky-label">Lucky Numbers:</span> ' +
                '<span class="jyotisham-horoscope-lucky-value">' + data.lucky_numbers.join(', ') + '</span></div>';
        }
        html += '</div>';

        html += '<div class="jyotisham-horoscope-category-list">';

        const categories = [
            { key: 'total', name: 'Total', priority: 1 },
            { key: 'health', name: 'Health', priority: 2 },
            { key: 'friends', name: 'Friends', priority: 3 },
            { key: 'family', name: 'Family', priority: 4 },
            { key: 'travel', name: 'Travel', priority: 5 },
            { key: 'career', name: 'Career', priority: 6 },
            { key: 'relationship', name: 'Relationship', priority: 7 },
            { key: 'finance', name: 'Finance', priority: 8 },
            { key: 'status', name: 'Status', priority: 9 },
            { key: 'physique', name: 'Physique', priority: 10 }
        ];

        const availableCategories = categories
            .filter(function(cat) { return data[cat.key] !== undefined; })
            .sort(function(a, b) { return a.priority - b.priority; });

        availableCategories.forEach(function(cat) {
            if (cat.key === 'total' && data.horoscope_data) {
                html += createTotalCategoryItem(cat.name, data[cat.key], data.horoscope_data);
            } else {
                html += createCategoryItem(cat.name, data[cat.key], '');
            }
        });

        html += '</div>';
        return html;
    }

    // Display monthly horoscope
    function displayMonthlyHoroscope(data) {
        let html = '';

        if (data.month) {
            html += '<div class="jyotisham-horoscope-date-period">' + escapeHtml(data.month) + '</div>';
        }

        html += '<div class="jyotisham-horoscope-monthly-info">';
        if (data.standout_days) {
            html += '<div class="jyotisham-horoscope-monthly-item">' +
                '<div class="jyotisham-horoscope-monthly-item-label">Standout Days</div>' +
                '<div class="jyotisham-horoscope-monthly-item-value">' + escapeHtml(data.standout_days) + '</div></div>';
        }
        if (data.challenging_days) {
            html += '<div class="jyotisham-horoscope-monthly-item">' +
                '<div class="jyotisham-horoscope-monthly-item-label">Challenging Days</div>' +
                '<div class="jyotisham-horoscope-monthly-item-value">' + escapeHtml(data.challenging_days) + '</div></div>';
        }
        html += '</div>';

        if (data.horoscope_data) {
            html += '<div class="jyotisham-horoscope-category-description-total" style="margin-bottom: 24px;">' +
                escapeHtml(data.horoscope_data) + '</div>';
        }

        html += '<div class="jyotisham-horoscope-category-list">';

        const categories = [
            { key: 'total', name: 'Total', priority: 1 },
            { key: 'health', name: 'Health', priority: 2 },
            { key: 'friends', name: 'Friends', priority: 3 },
            { key: 'family', name: 'Family', priority: 4 },
            { key: 'travel', name: 'Travel', priority: 5 },
            { key: 'career', name: 'Career', priority: 6 },
            { key: 'love', name: 'Love', priority: 7 },
            { key: 'finances', name: 'Finances', priority: 8 },
            { key: 'status', name: 'Status', priority: 9 }
        ];

        const availableCategories = categories
            .filter(function(cat) { return data[cat.key] !== undefined; })
            .sort(function(a, b) { return a.priority - b.priority; });

        availableCategories.forEach(function(cat) {
            html += createCategoryItem(cat.name, data[cat.key], '');
        });

        html += '</div>';
        return html;
    }

    // Display yearly horoscope
    function displayYearlyHoroscope(data) {
        let html = '';
        const phases = ['phase_1', 'phase_2', 'phase_3', 'phase_4'];
        
        phases.forEach(function(phaseKey) {
            const phase = data[phaseKey];
            if (phase) {
                html += '<div class="jyotisham-horoscope-yearly-phase">';
                
                html += '<div class="jyotisham-horoscope-phase-header">';
                html += '<div class="jyotisham-horoscope-phase-title">' + escapeHtml(phase.period || phaseKey) + '</div>';
                if (phase.score) {
                    html += '<div class="jyotisham-horoscope-phase-score">' + escapeHtml(phase.score) + '</div>';
                }
                html += '</div>';

                if (phase.prediction) {
                    html += '<div class="jyotisham-horoscope-phase-prediction">' + escapeHtml(phase.prediction) + '</div>';
                }

                html += '<div class="jyotisham-horoscope-yearly-categories">';
                
                const yearlyCategories = [
                    'health', 'career', 'relationship', 'travel', 
                    'family', 'friends', 'finances', 'status', 'education'
                ];

                yearlyCategories.forEach(function(catKey) {
                    if (phase[catKey]) {
                        const cat = phase[catKey];
                        html += '<div class="jyotisham-horoscope-yearly-category">' +
                            '<div class="jyotisham-horoscope-yearly-category-header">' +
                            '<div class="jyotisham-horoscope-yearly-category-name">' + catKey + '</div>';
                        if (cat.score) {
                            html += '<div class="jyotisham-horoscope-yearly-category-score">' + escapeHtml(cat.score) + '</div>';
                        }
                        html += '</div>';
                        if (cat.prediction) {
                            html += '<div class="jyotisham-horoscope-yearly-category-prediction">' + escapeHtml(cat.prediction) + '</div>';
                        }
                        html += '</div>';
                    }
                });

                html += '</div></div>';
            }
        });

        return html;
    }

    // Create category item
    function createCategoryItem(name, percentage, description) {
        const className = name.toLowerCase();
        const hasDescription = description && description.trim() !== '';
        const itemClass = hasDescription ? 'jyotisham-horoscope-category-item' : 'jyotisham-horoscope-category-item jyotisham-horoscope-category-item-no-desc';
        
        if (!hasDescription) {
            return '<div class="' + itemClass + '">' +
                '<div class="jyotisham-horoscope-category-label">' + escapeHtml(name) + '</div>' +
                '<div class="jyotisham-horoscope-category-percentage ' + className + '">' +
                '<div class="jyotisham-horoscope-percentage-value">' + percentage + '%</div></div></div>';
        }
        
        return '<div class="' + itemClass + '">' +
            '<div class="jyotisham-horoscope-category-percentage ' + className + '">' +
            '<div class="jyotisham-horoscope-percentage-value">' + percentage + '%</div>' +
            '<div class="jyotisham-horoscope-category-name">' + escapeHtml(name) + '</div></div>' +
            '<div class="jyotisham-horoscope-category-description">' + escapeHtml(description) + '</div></div>';
    }

    // Create Total category item
    function createTotalCategoryItem(name, percentage, description) {
        const className = name.toLowerCase();
        return '<div class="jyotisham-horoscope-category-item jyotisham-horoscope-category-item-total">' +
            '<div class="jyotisham-horoscope-category-description jyotisham-horoscope-category-description-total">' + escapeHtml(description) + '</div>' +
            '<div class="jyotisham-horoscope-category-percentage ' + className + '">' +
            '<div class="jyotisham-horoscope-percentage-value">' + percentage + '%</div>' +
            '<div class="jyotisham-horoscope-category-name">' + escapeHtml(name) + '</div></div></div>';
    }

    // Create spinner loader
    function createSpinnerLoader(text) {
        return '<div class="jyotisham-horoscope-spinner-container">' +
            '<div class="jyotisham-horoscope-spinner"></div>' +
            '<p class="jyotisham-horoscope-loading-text">' + escapeHtml(text) + '</p></div>';
    }

    // Create skeleton shimmer loader
    function createSkeletonShimmer(type) {
        let html = '<div class="jyotisham-horoscope-skeleton-container">';
        html += '<div class="jyotisham-horoscope-shimmer jyotisham-horoscope-skeleton-date"></div>';
        html += '<div class="jyotisham-horoscope-shimmer jyotisham-horoscope-shimmer-lucky">';
        html += '<div class="jyotisham-horoscope-shimmer jyotisham-horoscope-shimmer-lucky-item"></div>';
        html += '<div class="jyotisham-horoscope-shimmer jyotisham-horoscope-shimmer-lucky-item"></div>';
        html += '</div>';
        html += '<div class="jyotisham-horoscope-skeleton-category-list">';
        for (let i = 0; i < 8; i++) {
            html += '<div class="jyotisham-horoscope-shimmer jyotisham-horoscope-shimmer-category"></div>';
        }
        html += '</div></div>';
        return html;
    }

    // Show error message
    function showError(message) {
        const content = $('#jyotisham-horoscope-content');
        content.html('<div class="jyotisham-horoscope-error-message"><p>' + escapeHtml(message) + '</p></div>');
    }

    // Escape HTML
    function escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text ? text.replace(/[&<>"']/g, function(m) { return map[m]; }) : '';
    }

})(jQuery);
