<?php
/**
 * Shortcode handler for Jyotisham Sade Sati Report
 */

if (!defined('ABSPATH')) {
    exit;
}

class Jyotisham_Sadesati_Shortcode {

    public function __construct() {
        add_shortcode('jyotisham_sadesati', array($this, 'render_sadesati_shortcode'));
    }

    /**
     * Render the Sade Sati report shortcode
     */
    public function render_sadesati_shortcode($atts) {
        $atts = shortcode_atts(array(
            'language' => 'en',
            'title' => 'Sade Sati Report',
            'description' => 'Get detailed Sade Sati information using Jyotishamastro API',
        ), $atts);

        $api_status = get_option('jyotisham_api_status', 'disconnected');
        if ($api_status !== 'connected') {
            return $this->render_error_message('API not configured. Please contact the administrator.');
        }

        $google_maps_key = get_option('jyotisham_google_maps_key', '');

        if (!empty($google_maps_key)) {
            wp_enqueue_script(
                'google-maps-api',
                'https://maps.googleapis.com/maps/api/js?key=' . $google_maps_key . '&libraries=places&loading=async',
                array(),
                JYOTISHAM_ASTRO_API_PLUGIN_VERSION,
                true
            );
        }

        wp_enqueue_style(
            'jyotisham-astro-api-style',
            JYOTISHAM_ASTRO_API_PLUGIN_URL . 'assets/css/style.css',
            array(),
            JYOTISHAM_ASTRO_API_PLUGIN_VERSION
        );

        wp_enqueue_style(
            'jyotisham-sadesati-style',
            JYOTISHAM_ASTRO_API_PLUGIN_URL . 'assets/css/sadesati.css',
            array('jyotisham-astro-api-style'),
            JYOTISHAM_ASTRO_API_PLUGIN_VERSION
        );

        wp_enqueue_script(
            'jyotisham-astro-api-script',
            JYOTISHAM_ASTRO_API_PLUGIN_URL . 'assets/js/script.js',
            array('jquery'),
            JYOTISHAM_ASTRO_API_PLUGIN_VERSION,
            true
        );

        wp_enqueue_script(
            'jyotisham-sadesati-script',
            JYOTISHAM_ASTRO_API_PLUGIN_URL . 'assets/js/sadesati.js',
            array('jquery', 'jyotisham-astro-api-script'),
            JYOTISHAM_ASTRO_API_PLUGIN_VERSION,
            true
        );

        wp_localize_script('jyotisham-astro-api-script', 'jyotisham_ajax', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('jyotisham_nonce'),
            'google_maps_key' => $google_maps_key,
        ));

        wp_localize_script('jyotisham-sadesati-script', 'jyotishamSadesati', array(
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('jyotisham_nonce'),
            'googleMapsKey' => $google_maps_key,
        ));

        $instance_id = 'jyotisham-sadesati-' . uniqid();

        ob_start();
        ?>
        <div id="<?php echo esc_attr($instance_id); ?>" class="jyotisham-sadesati-wrapper jyotisham-container">
            <header class="jyotisham-header">
                <h1>🪐 <?php echo esc_html($atts['title']); ?></h1>
                <p><?php echo esc_html($atts['description']); ?></p>
            </header>

            <div class="jyotisham-form-container">
                <form id="jyotisham-sadesati-form" class="jyotisham-form">
                    <div class="jyotisham-form-group">
                        <label for="jyotisham-sadesati-name">Name:</label>
                        <input type="text" id="jyotisham-sadesati-name" name="name" placeholder="Enter your full name" required />
                    </div>

                    <div class="jyotisham-form-group">
                        <label for="jyotisham-sadesati-date">Date of Birth:</label>
                        <input type="date" id="jyotisham-sadesati-date" name="date" required />
                    </div>

                    <div class="jyotisham-form-group">
                        <label for="jyotisham-sadesati-time">Time of Birth:</label>
                        <input type="time" id="jyotisham-sadesati-time" name="time" required />
                    </div>

                    <div class="jyotisham-form-group">
                        <label for="jyotisham-sadesati-place">Place of Birth:</label>
                        <div class="jyotisham-search-input-container">
                            <input type="text" id="jyotisham-sadesati-place" name="place" placeholder="Enter your birth location" required autocomplete="off" />
                        </div>
                        <input type="hidden" id="jyotisham-sadesati-latitude" name="latitude" />
                        <input type="hidden" id="jyotisham-sadesati-longitude" name="longitude" />
                        <input type="hidden" id="jyotisham-sadesati-timezone" name="timezone" />
                    </div>

                    <div class="jyotisham-form-group">
                        <label for="jyotisham-sadesati-language">Language:</label>
                        <select id="jyotisham-sadesati-language" name="language" required>
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

                    <button type="submit" class="jyotisham-generate-btn">Get Sade Sati Report</button>
                </form>
            </div>

            <div id="jyotisham-sadesati-loading" class="jyotisham-loading jyotisham-hidden">
                <div class="jyotisham-spinner"></div>
                <p>Getting Sade Sati data...</p>
            </div>

            <div id="jyotisham-sadesati-results" class="jyotisham-results jyotisham-hidden">
                <div class="jyotisham-sadesati-content">
                    <div id="jyotisham-sadesatiData" class="jyotisham-content"></div>
                </div>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }

    private function render_error_message($message) {
        return '<div class="jyotisham-error-message"><p>' . esc_html($message) . '</p></div>';
    }
}
