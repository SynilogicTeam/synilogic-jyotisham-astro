<?php
/**
 * Shortcode handler for Numerology Generator
 */

if (!defined('ABSPATH')) {
    exit;
}

class Jyotisham_Numerology_Shortcode {

    public function __construct() {
        add_shortcode('jyotisham_numerology', array($this, 'render_shortcode'));
    }

    public function render_shortcode($atts) {
        $atts = shortcode_atts(array(
            'language' => 'en',
            'title' => 'Numerology Generator',
            'description' => 'Get detailed Numerology information using JyotishamAstro API'
        ), $atts);

        $api_status = get_option('jyotisham_api_status', 'disconnected');
        if ($api_status !== 'connected') {
            return $this->render_error_message('API not configured. Please contact the administrator.');
        }

        // Enqueue assets directly when shortcode is rendered
        // This ensures CSS/JS loads regardless of how shortcode is added (page builder, widget, theme template, etc.)
        
        // Enqueue main plugin styles
        wp_enqueue_style(
            'jyotisham-astro-api-style',
            JYOTISHAM_ASTRO_API_PLUGIN_URL . 'assets/css/style.css',
            array(),
            JYOTISHAM_ASTRO_API_PLUGIN_VERSION
        );
        
        // Enqueue numerology-specific styles
        wp_enqueue_style(
            'jyotisham-numerology-style',
            JYOTISHAM_ASTRO_API_PLUGIN_URL . 'assets/css/numerology.css',
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
        
        // Enqueue numerology-specific scripts
        wp_enqueue_script(
            'jyotisham-numerology-script',
            JYOTISHAM_ASTRO_API_PLUGIN_URL . 'assets/js/numerology.js',
            array('jquery'),
            JYOTISHAM_ASTRO_API_PLUGIN_VERSION,
            true
        );

        // Localize scripts with AJAX URL and nonce
        wp_localize_script('jyotisham-astro-api-script', 'jyotisham_ajax', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('jyotisham_nonce')
        ));
        
        wp_localize_script('jyotisham-numerology-script', 'jyotishamNumerology', array(
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('jyotisham_nonce')
        ));

        // Unique ID
        $instance_id = 'jyotisham-numerology-' . uniqid();

        ob_start();
        ?>
        <div id="<?php echo esc_attr($instance_id); ?>" class="jyotisham-numerology-container">
            <header class="jyotisham-numerology-header">
                <h1>🔢 <?php echo esc_html($atts['title']); ?></h1>
                <p><?php echo esc_html($atts['description']); ?></p>
            </header>

            <div class="jyotisham-numerology-form-container">
                <form id="jyotisham-numerology-form" class="jyotisham-numerology-form">
                    <div class="jyotisham-numerology-form-group">
                        <label for="jyotisham-date">Date of Birth:</label>
                        <input type="date" id="jyotisham-date" name="date" required />
                    </div>

                    <div class="jyotisham-numerology-form-group">
                        <label for="jyotisham-name">Full Name:</label>
                        <input type="text" id="jyotisham-name" name="name" placeholder="Enter your full name" required />
                    </div>

                    <div class="jyotisham-numerology-form-group">
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

                    <button type="submit" class="jyotisham-numerology-generate-btn">Get Numerology Report</button>
                </form>
            </div>

            <div id="jyotisham-numerology-loading" class="jyotisham-numerology-loading jyotisham-numerology-hidden">
                <div class="jyotisham-numerology-spinner"></div>
                <p>Getting Numerology data...</p>
            </div>

            <div id="jyotisham-numerology-results" class="jyotisham-numerology-results jyotisham-numerology-hidden">
                <div class="jyotisham-numerology-content">
                    <div id="jyotisham-numerologyData" class="jyotisham-numerology-content"></div>
                </div>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }

    private function render_error_message($message) {
        return '<div class="jyotisham-numerology-error-message"><p>' . esc_html($message) . '</p></div>';
    }
}


