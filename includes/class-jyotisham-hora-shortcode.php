<?php
/**
 * Shortcode handler for Hora Muhurta
 */

if (!defined('ABSPATH')) {
    exit;
}

class Jyotisham_Hora_Shortcode {

    public function __construct() {
        add_shortcode('jyotisham_hora', array($this, 'render_shortcode'));
    }

    public function render_shortcode($atts) {
        $atts = shortcode_atts(array(
            'language' => 'en',
            'title' => 'Hora Muhurta',
            'description' => 'Get detailed Hora Muhurta information using JyotishamAstro API'
        ), $atts);

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
        
        // Enqueue hora-specific styles
        wp_enqueue_style(
            'jyotisham-hora-style',
            JYOTISHAM_ASTRO_API_PLUGIN_URL . 'assets/css/hora.css',
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
        
        // Enqueue hora-specific scripts
        wp_enqueue_script(
            'jyotisham-hora-script',
            JYOTISHAM_ASTRO_API_PLUGIN_URL . 'assets/js/hora.js',
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
        
        wp_localize_script('jyotisham-hora-script', 'jyotishamHora', array(
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('jyotisham_nonce')
        ));

        $instance_id = 'jyotisham-hora-' . uniqid();

        ob_start();
        ?>
        <div id="<?php echo esc_attr($instance_id); ?>" class="jyotisham-hora-container">
            <header class="jyotisham-hora-header">
                <h1>🕐 <?php echo esc_html($atts['title']); ?></h1>
                <p><?php echo esc_html($atts['description']); ?></p>
            </header>

            <div class="jyotisham-hora-form-container">
                <form id="jyotisham-hora-form" class="jyotisham-hora-form">
                    <div class="jyotisham-hora-form-group">
                        <label for="jyotisham-date">Date:</label>
                        <input type="date" id="jyotisham-date" name="date" required />
                    </div>

                    <div class="jyotisham-hora-form-group">
                        <label for="jyotisham-time">Time:</label>
                        <input type="time" id="jyotisham-time" name="time" required />
                    </div>

                    <div class="jyotisham-hora-form-group">
                        <label for="jyotisham-place">Place:</label>
                        <div class="jyotisham-hora-search-input-container">
                            <input type="text" id="jyotisham-place" name="place" value="Delhi, India" placeholder="Enter your location" required autocomplete="off" />
                        </div>
                        <input type="hidden" id="jyotisham-latitude" name="latitude" value="28.6139" />
                        <input type="hidden" id="jyotisham-longitude" name="longitude" value="77.2090" />
                        <input type="hidden" id="jyotisham-timezone" name="timezone" value="" />
                    </div>

                    <div class="jyotisham-hora-form-group">
                        <label for="jyotisham-language">Language:</label>
                        <select id="jyotisham-language" name="language" required>
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

                    <button type="submit" class="jyotisham-hora-generate-btn">Get Hora Muhurta</button>
                </form>
            </div>

            <div id="jyotisham-hora-loading" class="jyotisham-hora-loading jyotisham-hora-hidden">
                <div class="jyotisham-hora-spinner"></div>
                <p>Getting Hora Muhurta data...</p>
            </div>

            <div id="jyotisham-hora-results" class="jyotisham-hora-results jyotisham-hora-hidden">
                <div class="jyotisham-hora-content">
                    <div id="jyotisham-horaData" class="jyotisham-hora-content"></div>
                </div>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }

    private function render_error_message($message) {
        return '<div class="jyotisham-hora-error-message"><p>' . esc_html($message) . '</p></div>';
    }
}


