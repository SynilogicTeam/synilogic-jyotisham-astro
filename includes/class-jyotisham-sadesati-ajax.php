<?php
/**
 * AJAX handlers for Jyotisham Sade Sati
 */

if (!defined('ABSPATH')) {
    exit;
}

class Jyotisham_Sadesati_Ajax {

    public function __construct() {
        add_action('wp_ajax_jyotisham_get_sadesati', array($this, 'get_sadesati'));
        add_action('wp_ajax_nopriv_jyotisham_get_sadesati', array($this, 'get_sadesati'));
    }

    /**
     * Get Sade Sati data
     */
    public function get_sadesati() {
        if (!isset($_POST['nonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['nonce'])), 'jyotisham_nonce')) {
            wp_send_json_error('Security check failed');
        }

        $data = $this->sanitize_sadesati_data($_POST);

        if (!$this->validate_sadesati_data($data)) {
            wp_send_json_error('Invalid data provided');
        }

        $api = new Jyotisham_API();
        $result = $api->get_sadesati_data($data);

        if (is_wp_error($result)) {
            wp_send_json_error($result->get_error_message());
        }

        wp_send_json_success($result);
    }

    /**
     * Sanitize Sade Sati form data
     */
    private function sanitize_sadesati_data($data) {
        return array(
            'name' => isset($data['name']) ? sanitize_text_field(wp_unslash($data['name'])) : '',
            'date' => isset($data['date']) ? sanitize_text_field(wp_unslash($data['date'])) : '',
            'time' => isset($data['time']) ? sanitize_text_field(wp_unslash($data['time'])) : '',
            'latitude' => isset($data['latitude']) ? floatval($data['latitude']) : 0,
            'longitude' => isset($data['longitude']) ? floatval($data['longitude']) : 0,
            'tz' => isset($data['tz']) ? floatval($data['tz']) : 0,
            'lang' => isset($data['lang']) ? sanitize_text_field(wp_unslash($data['lang'])) : 'en',
        );
    }

    /**
     * Validate Sade Sati data
     */
    private function validate_sadesati_data($data) {
        if (empty($data['name']) || empty($data['date']) || empty($data['time'])) {
            return false;
        }

        if (!$data['latitude'] || !$data['longitude']) {
            return false;
        }

        if ($data['latitude'] < -90 || $data['latitude'] > 90) {
            return false;
        }

        if ($data['longitude'] < -180 || $data['longitude'] > 180) {
            return false;
        }

        if ($data['tz'] < -12 || $data['tz'] > 14) {
            return false;
        }

        $allowed_languages = array('en', 'hi', 'ta', 'te', 'ka', 'ml', 'be', 'gr', 'mr');
        if (!in_array($data['lang'], $allowed_languages)) {
            return false;
        }

        // Date from HTML date input: YYYY-MM-DD
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $data['date'])) {
            return false;
        }

        if (!preg_match('/^\d{2}:\d{2}$/', $data['time'])) {
            return false;
        }

        return true;
    }
}
