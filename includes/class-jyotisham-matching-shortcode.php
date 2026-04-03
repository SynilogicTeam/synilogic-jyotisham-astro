<?php
/**
 * Shortcode handler for Jyotisham Kundli Matching Generator
 */

if (!defined('ABSPATH')) {
    exit;
}

class Jyotisham_Matching_Shortcode {
    
    public function __construct() {
        add_shortcode('jyotisham_matching', array($this, 'render_matching_shortcode'));
    }
    
    /**
     * Render the Kundli Matching Generator shortcode
     */
    public function render_matching_shortcode($atts) {
        $atts = shortcode_atts(array(
            'language' => 'en',
            'title' => 'Kundli Matching Generator',
            'description' => 'Check compatibility between two people using JyotishamAstro API'
        ), $atts);
        
        // Check if API is configured
        $api_status = get_option('jyotisham_api_status', 'disconnected');
        if ($api_status !== 'connected') {
            return $this->render_error_message('API not configured. Please contact the administrator.');
        }
        
        // Enqueue assets directly when shortcode is rendered
        // This ensures CSS/JS loads regardless of how shortcode is added (page builder, widget, theme template, etc.)
        $google_maps_key = get_option('jyotisham_google_maps_key', '');
        
        // Enqueue Google Maps API if key is available
        if (!empty($google_maps_key)) {
            wp_enqueue_script(
                'google-maps-api',
                'https://maps.googleapis.com/maps/api/js?key=' . $google_maps_key . '&libraries=places&loading=async',
                array(),
                JYOTISHAM_ASTRO_API_PLUGIN_VERSION,
                true
            );
        }
        
        // Enqueue main plugin styles
        wp_enqueue_style(
            'jyotisham-astro-api-style',
            JYOTISHAM_ASTRO_API_PLUGIN_URL . 'assets/css/style.css',
            array(),
            JYOTISHAM_ASTRO_API_PLUGIN_VERSION
        );
        
        // Enqueue matching-specific styles
        wp_enqueue_style(
            'jyotisham-matching-style',
            JYOTISHAM_ASTRO_API_PLUGIN_URL . 'assets/css/matching.css',
            array('jyotisham-astro-api-style'),
            JYOTISHAM_ASTRO_API_PLUGIN_VERSION
        );
        
        // Enqueue main plugin scripts
        wp_enqueue_script(
            'jyotisham-astro-api-script',
            JYOTISHAM_ASTRO_API_PLUGIN_URL . 'assets/js/script.js',
            array('jquery'),
            JYOTISHAM_ASTRO_API_PLUGIN_VERSION,
            true
        );
        
        // Enqueue matching-specific scripts
        wp_enqueue_script(
            'jyotisham-matching-script',
            JYOTISHAM_ASTRO_API_PLUGIN_URL . 'assets/js/matching.js',
            array('jquery', 'jyotisham-astro-api-script'),
            JYOTISHAM_ASTRO_API_PLUGIN_VERSION,
            true
        );
        
        wp_enqueue_script(
            'jyotisham-matching-display-script',
            JYOTISHAM_ASTRO_API_PLUGIN_URL . 'assets/js/matching-display.js',
            array('jquery', 'jyotisham-matching-script'),
            JYOTISHAM_ASTRO_API_PLUGIN_VERSION,
            true
        );
        
        // Localize scripts with AJAX URL and nonce
        wp_localize_script('jyotisham-astro-api-script', 'jyotisham_ajax', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('jyotisham_nonce'),
            'google_maps_key' => $google_maps_key
        ));
        
