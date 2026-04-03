<?php
/**
 * Secure API handler for JyotishamAstro API
 * All API calls are made server-side to protect API keys
 */

if (!defined('ABSPATH')) {
    exit;
}

class Jyotisham_API {
    
    private $api_key;
    private $base_url = 'https://api.jyotishamastroapi.com';
    
    public function __construct() {
        $this->api_key = get_option('jyotisham_api_key', '');
    }
    
    /**
     * Test API connection
     */
    public function test_connection() {
        if (empty($this->api_key)) {
            return array(
                'success' => false,
                'message' => 'API key not configured'
            );
        }
        
        // Test with a simple endpoint
        $test_data = array(
            'date' => '01/01/1990',
            'time' => '12:00',
            'latitude' => '28.6139',
            'longitude' => '77.2090',
            'tz' => '5.5',
            'lang' => 'en'
        );
        
        $response = $this->make_api_call('/api/extended_horoscope/extended_kundali', $test_data);
        
        if (is_wp_error($response)) {
            return array(
                'success' => false,
                'message' => $response->get_error_message()
            );
        }
        
        if (isset($response['status']) && $response['status'] === 200) {
            return array(
                'success' => true,
                'message' => 'API connection successful'
            );
        }
        
        return array(
            'success' => false,
            'message' => 'API test failed'
        );
    }
    
    /**
     * Generate basic Kundli data
     */
    public function get_basic_kundli($data) {
        return $this->make_api_call('/api/extended_horoscope/extended_kundali', $data);
    }
    
    /**
     * Get chart data
     */
    public function get_chart_data($data, $style = 'north', $division = 'd1') {
        $params = array_merge($data, array(
            'style' => $style
        ));
        
        return $this->make_api_call("/api/chart_image/{$division}", $params);
    }
    
    /**
     * Get planetary data
     */
    public function get_planetary_data($data) {
        return $this->make_api_call('/api/horoscope/planet-details', $data);
    }
    
    /**
     * Get dashas data
     */
    public function get_dashas_data($data) {
        return $this->make_api_call('/api/dasha/current-mahadasha-full', $data);
    }
    
    /**
     * Get ashtakvarga data
     */
    public function get_ashtakvarga_data($data) {
        return $this->make_api_call('/api/horoscope/ashtakvarga', $data);
    }
    
    /**
     * Get ascendant data
     */
    public function get_ascendant_data($data) {
        return $this->make_api_call('/api/horoscope/ascendant-report', $data);
    }
    
    /**
     * Get KP data
     */
    public function get_kp_data($data) {
        return $this->make_api_call('/api/extended_horoscope/planets_kp', $data);
    }
    
    /**
     * Get dosh data
     */
    public function get_dosh_data($data) {
        $mangal_dosh = $this->make_api_call('/api/dosha/mangal_dosh', $data);
        $kaal_sarp_dosh = $this->make_api_call('/api/dosha/kaalsarp-dosh', $data);
        $manglik_dosh = $this->make_api_call('/api/dosha/manglik-dosh', $data);
        $pitra_dosh = $this->make_api_call('/api/dosha/pitra-dosh', $data);
        
        return array(
            'mangalDosh' => $mangal_dosh,
            'kaalSarpDosh' => $kaal_sarp_dosh,
            'manglikDosh' => $manglik_dosh,
            'pitraDosh' => $pitra_dosh
        );
    }
    
    /**
     * Get rudraksh data
     */
    public function get_rudraksh_data($data) {
        return $this->make_api_call('/api/extended_horoscope/rudraksh_suggestion', $data);
    }
    
    /**
     * Get gem data
     */
    public function get_gem_data($data) {
        return $this->make_api_call('/api/extended_horoscope/gem_suggestion', $data);
    }
    
    /**
     * Get Sade Sati (current_sadesati) data
     */
    public function get_sadesati_data($data) {
        $data['date'] = $this->format_date($data['date']);
        return $this->make_api_call('/api/extended_horoscope/current_sadesati', $data);
    }
    
    /**
     * Get Panchang data
     */
    public function get_panchang_data($data) {
        // Convert date from YYYY-MM-DD to DD/MM/YYYY format for API
        $data['date'] = $this->format_date($data['date']);
        return $this->make_api_call('/api/panchang/panchang', $data);
    }
    
    /**
     * Get Choghadiya data
     */
    public function get_choghadiya_data($data) {
        // Convert date from YYYY-MM-DD to DD/MM/YYYY format for API
        $data['date'] = $this->format_date($data['date']);
        return $this->make_api_call('/api/panchang/choghadiya-muhurta', $data);
    }
    
    /**
     * Get Ashtakoot matching data
     */
    public function get_ashtakoot_matching($data) {
        $params = array(
            'boy_dob' => $data['boy_date'],
            'boy_tob' => $data['boy_time'],
            'boy_lat' => $data['boy_latitude'],
            'boy_lon' => $data['boy_longitude'],
            'boy_tz' => $data['boy_tz'],
            'girl_dob' => $data['girl_date'],
            'girl_tob' => $data['girl_time'],
            'girl_lat' => $data['girl_latitude'],
            'girl_lon' => $data['girl_longitude'],
            'girl_tz' => $data['girl_tz'],
            'lang' => $data['lang']
        );
        
        return $this->make_api_call('/api/matching/ashtakoot-astro', $params);
    }
    
