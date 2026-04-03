<?php
/**
 * API handler for Jyotisham Horoscope
 * All API calls are made server-side to protect API keys
 */

if (!defined('ABSPATH')) {
    exit;
}

class Jyotisham_Horoscope_API {
    
    private $api_key;
    private $base_url = 'https://api.jyotishamastroapi.com';
    
    public function __construct() {
        $this->api_key = get_option('jyotisham_api_key', '');
    }
    
    /**
     * Get daily horoscope
     */
    public function get_daily_horoscope($zodiac, $day = 'today', $lang = 'en') {
        $params = array(
            'zodiac' => $zodiac,
            'day' => $day,
            'lang' => $lang
        );
        
        return $this->make_api_call('/api/prediction/daily', $params);
    }
    
    /**
     * Get weekly horoscope
     */
    public function get_weekly_horoscope($zodiac, $lang = 'en') {
        $params = array(
            'zodiac' => $zodiac,
            'lang' => $lang
        );
        
        return $this->make_api_call('/api/prediction/weekly', $params);
    }
    
    /**
     * Get monthly horoscope
     */
    public function get_monthly_horoscope($zodiac, $lang = 'en') {
        $params = array(
            'zodiac' => $zodiac,
            'lang' => $lang
        );
        
        return $this->make_api_call('/api/prediction/monthly', $params);
    }
    
    /**
     * Get yearly horoscope
     */
    public function get_yearly_horoscope($zodiac, $year = null, $lang = 'en') {
        if ($year === null) {
            $year = gmdate('Y');
        }
        
        $params = array(
            'zodiac' => $zodiac,
            'year' => $year,
            'lang' => $lang
        );
        
        return $this->make_api_call('/api/prediction/yearly', $params);
    }
    
    /**
     * Make secure API call to JyotishamAstro
     */
    private function make_api_call($endpoint, $params = array()) {
        if (empty($this->api_key)) {
            return new WP_Error('no_api_key', 'API key not configured');
        }
        
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
        
        // Check for API-specific errors
        if (isset($data['error'])) {
            return new WP_Error('api_error', $data['error']);
        }
        
        if (isset($data['status']) && $data['status'] !== 200) {
            return new WP_Error('api_error', isset($data['message']) ? $data['message'] : 'API returned error status');
        }
        
        return $data;
    }
}
