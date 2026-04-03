jQuery(document).ready(function($) {
    'use strict';

    // Test API Connection
    $('.jyotisham-test-api').on('click', function(e) {
        e.preventDefault();
        
        const button = $(this);
        const originalText = button.text();
        
        // Show loading state
        button.addClass('loading').text('Testing...');
        
        // Get API key
        const apiKey = $('#jyotisham_api_key').val();
        
        if (!apiKey) {
            showMessage('Please enter an API key first.', 'error');
            button.removeClass('loading').text(originalText);
            return;
        }
        
        // Make AJAX request to test API
        $.ajax({
            url: ajaxurl,
            type: 'POST',
            data: {
                action: 'jyotisham_test_api',
                api_key: apiKey,
                nonce: $('#jyotisham_nonce').val()
            },
            success: function(response) {
                if (response.success) {
                    showMessage('API connection successful!', 'success');
                    updateApiStatus('connected');
                } else {
                    showMessage('API connection failed: ' + response.data, 'error');
                    updateApiStatus('disconnected');
                }
            },
            error: function() {
                showMessage('Network error occurred while testing API.', 'error');
                updateApiStatus('disconnected');
            },
            complete: function() {
                button.removeClass('loading').text(originalText);
            }
        });
    });
    
    // Copy to Clipboard functionality
    $('.jyotisham-copy-btn').on('click', function(e) {
        e.preventDefault();
        
        const button = $(this);
        const shortcode = button.siblings('code').text();
        
        if (navigator.clipboard) {
            navigator.clipboard.writeText(shortcode).then(function() {
                showCopySuccess(button);
            }).catch(function() {
                fallbackCopyTextToClipboard(shortcode, button);
            });
        } else {
            fallbackCopyTextToClipboard(shortcode, button);
        }
    });
    
    // Form validation
    $('#jyotisham-settings-form').on('submit', function(e) {
        const apiKey = $('#jyotisham_api_key').val();
        const googleMapsKey = $('#jyotisham_google_maps_key').val();
        
        if (!apiKey) {
            e.preventDefault();
            showMessage('JyotishamAstro API key is required.', 'error');
            $('#jyotisham_api_key').focus();
            return false;
        }
        
        if (!googleMapsKey) {
            e.preventDefault();
            showMessage('Google Maps API key is required.', 'error');
            $('#jyotisham_google_maps_key').focus();
            return false;
        }
    });
    
    // Real-time API key validation
    $('#jyotisham_api_key').on('input', function() {
        const apiKey = $(this).val();
        const statusIndicator = $('.jyotisham-status-indicator');
        
        if (apiKey.length > 0) {
            statusIndicator.removeClass('jyotisham-status-disconnected')
                          .addClass('jyotisham-status-validating');
            $('.jyotisham-status-text').text('Validating...');
        } else {
            statusIndicator.removeClass('jyotisham-status-validating')
                          .addClass('jyotisham-status-disconnected');
            $('.jyotisham-status-text').text('Disconnected');
        }
    });
    
    // Auto-save settings
    let saveTimeout;
    $('input[name="jyotisham_api_key"], input[name="jyotisham_google_maps_key"]').on('input', function() {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(function() {
            autoSaveSettings();
        }, 2000);
    });
    
    // Initialize tooltips
    $('[data-tooltip]').each(function() {
        const tooltip = $(this).data('tooltip');
        $(this).attr('title', tooltip);
    });
    
    // Show/hide advanced options
    $('.jyotisham-toggle-advanced').on('click', function(e) {
        e.preventDefault();
        const target = $($(this).data('target'));
        target.slideToggle();
        $(this).text(target.is(':visible') ? 'Hide Advanced' : 'Show Advanced');
    });
    
    // Initialize status indicators
    initializeStatusIndicators();
    
    // Functions
    function showMessage(message, type) {
        const messageClass = 'jyotisham-message jyotisham-' + type;
        const messageHtml = '<div class="' + messageClass + '">' + message + '</div>';
        
        // Remove existing messages
        $('.jyotisham-message').remove();
        
        // Add new message
        $('.wrap h1').after(messageHtml);
        
        // Auto-hide success messages
        if (type === 'success') {
            setTimeout(function() {
                $('.jyotisham-message').fadeOut();
            }, 5000);
        }
    }
    
    function showCopySuccess(button) {
        const originalText = button.text();
        button.text('Copied!').addClass('jyotisham-copied');
        
        setTimeout(function() {
            button.text(originalText).removeClass('jyotisham-copied');
        }, 2000);
    }
    
    function fallbackCopyTextToClipboard(text, button) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            showCopySuccess(button);
        } catch (err) {
            showMessage('Failed to copy to clipboard. Please copy manually.', 'error');
        }
        
        document.body.removeChild(textArea);
    }
    
    function updateApiStatus(status) {
        const statusIndicator = $('.jyotisham-status-indicator');
        const statusText = $('.jyotisham-status-text');
        const statusBadge = $('.jyotisham-status-badge');
        
        statusIndicator.removeClass('jyotisham-status-connected jyotisham-status-disconnected jyotisham-status-validating');
        statusIndicator.addClass('jyotisham-status-' + status);
        
        const statusLabels = {
            'connected': 'Connected',
            'disconnected': 'Disconnected',
            'validating': 'Validating...'
        };
        
        statusText.text(statusLabels[status] || 'Unknown');
        statusBadge.removeClass('jyotisham-status-connected jyotisham-status-disconnected')
                  .addClass('jyotisham-status-' + status);
    }
    
    function autoSaveSettings() {
        const apiKey = $('#jyotisham_api_key').val();
        const googleMapsKey = $('#jyotisham_google_maps_key').val();
        
        if (!apiKey || !googleMapsKey) {
            return;
        }
        
        $.ajax({
            url: ajaxurl,
            type: 'POST',
            data: {
                action: 'jyotisham_auto_save',
                api_key: apiKey,
                google_maps_key: googleMapsKey,
                nonce: $('#jyotisham_nonce').val()
            },
            success: function(response) {
                if (response.success) {
                    console.log('Settings auto-saved');
                }
            }
        });
    }
    
    function initializeStatusIndicators() {
        // Add pulsing animation to status dots
        $('.jyotisham-status-dot').each(function() {
            const dot = $(this);
            const status = dot.closest('.jyotisham-status-indicator').hasClass('jyotisham-status-connected') ? 'connected' : 'disconnected';
            
            if (status === 'connected') {
                dot.css('animation', 'pulse 2s infinite');
            }
        });
    }
    
    // Add CSS for copied state
    $('<style>')
        .prop('type', 'text/css')
        .html(`
            .jyotisham-copied {
                background: #10b981 !important;
                color: white !important;
            }
            .jyotisham-status-validating {
                background: #fef3c7;
                color: #92400e;
                border: 1px solid #fbbf24;
            }
        `)
        .appendTo('head');
});