    /**
     * Get Dashakoot matching data
     */
    public function get_dashakoot_matching($data) {
        $params = array(
            'boy_dob' => $data['boy_date'],
            'boy_tob' => $data['boy_time'],
            'boy_lat' => $data['boy_latitude'],
            'boy_lon' => $data['boy_longitude'],
            'boy_tz' => $data['boy_tz'],
            'girl_dob' => $data['girl_date'],
            'girl_tob' => $data['girl_time'],
            'girl_lat' => $data['girl_latitude'],
            'girl_lon' => $data['girl_longitude'],
            'girl_tz' => $data['girl_tz'],
            'lang' => $data['lang']
        );
        
        return $this->make_api_call('/api/matching/dashakoot-astro', $params);
    }
    
    /**
     * Get aggregate matching data
     */
    public function get_aggregate_matching($data) {
        $params = array(
            'boy_dob' => $data['boy_date'],
            'boy_tob' => $data['boy_time'],
            'boy_lat' => $data['boy_latitude'],
            'boy_lon' => $data['boy_longitude'],
            'boy_tz' => $data['boy_tz'],
            'girl_dob' => $data['girl_date'],
            'girl_tob' => $data['girl_time'],
            'girl_lat' => $data['girl_latitude'],
            'girl_lon' => $data['girl_longitude'],
            'girl_tz' => $data['girl_tz'],
            'lang' => $data['lang']
        );
        
        return $this->make_api_call('/api/matching/aggregate-match', $params);
    }
    
    /**
     * Get Nakshatra matching data
     */
    public function get_nakshatra_matching($data) {
        // First get ashtakoot data to extract nakshatra numbers
        $ashtakoot_data = $this->get_ashtakoot_matching($data);
        
        if (is_wp_error($ashtakoot_data)) {
            return $ashtakoot_data;
        }
        
        if (!isset($ashtakoot_data['response']['boy_planetary_details']['2']['nakshatra_no']) ||
            !isset($ashtakoot_data['response']['girl_planetary_details']['2']['nakshatra_no'])) {
            return new WP_Error('nakshatra_error', 'Unable to extract nakshatra numbers from ashtakoot data');
        }
        
        $boy_nakshatra = $ashtakoot_data['response']['boy_planetary_details']['2']['nakshatra_no'];
        $girl_nakshatra = $ashtakoot_data['response']['girl_planetary_details']['2']['nakshatra_no'];
        
        $params = array(
            'boy_nakshatra' => $boy_nakshatra,
            'girl_nakshatra' => $girl_nakshatra,
            'lang' => $data['lang']
        );
        
        return $this->make_api_call('/api/matching/nakshatra-match', $params);
    }
    
    /**
     * Get timezone data from Google Maps API
     */
    public function get_timezone($lat, $lng) {
        $google_maps_key = get_option('jyotisham_google_maps_key', '');
        
        if (empty($google_maps_key)) {
            return array(
                'success' => false,
                'message' => 'Google Maps API key not configured'
            );
        }
        
        $timestamp = time();
        $url = "https://maps.googleapis.com/maps/api/timezone/json?location={$lat},{$lng}&timestamp={$timestamp}&key={$google_maps_key}";
        
        $response = wp_remote_get($url, array(
            'timeout' => 30,
            'sslverify' => true
        ));
        
        if (is_wp_error($response)) {
            return array(
                'success' => false,
                'message' => $response->get_error_message()
            );
        }
        
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);
        
        if ($data['status'] === 'OK') {
            $timezone = ($data['rawOffset'] + $data['dstOffset']) / 3600;
            return array(
                'success' => true,
                'timezone' => $timezone,
                'data' => $data
            );
        }
        
        return array(
            'success' => false,
            'message' => 'Failed to get timezone data: ' . ($data['errorMessage'] ?? 'Unknown error')
        );
    }
    
    /**
     * Make secure API call to JyotishamAstro
     */
    private function make_api_call($endpoint, $params = array()) {
        if (empty($this->api_key)) {
            return new WP_Error('no_api_key', 'API key not configured');
        }
        
        $url = $this->base_url . $endpoint;
        
        // Add common parameters
        $common_params = array(
            'date' => isset($params['date']) ? $params['date'] : '',
            'time' => isset($params['time']) ? $params['time'] : '',
            'latitude' => isset($params['latitude']) ? $params['latitude'] : '',
            'longitude' => isset($params['longitude']) ? $params['longitude'] : '',
            'tz' => isset($params['tz']) ? $params['tz'] : '',
            'lang' => isset($params['lang']) ? $params['lang'] : 'en'
        );
        
        // Merge with additional parameters
        $all_params = array_merge($common_params, $params);
        
        // Remove empty parameters
        $all_params = array_filter($all_params, function($value) {
            return $value !== '' && $value !== null;
        });
        
        $url .= '?' . http_build_query($all_params);
        
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
    
    /**
     * Format date for API
     */
    public function format_date($date_string) {
        $date = new DateTime($date_string);
        return $date->format('d/m/Y');
    }
    
    /**
     * Validate API key format
     */
    public function validate_api_key($api_key) {
        if (empty($api_key)) {
            return false;
        }
        
        if (strlen($api_key) < 10) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Get API usage statistics (if available)
     */
    public function get_usage_stats() {
        // This would depend on the API provider's capabilities
        return array(
            'calls_made' => get_option('jyotisham_api_calls_made', 0),
            'last_call' => get_option('jyotisham_api_last_call', ''),
            'status' => get_option('jyotisham_api_status', 'disconnected')
        );
    }
    
    /**
     * Log API call for monitoring
     */
    private function log_api_call($endpoint, $success) {
        $calls_made = get_option('jyotisham_api_calls_made', 0);
        update_option('jyotisham_api_calls_made', $calls_made + 1);
        update_option('jyotisham_api_last_call', current_time('mysql'));
        
        // Logging removed for production
    }
}
