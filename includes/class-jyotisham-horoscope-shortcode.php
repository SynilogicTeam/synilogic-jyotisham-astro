<?php
/**
 * Shortcode handler for Jyotisham Horoscope Generator
 */

if (!defined('ABSPATH')) {
    exit;
}

class Jyotisham_Horoscope_Shortcode {
    
    public function __construct() {
        add_shortcode('jyotisham_horoscope', array($this, 'render_horoscope_shortcode'));
    }
    
    /**
     * Render the Horoscope generator shortcode
     */
    public function render_horoscope_shortcode($atts) {
        $atts = shortcode_atts(array(
            'language' => 'en',
            'title' => 'Horoscope',
            'description' => 'Get detailed horoscope predictions using JyotishamAstro API'
        ), $atts);
        
        // Check if API is configured
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
        
        // Enqueue horoscope-specific styles
        wp_enqueue_style(
            'jyotisham-horoscope-style',
            JYOTISHAM_ASTRO_API_PLUGIN_URL . 'assets/css/horoscope.css',
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
        
        // Enqueue horoscope-specific scripts
        wp_enqueue_script(
            'jyotisham-horoscope-script',
            JYOTISHAM_ASTRO_API_PLUGIN_URL . 'assets/js/horoscope.js',
            array('jquery'),
            JYOTISHAM_ASTRO_API_PLUGIN_VERSION,
            true
        );
        
        // Localize scripts with AJAX URL and nonce
        wp_localize_script('jyotisham-horoscope-script', 'jyotishamHoroscope', array(
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('jyotisham_nonce'),
            'pluginUrl' => JYOTISHAM_ASTRO_API_PLUGIN_URL
        ));
        
        // Generate unique ID for this instance
        $instance_id = 'jyotisham-horoscope-' . uniqid();
        
        ob_start();
        ?>
        <div id="<?php echo esc_attr($instance_id); ?>" class="jyotisham-horoscope-container">
            <header class="jyotisham-horoscope-header">
                <h1>🔮 <?php echo esc_html($atts['title']); ?></h1>
                <p><?php echo esc_html($atts['description']); ?></p>
            </header>

            <!-- Language Selector -->
            <div class="jyotisham-horoscope-language-selector">
                <select id="jyotisham-horoscope-language" class="jyotisham-horoscope-lang-dropdown">
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

            <!-- Zodiac Grid -->
            <div class="jyotisham-horoscope-zodiac-grid" id="jyotisham-horoscope-zodiac-grid">
                <!-- Zodiac signs will be dynamically generated -->
            </div>
            
            <!-- Horoscope Content Section -->
            <div class="jyotisham-horoscope-section" id="jyotisham-horoscope-section" style="display: none;">
                <div class="jyotisham-horoscope-content-header">
                    <h2 class="jyotisham-horoscope-content-title">
                        <span class="jyotisham-horoscope-title-icon">☀</span>
                        <span id="jyotisham-selected-zodiac-name">Zodiac Sign</span>
                    </h2>
                    <div class="jyotisham-horoscope-tabs">
                        <button class="jyotisham-horoscope-tab-btn jyotisham-horoscope-active" data-tab="daily">Daily</button>
                        <button class="jyotisham-horoscope-tab-btn" data-tab="weekly">Weekly</button>
                        <button class="jyotisham-horoscope-tab-btn" data-tab="monthly">Monthly</button>
                        <button class="jyotisham-horoscope-tab-btn" data-tab="yearly">Yearly</button>
                    </div>
                </div>

                <div class="jyotisham-horoscope-content" id="jyotisham-horoscope-content">
                    <!-- Content will be dynamically loaded -->
                    <div class="jyotisham-horoscope-loading">Select a zodiac sign to view horoscope</div>
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
        return '<div class="jyotisham-horoscope-error-message"><p>' . esc_html($message) . '</p></div>';
    }
    
    /**
     * Get available shortcodes for admin
     */
    public static function get_available_shortcodes() {
        return array(
            'jyotisham_horoscope' => array(
                'description' => 'Horoscope generator with daily, weekly, monthly, and yearly predictions',
                'attributes' => array(
                    'language' => 'Default language (en, hi, ta, te, ka, ml, be, gr, mr)',
                    'title' => 'Custom title for the form',
                    'description' => 'Custom description text'
                )
            )
        );
    }
}
