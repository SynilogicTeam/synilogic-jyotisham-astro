<?php
/**
 * Shortcode handler for Jyotisham Panchang Generator
 */

if (!defined('ABSPATH')) {
    exit;
}

class Jyotisham_Panchang_Shortcode {
    
    public function __construct() {
        add_shortcode('jyotisham_panchang', array($this, 'render_panchang_shortcode'));
    }
    
    /**
     * Render the Panchang generator shortcode
     */
    public function render_panchang_shortcode($atts) {
        $atts = shortcode_atts(array(
            'language' => 'en',
            'title' => 'Panchang Generator',
            'description' => 'Get detailed Panchang information using Jyotishamastro API'
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
        
        // Enqueue panchang-specific styles
        wp_enqueue_style(
            'jyotisham-panchang-style',
            JYOTISHAM_ASTRO_API_PLUGIN_URL . 'assets/css/panchang.css',
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
        
        // Enqueue panchang-specific scripts
        wp_enqueue_script(
            'jyotisham-panchang-script',
            JYOTISHAM_ASTRO_API_PLUGIN_URL . 'assets/js/panchang.js',
            array('jquery'),
            JYOTISHAM_ASTRO_API_PLUGIN_VERSION,
            true
        );
        
        // Localize scripts with AJAX URL and nonce
        wp_localize_script('jyotisham-astro-api-script', 'jyotisham_ajax', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('jyotisham_nonce'),
            'google_maps_key' => $google_maps_key
        ));
        
        wp_localize_script('jyotisham-panchang-script', 'jyotisham_ajax', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('jyotisham_nonce'),
            'google_maps_key' => $google_maps_key
        ));
        
        // Generate unique ID for this instance
        $instance_id = 'jyotisham-panchang-' . uniqid();
        
        ob_start();
        ?>
        <div id="<?php echo esc_attr($instance_id); ?>" class="jyotisham-panchang-container">
            <header class="jyotisham-panchang-header">
                <h1>📅 <?php echo esc_html($atts['title']); ?></h1>
                <p><?php echo esc_html($atts['description']); ?></p>
            </header>

            <!-- User Input Form -->
            <div class="jyotisham-panchang-form-container">
                <form id="jyotisham-panchang-form" class="jyotisham-panchang-form">
                    <div class="jyotisham-panchang-form-group">
                        <label for="jyotisham-panchang-date">Date:</label>
                        <input
                            type="date"
                            id="jyotisham-panchang-date"
                            name="date"
                            required
                        />
                    </div>

                    <div class="jyotisham-panchang-form-group">
                        <label for="jyotisham-panchang-time">Time:</label>
                        <input
                            type="time"
                            id="jyotisham-panchang-time"
                            name="time"
                            required
                        />
                    </div>

                    <div class="jyotisham-panchang-form-group">
                        <label for="jyotisham-panchang-place">Place:</label>
                        <div class="jyotisham-panchang-search-input-container">
                            <input
                                type="text"
                                id="jyotisham-panchang-place"
                                name="place"
                                value="Delhi, India"
                                placeholder="Enter your location"
                                required
                                autocomplete="off"
                            />
                        </div>
                        <input type="hidden" id="jyotisham-panchang-latitude" name="latitude" value="28.6139" />
                        <input type="hidden" id="jyotisham-panchang-longitude" name="longitude" value="77.2090" />
                        <input type="hidden" id="jyotisham-panchang-timezone" name="timezone" value="" />
                    </div>

                    <div class="jyotisham-panchang-form-group">
                        <label for="jyotisham-panchang-language">Language:</label>
                        <select id="jyotisham-panchang-language" name="language" required>
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

                    <button type="submit" class="jyotisham-panchang-generate-btn">
                        Generate Panchang
                    </button>
                </form>
            </div>

            <!-- Loading Indicator -->
            <div id="jyotisham-panchang-loading" class="jyotisham-panchang-loading jyotisham-panchang-hidden">
                <div class="jyotisham-panchang-spinner"></div>
                <p>Generating Panchang data...</p>
            </div>

            <!-- Results Container -->
            <div id="jyotisham-panchang-results" class="jyotisham-panchang-results jyotisham-panchang-hidden">
                <div class="jyotisham-panchang-content">
                    <div id="jyotisham-panchangData" class="jyotisham-panchang-content"></div>
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
        return '<div class="jyotisham-panchang-error-message"><p>' . esc_html($message) . '</p></div>';
    }
    
    /**
     * Get available shortcodes for admin
     */
    public static function get_available_shortcodes() {
        return array(
            'jyotisham_panchang' => array(
                'description' => 'Panchang generator with detailed astrological information',
                'attributes' => array(
                    'language' => 'Default language (en, hi, gu, ta, te, bn)',
                    'title' => 'Custom title for the form',
                    'description' => 'Custom description text'
                )
            )
        );
    }
}
