<?php
/**
 * Plugin Name: Astro API By Synilogic
 * Plugin URI: https://synilogic.in
 * Description: A comprehensive plugin using the hosted Astro API By Synilogic service to generate horoscope reports based on birth details.
 * Version: 1.0.4
 * Author: Synilogic
 * Author URI: https://synilogic.in/
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Requires at least: 5.0
 * Requires PHP: 7.4
 * Text Domain: synilogic-jyotisham-astro
 * Domain Path: /languages
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('JYOTISHAM_ASTRO_API_PLUGIN_URL', plugin_dir_url(__FILE__));
define('JYOTISHAM_ASTRO_API_PLUGIN_PATH', plugin_dir_path(__FILE__));
define('JYOTISHAM_ASTRO_API_PLUGIN_VERSION', '1.0.4');

// Include required files
require_once JYOTISHAM_ASTRO_API_PLUGIN_PATH . 'includes/class-jyotisham-admin.php';
require_once JYOTISHAM_ASTRO_API_PLUGIN_PATH . 'includes/class-jyotisham-api.php';
require_once JYOTISHAM_ASTRO_API_PLUGIN_PATH . 'includes/class-jyotisham-shortcode.php';
require_once JYOTISHAM_ASTRO_API_PLUGIN_PATH . 'includes/class-jyotisham-matching-shortcode.php';
require_once JYOTISHAM_ASTRO_API_PLUGIN_PATH . 'includes/class-jyotisham-panchang-shortcode.php';
require_once JYOTISHAM_ASTRO_API_PLUGIN_PATH . 'includes/class-jyotisham-choghadiya-shortcode.php';
require_once JYOTISHAM_ASTRO_API_PLUGIN_PATH . 'includes/class-jyotisham-sadesati-ajax.php';
require_once JYOTISHAM_ASTRO_API_PLUGIN_PATH . 'includes/class-jyotisham-sadesati-shortcode.php';
require_once JYOTISHAM_ASTRO_API_PLUGIN_PATH . 'includes/class-jyotisham-ajax.php';
// Numerology feature (server-side only; no key exposure)
require_once JYOTISHAM_ASTRO_API_PLUGIN_PATH . 'includes/class-jyotisham-numerology-api.php';
require_once JYOTISHAM_ASTRO_API_PLUGIN_PATH . 'includes/class-jyotisham-numerology-ajax.php';
require_once JYOTISHAM_ASTRO_API_PLUGIN_PATH . 'includes/class-jyotisham-numerology-shortcode.php';
// Hora Muhurta feature
require_once JYOTISHAM_ASTRO_API_PLUGIN_PATH . 'includes/class-jyotisham-hora-api.php';
require_once JYOTISHAM_ASTRO_API_PLUGIN_PATH . 'includes/class-jyotisham-hora-ajax.php';
require_once JYOTISHAM_ASTRO_API_PLUGIN_PATH . 'includes/class-jyotisham-hora-shortcode.php';
// Horoscope feature
require_once JYOTISHAM_ASTRO_API_PLUGIN_PATH . 'includes/class-jyotisham-horoscope-api.php';
require_once JYOTISHAM_ASTRO_API_PLUGIN_PATH . 'includes/class-jyotisham-horoscope-ajax.php';
require_once JYOTISHAM_ASTRO_API_PLUGIN_PATH . 'includes/class-jyotisham-horoscope-shortcode.php';
// WooCommerce PDF report feature
require_once JYOTISHAM_ASTRO_API_PLUGIN_PATH . 'includes/class-jyotisham-astro-pdf-admin.php';
require_once JYOTISHAM_ASTRO_API_PLUGIN_PATH . 'includes/class-jyotisham-astro-pdf-google-maps.php';
require_once JYOTISHAM_ASTRO_API_PLUGIN_PATH . 'includes/class-jyotisham-astro-pdf-api.php';
require_once JYOTISHAM_ASTRO_API_PLUGIN_PATH . 'includes/class-jyotisham-astro-pdf-frontend.php';
require_once JYOTISHAM_ASTRO_API_PLUGIN_PATH . 'includes/class-jyotisham-astro-pdf-woocommerce.php';

/**
 * Main plugin class
 */
class JyotishamAstroAPI {
    
