<?php
/**
 * AJAX handlers for Numerology
 */

if (!defined('ABSPATH')) {
    exit;
}

class Jyotisham_Numerology_Ajax {

    public function __construct() {
        add_action('wp_ajax_jyotisham_get_numerology', array($this, 'get_numerology'));
        add_action('wp_ajax_nopriv_jyotisham_get_numerology', array($this, 'get_numerology'));
    }

    public function get_numerology() {
        if (!isset($_POST['nonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['nonce'])), 'jyotisham_nonce')) {
            wp_send_json_error('Security check failed');
        }

        $data = $this->sanitize_request($_POST);

        $validation = $this->validate_request($data);
        if ($validation !== true) {
            wp_send_json_error($validation);
        }

        $api = new Jyotisham_Numerology_API();
        $result = $api->get_numerology_data($data);

        if (is_wp_error($result)) {
            wp_send_json_error($result->get_error_message());
        }

        wp_send_json_success($result);
    }

    private function sanitize_request($data) {
        return array(
            'date' => sanitize_text_field(wp_unslash($data['date'] ?? '')),
            'name' => sanitize_text_field(wp_unslash($data['name'] ?? '')),
            'lang' => sanitize_text_field(wp_unslash($data['language'] ?? 'en')),
        );
    }

    private function validate_request($data) {
        if (empty($data['date']) || empty($data['name'])) {
            return 'Name and date are required';
        }

        // HTML date input format YYYY-MM-DD
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $data['date'])) {
            return 'Invalid date format';
        }

        $allowed_languages = array('en', 'hi', 'ta', 'te', 'ka', 'ml', 'be', 'gr', 'mr');
        if (!in_array($data['lang'], $allowed_languages)) {
            return 'Invalid language';
        }

        return true;
    }
}


