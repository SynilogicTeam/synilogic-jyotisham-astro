<?php
/**
 * Secure API handler for Numerology endpoints
 */

if (!defined('ABSPATH')) {
    exit;
}

class Jyotisham_Numerology_API {

    private $api_key;
    private $base_url = 'https://api.jyotishamastroapi.com';

    public function __construct() {
        $this->api_key = get_option('jyotisham_api_key', '');
    }

    /**
     * Get Numerology data
     *
     * @param array $data Expecting ['date' => 'YYYY-MM-DD', 'name' => string, 'lang' => 'en'|'hi'|...]
     * @return array|WP_Error
     */
    public function get_numerology_data($data) {
        if (empty($this->api_key)) {
            return new WP_Error('no_api_key', 'API key not configured');
        }

        $params = array(
            'date' => $this->format_date_for_api($data['date']),
            'name' => $data['name'],
            'lang' => isset($data['lang']) ? $data['lang'] : 'en',
        );

        return $this->make_api_call('/api/prediction/numerology', $params);
    }

    /**
     * Convert HTML date (YYYY-MM-DD) to API expected format (YYYY/MM/DD)
     */
    private function format_date_for_api($date_string) {
        try {
            $date = new DateTime($date_string);
            return $date->format('Y/m/d');
        } catch (Exception $e) {
            return $date_string; // fallback
        }
    }

    /**
     * Make secure API call
     */
    private function make_api_call($endpoint, $params = array()) {
        $url = $this->base_url . $endpoint;

        // Remove empty parameters
        $params = array_filter($params, function($value) {
            return $value !== '' && $value !== null;
        });

        $url .= '?' . http_build_query($params);

        $args = array(
            'timeout' => 30,
            'sslverify' => true,
            'headers' => array(
                'key' => $this->api_key,
                'User-Agent' => 'WordPress-Jyotisham-Plugin/' . JYOTISHAM_ASTRO_API_PLUGIN_VERSION
            )
        );

        $response = wp_remote_get($url, $args);

        if (is_wp_error($response)) {
            return $response;
        }

        $response_code = wp_remote_retrieve_response_code($response);
        $body = wp_remote_retrieve_body($response);

        if ($response_code !== 200) {
            return new WP_Error('api_error', 'API request failed with code: ' . $response_code);
        }

        $data = json_decode($body, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            return new WP_Error('json_error', 'Invalid JSON response from API');
        }

        if (isset($data['error'])) {
            return new WP_Error('api_error', $data['error']);
        }

        if (isset($data['status']) && $data['status'] !== 200) {
            return new WP_Error('api_error', isset($data['message']) ? $data['message'] : 'API returned error status');
        }

        return $data;
    }
}


