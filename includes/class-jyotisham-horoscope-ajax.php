<?php
/**
 * AJAX handlers for Jyotisham Horoscope
 * Handles all frontend requests securely
 */

if (!defined('ABSPATH')) {
    exit;
}

class Jyotisham_Horoscope_Ajax {
    
    public function __construct() {
        // Public AJAX actions (for logged-in and non-logged-in users)
        add_action('wp_ajax_jyotisham_get_horoscope', array($this, 'get_horoscope'));
        add_action('wp_ajax_nopriv_jyotisham_get_horoscope', array($this, 'get_horoscope'));
    }
    
    /**
     * Get horoscope data
     */
    public function get_horoscope() {
        if (!isset($_POST['nonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['nonce'])), 'jyotisham_nonce')) {
            wp_send_json_error('Security check failed');
        }
        
        $type = isset($_POST['type']) ? sanitize_text_field(wp_unslash($_POST['type'])) : '';
        $zodiac = isset($_POST['zodiac']) ? intval($_POST['zodiac']) : 0;
        $lang = isset($_POST['lang']) ? sanitize_text_field(wp_unslash($_POST['lang'])) : 'en';
        $day = isset($_POST['day']) ? sanitize_text_field(wp_unslash($_POST['day'])) : 'today';
        $year = isset($_POST['year']) ? intval($_POST['year']) : null;
        
        if (!$zodiac || $zodiac < 1 || $zodiac > 12) {
            wp_send_json_error('Invalid zodiac sign');
        }
        
        if (!in_array($type, array('daily', 'weekly', 'monthly', 'yearly'))) {
            wp_send_json_error('Invalid horoscope type');
        }
        
        $allowed_languages = array('en', 'hi', 'ta', 'te', 'ka', 'ml', 'be', 'gr', 'mr');
        if (!in_array($lang, $allowed_languages)) {
            wp_send_json_error('Invalid language');
        }
        
        $api = new Jyotisham_Horoscope_API();
        $result = null;
        
        switch ($type) {
            case 'daily':
                if (!in_array($day, array('today', 'tomorrow', 'yesterday'))) {
                    wp_send_json_error('Invalid day parameter');
                }
                $result = $api->get_daily_horoscope($zodiac, $day, $lang);
                break;
            case 'weekly':
                $result = $api->get_weekly_horoscope($zodiac, $lang);
                break;
            case 'monthly':
                $result = $api->get_monthly_horoscope($zodiac, $lang);
                break;
            case 'yearly':
                if ($year === null) {
                    $year = gmdate('Y');
                }
                $result = $api->get_yearly_horoscope($zodiac, $year, $lang);
                break;
            default:
                wp_send_json_error('Invalid horoscope type');
        }
        
        if (is_wp_error($result)) {
            wp_send_json_error($result->get_error_message());
        }
        
        wp_send_json_success($result);
    }
}