    public function __construct() {
        add_action('init', array($this, 'init'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
        add_action('admin_enqueue_scripts', array($this, 'admin_enqueue_scripts'));
        register_activation_hook(__FILE__, array($this, 'activate'));
        register_deactivation_hook(__FILE__, array($this, 'deactivate'));
    }
    
    public function init() {
        // Initialize admin
        if (is_admin()) {
            new Jyotisham_Admin();
        }
        
        // Initialize shortcode
        new Jyotisham_Shortcode();
        
        // Initialize matching shortcode
        new Jyotisham_Matching_Shortcode();
        
        // Initialize panchang shortcode
        new Jyotisham_Panchang_Shortcode();
        
        // Initialize choghadiya shortcode
        new Jyotisham_Choghadiya_Shortcode();

        // Initialize Sade Sati
        new Jyotisham_Sadesati_Ajax();
        new Jyotisham_Sadesati_Shortcode();
        
        // Initialize AJAX handlers
        new Jyotisham_Ajax();

        // Initialize Numerology
        new Jyotisham_Numerology_Ajax();
        new Jyotisham_Numerology_Shortcode();

        // Initialize Hora Muhurta
        new Jyotisham_Hora_Ajax();
        new Jyotisham_Hora_Shortcode();

        // Initialize Horoscope
        new Jyotisham_Horoscope_Ajax();
        new Jyotisham_Horoscope_Shortcode();

        // Initialize WooCommerce Astro PDF reports
        new Jyotisham_Astro_PDF_Admin();
        new Jyotisham_Astro_PDF_WooCommerce();
    }

    // Since WP 4.6+, translations are loaded automatically from WordPress.org.
    
    public function enqueue_scripts() {
        // Only enqueue on pages where our shortcodes are present
        if (!is_singular()) {
            return;
        }
        global $post;
        if (!$post instanceof WP_Post) {
            return;
        }
        $content = $post->post_content;
        $needs_main = has_shortcode($content, 'jyotisham_kundli') || has_shortcode($content, 'jyotisham_matching') || has_shortcode($content, 'jyotisham_panchang') || has_shortcode($content, 'jyotisham_choghadiya') || has_shortcode($content, 'jyotisham_numerology') || has_shortcode($content, 'jyotisham_hora') || has_shortcode($content, 'jyotisham_horoscope') || has_shortcode($content, 'jyotisham_sadesati');
        if (!$needs_main) {
            return;
        }
        // Enqueue Google Maps API
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
        
        // Enqueue plugin styles
        wp_enqueue_style(
            'jyotisham-astro-api-style',
            JYOTISHAM_ASTRO_API_PLUGIN_URL . 'assets/css/style.css',
            array(),
            JYOTISHAM_ASTRO_API_PLUGIN_VERSION
        );

        // Conditionally enqueue feature styles
        if (has_shortcode($content, 'jyotisham_matching')) {
            wp_enqueue_style(
                'jyotisham-matching-style',
                JYOTISHAM_ASTRO_API_PLUGIN_URL . 'assets/css/matching.css',
                array('jyotisham-astro-api-style'),
                JYOTISHAM_ASTRO_API_PLUGIN_VERSION
            );
        }
        if (has_shortcode($content, 'jyotisham_panchang')) {
            wp_enqueue_style(
                'jyotisham-panchang-style',
                JYOTISHAM_ASTRO_API_PLUGIN_URL . 'assets/css/panchang.css',
                array('jyotisham-astro-api-style'),
                JYOTISHAM_ASTRO_API_PLUGIN_VERSION
            );
        }
        if (has_shortcode($content, 'jyotisham_choghadiya')) {
            wp_enqueue_style(
                'jyotisham-choghadiya-style',
                JYOTISHAM_ASTRO_API_PLUGIN_URL . 'assets/css/choghadiya.css',
                array('jyotisham-astro-api-style'),
                JYOTISHAM_ASTRO_API_PLUGIN_VERSION
            );
        }
        if (has_shortcode($content, 'jyotisham_horoscope')) {
            wp_enqueue_style(
                'jyotisham-horoscope-style',
                JYOTISHAM_ASTRO_API_PLUGIN_URL . 'assets/css/horoscope.css',
                array('jyotisham-astro-api-style'),
                JYOTISHAM_ASTRO_API_PLUGIN_VERSION
            );
        }
        if (has_shortcode($content, 'jyotisham_sadesati')) {
            wp_enqueue_style(
                'jyotisham-sadesati-style',
                JYOTISHAM_ASTRO_API_PLUGIN_URL . 'assets/css/sadesati.css',
                array('jyotisham-astro-api-style'),
                JYOTISHAM_ASTRO_API_PLUGIN_VERSION
            );
        }
        
        // Enqueue plugin scripts
        wp_enqueue_script(
            'jyotisham-astro-api-script',
            JYOTISHAM_ASTRO_API_PLUGIN_URL . 'assets/js/script.js',
            array('jquery'),
            JYOTISHAM_ASTRO_API_PLUGIN_VERSION,
            true
        );
        
        // Conditionally enqueue feature scripts
        if (has_shortcode($content, 'jyotisham_matching')) {
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
        }
        if (has_shortcode($content, 'jyotisham_panchang')) {
            wp_enqueue_script(
                'jyotisham-panchang-script',
                JYOTISHAM_ASTRO_API_PLUGIN_URL . 'assets/js/panchang.js',
                array('jquery'),
                JYOTISHAM_ASTRO_API_PLUGIN_VERSION,
                true
            );
        }
        if (has_shortcode($content, 'jyotisham_choghadiya')) {
            wp_enqueue_script(
                'jyotisham-choghadiya-script',
                JYOTISHAM_ASTRO_API_PLUGIN_URL . 'assets/js/choghadiya.js',
                array('jquery', 'jyotisham-astro-api-script'),
                JYOTISHAM_ASTRO_API_PLUGIN_VERSION,
                true
            );
        }
        if (has_shortcode($content, 'jyotisham_horoscope')) {
            wp_enqueue_script(
                'jyotisham-horoscope-script',
                JYOTISHAM_ASTRO_API_PLUGIN_URL . 'assets/js/horoscope.js',
                array('jquery'),
                JYOTISHAM_ASTRO_API_PLUGIN_VERSION,
                true
            );
        }
        if (has_shortcode($content, 'jyotisham_sadesati')) {
            wp_enqueue_script(
                'jyotisham-sadesati-script',
                JYOTISHAM_ASTRO_API_PLUGIN_URL . 'assets/js/sadesati.js',
                array('jquery', 'jyotisham-astro-api-script'),
                JYOTISHAM_ASTRO_API_PLUGIN_VERSION,
                true
            );
        }
        
        // Localize script with AJAX URL and nonce
        wp_localize_script('jyotisham-astro-api-script', 'jyotisham_ajax', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('jyotisham_nonce'),
            'google_maps_key' => $google_maps_key
        ));
        
        // Localize optional scripts if enqueued
        if (wp_script_is('jyotisham-matching-script', 'enqueued')) {
            wp_localize_script('jyotisham-matching-script', 'jyotisham_ajax', array(
                'ajax_url' => admin_url('admin-ajax.php'),
                'nonce' => wp_create_nonce('jyotisham_nonce'),
                'google_maps_key' => $google_maps_key
            ));
        }
        if (wp_script_is('jyotisham-panchang-script', 'enqueued')) {
            wp_localize_script('jyotisham-panchang-script', 'jyotisham_ajax', array(
                'ajax_url' => admin_url('admin-ajax.php'),
                'nonce' => wp_create_nonce('jyotisham_nonce'),
                'google_maps_key' => $google_maps_key
            ));
        }
        if (wp_script_is('jyotisham-choghadiya-script', 'enqueued')) {
            wp_localize_script('jyotisham-choghadiya-script', 'jyotishamChoghadiya', array(
                'ajaxUrl' => admin_url('admin-ajax.php'),
                'nonce' => wp_create_nonce('jyotisham_nonce'),
                'googleMapsKey' => $google_maps_key
            ));
        }
        if (wp_script_is('jyotisham-horoscope-script', 'enqueued')) {
            wp_localize_script('jyotisham-horoscope-script', 'jyotishamHoroscope', array(
                'ajaxUrl' => admin_url('admin-ajax.php'),
                'nonce' => wp_create_nonce('jyotisham_nonce'),
                'pluginUrl' => JYOTISHAM_ASTRO_API_PLUGIN_URL
            ));
        }
        if (wp_script_is('jyotisham-sadesati-script', 'enqueued')) {
            wp_localize_script('jyotisham-sadesati-script', 'jyotishamSadesati', array(
                'ajaxUrl' => admin_url('admin-ajax.php'),
                'nonce' => wp_create_nonce('jyotisham_nonce'),
                'googleMapsKey' => $google_maps_key
            ));
        }
    }
    
    public function admin_enqueue_scripts($hook) {
        if (strpos($hook, 'jyotisham') !== false) {
            wp_enqueue_style(
                'jyotisham-admin-style',
                JYOTISHAM_ASTRO_API_PLUGIN_URL . 'assets/css/admin.css',
                array(),
                JYOTISHAM_ASTRO_API_PLUGIN_VERSION
            );
            
            wp_enqueue_script(
                'jyotisham-admin-script',
                JYOTISHAM_ASTRO_API_PLUGIN_URL . 'assets/js/admin.js',
                array('jquery'),
                JYOTISHAM_ASTRO_API_PLUGIN_VERSION,
                true
            );
            
            // Add inline script for shortcodes page copy functionality
            if (strpos($hook, 'shortcodes') !== false) {
                $inline_script = "function copyToClipboard(text) {
                    navigator.clipboard.writeText(text).then(function() {
                        alert('Shortcode copied to clipboard!');
                    });
                }";
                wp_add_inline_script('jyotisham-admin-script', $inline_script);
            }
        }
    }
    
    public function activate() {
        // Set default options
        add_option('jyotisham_api_key', '');
        add_option('jyotisham_google_maps_key', '');
        add_option('jyotisham_api_status', 'disconnected');
        add_option('jyotisham_plugin_version', JYOTISHAM_ASTRO_API_PLUGIN_VERSION);
    }
    
    public function deactivate() {
        // Clean up if needed
    }
}

// Initialize the plugin
new JyotishamAstroAPI();