        wp_localize_script('jyotisham-matching-script', 'jyotisham_ajax', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('jyotisham_nonce'),
            'google_maps_key' => $google_maps_key
        ));
        
        // Generate unique ID for this instance
        $instance_id = 'jyotisham-matching-' . uniqid();
        
        ob_start();
        ?>
        <div id="<?php echo esc_attr($instance_id); ?>" class="jyotisham-container jyotisham-matching-container">
            <header class="jyotisham-header">
                <h1>💕 <?php echo esc_html($atts['title']); ?></h1>
                <p><?php echo esc_html($atts['description']); ?></p>
            </header>

            <!-- User Input Form -->
            <div class="jyotisham-form-container">
                <form id="jyotisham-matching-form" class="jyotisham-form">
                    <!-- Boy's Details -->
                    <div class="jyotisham-person-section">
                        <h3 class="jyotisham-section-title">👨 Boy's Details</h3>
                        <div class="jyotisham-form-group">
                            <label for="jyotisham-boy-name">Name:</label>
                            <input type="text" id="jyotisham-boy-name" name="boy_name" required />
                        </div>

                        <div class="jyotisham-form-group">
                            <label for="jyotisham-boy-dateOfBirth">Date of Birth:</label>
                            <input type="date" id="jyotisham-boy-dateOfBirth" name="boy_dateOfBirth" required />
                        </div>

                        <div class="jyotisham-form-group">
                            <label for="jyotisham-boy-timeOfBirth">Time of Birth:</label>
                            <input type="time" id="jyotisham-boy-timeOfBirth" name="boy_timeOfBirth" required />
                        </div>

                        <div class="jyotisham-form-group">
                            <label for="jyotisham-boy-placeOfBirth">Place of Birth:</label>
                            <div class="jyotisham-search-input-container">
                                <input type="text" id="jyotisham-boy-placeOfBirth" name="boy_placeOfBirth" 
                                       placeholder="Enter boy's place of birth" required autocomplete="off" />
                            </div>
                            <input type="hidden" id="jyotisham-boy-latitude" name="boy_latitude" />
                            <input type="hidden" id="jyotisham-boy-longitude" name="boy_longitude" />
                            <input type="hidden" id="jyotisham-boy-timezone" name="boy_timezone" />
                        </div>
                    </div>

                    <!-- Girl's Details -->
                    <div class="jyotisham-person-section">
                        <h3 class="jyotisham-section-title">👩 Girl's Details</h3>
                        <div class="jyotisham-form-group">
                            <label for="jyotisham-girl-name">Name:</label>
                            <input type="text" id="jyotisham-girl-name" name="girl_name" required />
                        </div>

                        <div class="jyotisham-form-group">
                            <label for="jyotisham-girl-dateOfBirth">Date of Birth:</label>
                            <input type="date" id="jyotisham-girl-dateOfBirth" name="girl_dateOfBirth" required />
                        </div>

                        <div class="jyotisham-form-group">
                            <label for="jyotisham-girl-timeOfBirth">Time of Birth:</label>
                            <input type="time" id="jyotisham-girl-timeOfBirth" name="girl_timeOfBirth" required />
                        </div>

                        <div class="jyotisham-form-group">
                            <label for="jyotisham-girl-placeOfBirth">Place of Birth:</label>
                            <div class="jyotisham-search-input-container">
                                <input type="text" id="jyotisham-girl-placeOfBirth" name="girl_placeOfBirth" 
                                       placeholder="Enter girl's place of birth" required autocomplete="off" />
                            </div>
                            <input type="hidden" id="jyotisham-girl-latitude" name="girl_latitude" />
                            <input type="hidden" id="jyotisham-girl-longitude" name="girl_longitude" />
                            <input type="hidden" id="jyotisham-girl-timezone" name="girl_timezone" />
                        </div>
                    </div>

                    <!-- Common Settings -->
                    <div class="jyotisham-form-group">
                        <label for="<?php echo esc_attr($instance_id); ?>-language">Language:</label>
                        <select id="<?php echo esc_attr($instance_id); ?>-language" name="language" required>
                            <option value="en" <?php selected($atts['language'], 'en'); ?>>English</option>
                            <option value="hi" <?php selected($atts['language'], 'hi'); ?>>Hindi</option>
                            <option value="ta" <?php selected($atts['language'], 'ta'); ?>>Tamil</option>
                            <option value="te" <?php selected($atts['language'], 'te'); ?>>Telugu</option>
                            <option value="ka" <?php selected($atts['language'], 'ka'); ?>>Kannada</option>
                            <option value="ml" <?php selected($atts['language'], 'ml'); ?>>Malayalam</option>
                            <option value="be" <?php selected($atts['language'], 'be'); ?>>Bengali</option>
                            <option value="gr" <?php selected($atts['language'], 'gr'); ?>>Gujarati</option>
                            <option value="mr" <?php selected($atts['language'], 'mr'); ?>>Marathi</option>
                        </select>
                    </div>

                    <button type="submit" class="jyotisham-generate-btn">
                        Generate Compatibility Report
                    </button>
                </form>
            </div>

            <!-- Loading Indicator -->
            <div class="jyotisham-loading jyotisham-hidden" data-role="loading">
                <div class="jyotisham-spinner"></div>
                <p>Generating compatibility report...</p>
            </div>

            <!-- Results Container -->
            <div class="jyotisham-results jyotisham-hidden" data-role="results">
                <!-- Tab Navigation -->
                <div class="jyotisham-tab-navigation">
                    <button class="jyotisham-tab-btn jyotisham-active" data-tab="overview">
                        Overview
                    </button>
                    <button class="jyotisham-tab-btn" data-tab="ashtakoot">
                        Ashtakoot
                    </button>
                    <button class="jyotisham-tab-btn" data-tab="dashakoot">
                        Dashakoot
                    </button>
                    <button class="jyotisham-tab-btn" data-tab="aggregate">
                        Aggregate
                    </button>
                    <button class="jyotisham-tab-btn" data-tab="nakshatra">
                        Nakshatra
                    </button>
                    <button class="jyotisham-tab-btn" data-tab="boy-details">
                        Boy's Details
                    </button>
                    <button class="jyotisham-tab-btn" data-tab="girl-details">
                        Girl's Details
                    </button>
                </div>

                <!-- Tab Content -->
                <div class="jyotisham-tab-content">
                    <!-- Overview Tab -->
                    <div id="jyotisham-overview" class="jyotisham-tab-pane jyotisham-active">
                        <h2>Compatibility Overview</h2>
                        <div id="jyotisham-overviewContent" class="jyotisham-content"></div>
                    </div>

                    <!-- Ashtakoot Tab -->
                    <div id="jyotisham-ashtakoot" class="jyotisham-tab-pane">
                        <h2>Ashtakoot Matching (8 Points)</h2>
                        <div id="jyotisham-ashtakootContent" class="jyotisham-content"></div>
                    </div>

                    <!-- Dashakoot Tab -->
                    <div id="jyotisham-dashakoot" class="jyotisham-tab-pane">
                        <h2>Dashakoot Matching (10 Points)</h2>
                        <div id="jyotisham-dashakootContent" class="jyotisham-content"></div>
                    </div>

                    <!-- Aggregate Tab -->
                    <div id="jyotisham-aggregate" class="jyotisham-tab-pane">
                        <h2>Overall Compatibility</h2>
                        <div id="jyotisham-aggregateContent" class="jyotisham-content"></div>
                    </div>

                    <!-- Nakshatra Tab -->
                    <div id="jyotisham-nakshatra" class="jyotisham-tab-pane">
                        <h2>Nakshatra Matching</h2>
                        <div id="jyotisham-nakshatraContent" class="jyotisham-content"></div>
                    </div>

                    <!-- Boy's Details Tab -->
                    <div id="jyotisham-boy-details" class="jyotisham-tab-pane">
                        <h2>Boy's Astrological Details</h2>
                        <div id="jyotisham-boy-detailsContent" class="jyotisham-content"></div>
                    </div>

                    <!-- Girl's Details Tab -->
                    <div id="jyotisham-girl-details" class="jyotisham-tab-pane">
                        <h2>Girl's Astrological Details</h2>
                        <div id="jyotisham-girl-detailsContent" class="jyotisham-content"></div>
                    </div>
                </div>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }
    
    /**
     * Render error message
     */
    private function render_error_message($message) {
        return '<div class="jyotisham-error-message"><p>' . esc_html($message) . '</p></div>';
    }
    
    /**
     * Get available shortcodes for admin
     */
    public static function get_available_shortcodes() {
        return array(
            'jyotisham_matching' => array(
                'description' => 'Kundli Matching Generator for compatibility analysis',
                'attributes' => array(
                    'language' => 'Default language (en, hi, gu, ta, te, bn)',
                    'title' => 'Custom title for the form',
                    'description' => 'Custom description text'
                )
            )
        );
    }
}
