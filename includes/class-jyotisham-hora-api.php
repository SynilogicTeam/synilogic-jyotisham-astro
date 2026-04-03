<?php
/**
 * Secure API handler for Hora Muhurta
 */

if (!defined('ABSPATH')) {
    exit;
}

class Jyotisham_Hora_API {

    private $api_key;
    private $base_url = 'https://api.jyotishamastroapi.com';

    public function __construct() {
        $this->api_key = get_option('jyotisham_api_key', '');
    }

    /**
     * Get Hora Muhurta data
     * @param array $data ['date' => 'YYYY-MM-DD', 'time' => 'HH:MM', 'latitude' => float, 'longitude' => float, 'tz' => float, 'lang' => 'en']
     * @return array|WP_Error
     */
    public function get_hora_data($data) {
        if (empty($this->api_key)) {
            return new WP_Error('no_api_key', 'API key not configured');
        }

        $params = array(
            'date' => $this->format_date_for_api($data['date']),
            'time' => $data['time'],
            'latitude' => $data['latitude'],
            'longitude' => $data['longitude'],
            'tz' => $data['tz'],
            'lang' => isset($data['lang']) ? $data['lang'] : 'en',
        );

        return $this->make_api_call('/api/panchang/hora-muhurta', $params);
    }

    private function format_date_for_api($date_string) {
        try {
            $date = new DateTime($date_string);
            return $date->format('d/m/Y');
        } catch (Exception $e) {
            return $date_string;
        }
    }

    private function make_api_call($endpoint, $params = array()) {
        $url = $this->base_url . $endpoint;

        $params = array_filter($params, function($v) { return $v !== '' && $v !== null; });
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

        $code = wp_remote_retrieve_response_code($response);
        $body = wp_remote_retrieve_body($response);
        if ($code !== 200) {
            return new WP_Error('api_error', 'API request failed with code: ' . $code);
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


