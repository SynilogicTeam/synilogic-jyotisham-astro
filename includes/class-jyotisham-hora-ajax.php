<?php
/**
 * AJAX handlers for Hora Muhurta
 */

if (!defined('ABSPATH')) {
    exit;
}

class Jyotisham_Hora_Ajax {

    public function __construct() {
        add_action('wp_ajax_jyotisham_get_hora', array($this, 'get_hora'));
        add_action('wp_ajax_nopriv_jyotisham_get_hora', array($this, 'get_hora'));
    }

    public function get_hora() {
        if (!isset($_POST['nonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['nonce'])), 'jyotisham_nonce')) {
            wp_send_json_error('Security check failed');
        }

        $data = $this->sanitize_request($_POST);

        $validation = $this->validate_request($data);
        if ($validation !== true) {
            wp_send_json_error($validation);
        }

        $api = new Jyotisham_Hora_API();
        $result = $api->get_hora_data($data);

        if (is_wp_error($result)) {
            wp_send_json_error($result->get_error_message());
        }

        wp_send_json_success($result);
    }

    private function sanitize_request($data) {
        return array(
            'date' => sanitize_text_field(wp_unslash($data['date'] ?? '')),
            'time' => sanitize_text_field(wp_unslash($data['time'] ?? '')),
            'latitude' => floatval(wp_unslash($data['latitude'] ?? 0)),
            'longitude' => floatval(wp_unslash($data['longitude'] ?? 0)),
            'tz' => floatval(wp_unslash($data['timezone'] ?? 0)),
            'lang' => sanitize_text_field(wp_unslash($data['language'] ?? 'en')),
        );
    }

    private function validate_request($data) {
        if (empty($data['date']) || empty($data['time'])) {
            return 'Date and time are required';
        }

        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $data['date'])) {
            return 'Invalid date format';
        }

        if (!preg_match('/^\d{2}:\d{2}$/', $data['time'])) {
            return 'Invalid time format';
        }

        if (!$data['latitude'] || !$data['longitude']) {
            return 'Invalid coordinates provided';
        }

        if ($data['latitude'] < -90 || $data['latitude'] > 90) {
            return 'Invalid latitude';
        }

        if ($data['longitude'] < -180 || $data['longitude'] > 180) {
            return 'Invalid longitude';
        }

        if ($data['tz'] < -12 || $data['tz'] > 14) {
            return 'Invalid timezone';
        }

        $allowed_languages = array('en', 'hi', 'ta', 'te', 'ka', 'ml', 'be', 'gr', 'mr');
        if (!in_array($data['lang'], $allowed_languages)) {
            return 'Invalid language';
        }

        return true;
    }
}


