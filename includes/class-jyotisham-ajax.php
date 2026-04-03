<?php
/**
 * AJAX handlers for Jyotisham Kundli Generator
 * Handles all frontend requests securely
 */

if (!defined('ABSPATH')) {
    exit;
}

class Jyotisham_Ajax {
    
    public function __construct() {
        // Public AJAX actions (for logged-in and non-logged-in users)
        add_action('wp_ajax_jyotisham_generate_kundli', array($this, 'generate_kundli'));
        add_action('wp_ajax_nopriv_jyotisham_generate_kundli', array($this, 'generate_kundli'));
        
        add_action('wp_ajax_jyotisham_get_tab_data', array($this, 'get_tab_data'));
        add_action('wp_ajax_nopriv_jyotisham_get_tab_data', array($this, 'get_tab_data'));
        
        add_action('wp_ajax_jyotisham_get_chart_data', array($this, 'get_chart_data'));
        add_action('wp_ajax_nopriv_jyotisham_get_chart_data', array($this, 'get_chart_data'));
        
        add_action('wp_ajax_jyotisham_get_timezone', array($this, 'get_timezone'));
        add_action('wp_ajax_nopriv_jyotisham_get_timezone', array($this, 'get_timezone'));
        
        // Matching generator AJAX actions
        add_action('wp_ajax_jyotisham_generate_matching', array($this, 'generate_matching'));
        add_action('wp_ajax_nopriv_jyotisham_generate_matching', array($this, 'generate_matching'));
        
        add_action('wp_ajax_jyotisham_get_matching_tab_data', array($this, 'get_matching_tab_data'));
        add_action('wp_ajax_nopriv_jyotisham_get_matching_tab_data', array($this, 'get_matching_tab_data'));
        
        // Panchang generator AJAX actions
        add_action('wp_ajax_jyotisham_get_panchang', array($this, 'get_panchang'));
        add_action('wp_ajax_nopriv_jyotisham_get_panchang', array($this, 'get_panchang'));
        
        // Choghadiya generator AJAX actions
        add_action('wp_ajax_jyotisham_get_choghadiya', array($this, 'get_choghadiya'));
        add_action('wp_ajax_nopriv_jyotisham_get_choghadiya', array($this, 'get_choghadiya'));
    }
    
    /**
     * Generate basic Kundli data
     */
    public function generate_kundli() {
        if (!isset($_POST['nonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['nonce'])), 'jyotisham_nonce')) {
            wp_send_json_error('Security check failed');
        }
        
        $data = $this->sanitize_kundli_data($_POST);
        
        if (!$this->validate_kundli_data($data)) {
            wp_send_json_error('Invalid data provided');
        }
        
        $api = new Jyotisham_API();
        $result = $api->get_basic_kundli($data);
        
        if (is_wp_error($result)) {
            wp_send_json_error($result->get_error_message());
        }
        
        wp_send_json_success($result);
    }
    
    /**
     * Get tab-specific data
     */
    public function get_tab_data() {
        if (!isset($_POST['nonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['nonce'])), 'jyotisham_nonce')) {
            wp_send_json_error('Security check failed');
        }
        
        $tab = isset($_POST['tab']) ? sanitize_text_field(wp_unslash($_POST['tab'])) : '';
        $data = $this->sanitize_kundli_data($_POST);
        
        if (!$this->validate_kundli_data($data)) {
            wp_send_json_error('Invalid data provided');
        }
        
        $api = new Jyotisham_API();
        $result = null;
        
        switch ($tab) {
            case 'planetary':
                $result = $api->get_planetary_data($data);
                break;
            case 'dashas':
                $result = $api->get_dashas_data($data);
                break;
            case 'ashtakvarga':
                $result = $api->get_ashtakvarga_data($data);
                break;
            case 'ascendant':
                $result = $api->get_ascendant_data($data);
                break;
            case 'kp':
                $result = $api->get_kp_data($data);
                break;
            case 'dosh':
                $result = $api->get_dosh_data($data);
                break;
            case 'rudraksh':
                $result = $api->get_rudraksh_data($data);
                break;
            case 'gem':
                $result = $api->get_gem_data($data);
                break;
            default:
                wp_send_json_error('Invalid tab specified');
        }
        
        if (is_wp_error($result)) {
            wp_send_json_error($result->get_error_message());
        }
        
        wp_send_json_success($result);
    }
    
    /**
     * Get chart data
     */
    public function get_chart_data() {
        if (!isset($_POST['nonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['nonce'])), 'jyotisham_nonce')) {
            wp_send_json_error('Security check failed');
        }
        
        $data = $this->sanitize_kundli_data($_POST);
        $style = isset($_POST['style']) ? sanitize_text_field(wp_unslash($_POST['style'])) : '';
        $division = isset($_POST['division']) ? sanitize_text_field(wp_unslash($_POST['division'])) : '';
        
        if (!$this->validate_kundli_data($data)) {
            wp_send_json_error('Invalid data provided');
        }
        
        $api = new Jyotisham_API();
        $result = $api->get_chart_data($data, $style, $division);
        
        if (is_wp_error($result)) {
            wp_send_json_error($result->get_error_message());
        }
        
        wp_send_json_success($result);
    }
    
    /**
     * Get timezone data
     */
    public function get_timezone() {
        if (!isset($_POST['nonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['nonce'])), 'jyotisham_nonce')) {
            wp_send_json_error('Security check failed');
        }
        
		$lat = isset($_POST['latitude']) ? floatval(wp_unslash($_POST['latitude'])) : 0;
		$lng = isset($_POST['longitude']) ? floatval(wp_unslash($_POST['longitude'])) : 0;
        
        if (!$lat || !$lng) {
            wp_send_json_error('Invalid coordinates provided');
        }
        
        $api = new Jyotisham_API();
        $result = $api->get_timezone($lat, $lng);
        
        if (!$result['success']) {
            wp_send_json_error($result['message']);
        }
        
        wp_send_json_success(array('timezone' => $result['timezone']));
    }
    
    /**
     * Get Panchang data
     */
    public function get_panchang() {
        if (!isset($_POST['nonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['nonce'])), 'jyotisham_nonce')) {
            wp_send_json_error('Security check failed');
        }
        
        $data = $this->sanitize_panchang_data($_POST);
        
        if (!$this->validate_panchang_data($data)) {
            wp_send_json_error('Invalid data provided');
        }
        
        $api = new Jyotisham_API();
        $result = $api->get_panchang_data($data);
        
        if (is_wp_error($result)) {
            wp_send_json_error($result->get_error_message());
        }
        
        wp_send_json_success($result);
    }
    
    /**
     * Get Choghadiya data
     */
    public function get_choghadiya() {
        if (!isset($_POST['nonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['nonce'])), 'jyotisham_nonce')) {
            wp_send_json_error('Security check failed');
        }
        
        $data = $this->sanitize_choghadiya_data($_POST);
        
        if (!$this->validate_choghadiya_data($data)) {
            wp_send_json_error('Invalid data provided');
        }
        
        $api = new Jyotisham_API();
        $result = $api->get_choghadiya_data($data);
        
        if (is_wp_error($result)) {
            wp_send_json_error($result->get_error_message());
        }
        
        wp_send_json_success($result);
    }
    
    /**
     * Generate matching data
     */
    public function generate_matching() {
        if (!isset($_POST['nonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['nonce'])), 'jyotisham_nonce')) {
            wp_send_json_error('Security check failed');
        }
        
        $data = $this->sanitize_matching_data($_POST);
        
        if (!$this->validate_matching_data($data)) {
            wp_send_json_error('Invalid data provided');
        }
        
        $api = new Jyotisham_API();
        $result = $api->get_ashtakoot_matching($data);
        
        if (is_wp_error($result)) {
            wp_send_json_error($result->get_error_message());
        }
        
        wp_send_json_success($result);
    }
    
    /**
     * Get matching tab-specific data
     */
    public function get_matching_tab_data() {
        if (!isset($_POST['nonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['nonce'])), 'jyotisham_nonce')) {
            wp_send_json_error('Security check failed');
        }
        
        $tab = isset($_POST['tab']) ? sanitize_text_field(wp_unslash($_POST['tab'])) : '';
        $data = $this->sanitize_matching_data($_POST);
        
        if (!$this->validate_matching_data($data)) {
            wp_send_json_error('Invalid data provided');
        }
        
        $api = new Jyotisham_API();
        $result = null;
        
        switch ($tab) {
            case 'ashtakoot':
                $result = $api->get_ashtakoot_matching($data);
                break;
            case 'dashakoot':
                $result = $api->get_dashakoot_matching($data);
                break;
            case 'aggregate':
                $result = $api->get_aggregate_matching($data);
                break;
            case 'nakshatra':
                $result = $api->get_nakshatra_matching($data);
                break;
            default:
                wp_send_json_error('Invalid tab specified');
        }
        
        if (is_wp_error($result)) {
            wp_send_json_error($result->get_error_message());
        }
        
        wp_send_json_success($result);
    }
    
    
    /**
     * Sanitize Kundli data
     */
    private function sanitize_kundli_data($data) {
        return array(
            'name' => isset($data['name']) ? sanitize_text_field(wp_unslash($data['name'])) : '',
            'date' => isset($data['date']) ? sanitize_text_field(wp_unslash($data['date'])) : '',
            'time' => isset($data['time']) ? sanitize_text_field(wp_unslash($data['time'])) : '',
            'latitude' => isset($data['latitude']) ? floatval($data['latitude']) : 0,
            'longitude' => isset($data['longitude']) ? floatval($data['longitude']) : 0,
            'tz' => isset($data['tz']) ? floatval($data['tz']) : 0,
            'lang' => isset($data['lang']) ? sanitize_text_field(wp_unslash($data['lang'])) : 'en'
        );
    }
    
    /**
     * Validate Kundli data
     */
    private function validate_kundli_data($data) {
        // Check required fields
        if (empty($data['name']) || empty($data['date']) || empty($data['time'])) {
            return false;
        }
        
        // Validate coordinates
        if (!$data['latitude'] || !$data['longitude']) {
            return false;
        }
        
        // Validate latitude (-90 to 90)
        if ($data['latitude'] < -90 || $data['latitude'] > 90) {
            return false;
        }
        
        // Validate longitude (-180 to 180)
        if ($data['longitude'] < -180 || $data['longitude'] > 180) {
            return false;
        }
        
        // Validate timezone (-12 to 14)
        if ($data['tz'] < -12 || $data['tz'] > 14) {
            return false;
        }
        
        // Validate language
        $allowed_languages = array('en', 'hi', 'ta', 'te', 'ka', 'ml', 'be', 'gr', 'mr');
        if (!in_array($data['lang'], $allowed_languages)) {
            return false;
        }
        
        // Validate date format (should be in DD/MM/YYYY format)
        if (!preg_match('/^\d{2}\/\d{2}\/\d{4}$/', $data['date'])) {
            return false;
        }
        
        // Validate time format (should be in HH:MM format)
        if (!preg_match('/^\d{2}:\d{2}$/', $data['time'])) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Sanitize matching data
     */
    private function sanitize_matching_data($data) {
        return array(
            'boy_name' => isset($data['boy_name']) ? sanitize_text_field(wp_unslash($data['boy_name'])) : '',
            'boy_date' => isset($data['boy_date']) ? sanitize_text_field(wp_unslash($data['boy_date'])) : '',
            'boy_time' => isset($data['boy_time']) ? sanitize_text_field(wp_unslash($data['boy_time'])) : '',
            'boy_latitude' => isset($data['boy_latitude']) ? floatval($data['boy_latitude']) : 0,
            'boy_longitude' => isset($data['boy_longitude']) ? floatval($data['boy_longitude']) : 0,
            'boy_tz' => isset($data['boy_tz']) ? floatval($data['boy_tz']) : 0,
            'girl_name' => isset($data['girl_name']) ? sanitize_text_field(wp_unslash($data['girl_name'])) : '',
            'girl_date' => isset($data['girl_date']) ? sanitize_text_field(wp_unslash($data['girl_date'])) : '',
            'girl_time' => isset($data['girl_time']) ? sanitize_text_field(wp_unslash($data['girl_time'])) : '',
            'girl_latitude' => isset($data['girl_latitude']) ? floatval($data['girl_latitude']) : 0,
            'girl_longitude' => isset($data['girl_longitude']) ? floatval($data['girl_longitude']) : 0,
            'girl_tz' => isset($data['girl_tz']) ? floatval($data['girl_tz']) : 0,
            'lang' => isset($data['lang']) ? sanitize_text_field(wp_unslash($data['lang'])) : 'en'
        );
    }
    
    /**
     * Sanitize Panchang data
     */
    private function sanitize_panchang_data($data) {
        return array(
            'date' => isset($data['date']) ? sanitize_text_field(wp_unslash($data['date'])) : '',
            'time' => isset($data['time']) ? sanitize_text_field(wp_unslash($data['time'])) : '',
            'latitude' => isset($data['latitude']) ? floatval($data['latitude']) : 0,
            'longitude' => isset($data['longitude']) ? floatval($data['longitude']) : 0,
            'tz' => isset($data['timezone']) ? floatval($data['timezone']) : 0,
            'lang' => isset($data['language']) ? sanitize_text_field(wp_unslash($data['language'])) : 'en'
        );
    }
    
    /**
     * Validate matching data
     */
    private function validate_matching_data($data) {
        // Check required fields for boy
        if (empty($data['boy_name']) || empty($data['boy_date']) || empty($data['boy_time'])) {
            return false;
        }
        
        // Check required fields for girl
        if (empty($data['girl_name']) || empty($data['girl_date']) || empty($data['girl_time'])) {
            return false;
        }
        
        // Validate boy coordinates
        if (!$data['boy_latitude'] || !$data['boy_longitude']) {
            return false;
        }
        
        // Validate girl coordinates
        if (!$data['girl_latitude'] || !$data['girl_longitude']) {
            return false;
        }
        
        // Validate boy latitude (-90 to 90)
        if ($data['boy_latitude'] < -90 || $data['boy_latitude'] > 90) {
            return false;
        }
        
        // Validate boy longitude (-180 to 180)
        if ($data['boy_longitude'] < -180 || $data['boy_longitude'] > 180) {
            return false;
        }
        
        // Validate girl latitude (-90 to 90)
        if ($data['girl_latitude'] < -90 || $data['girl_latitude'] > 90) {
            return false;
        }
        
        // Validate girl longitude (-180 to 180)
        if ($data['girl_longitude'] < -180 || $data['girl_longitude'] > 180) {
            return false;
        }
        
        // Validate boy timezone (-12 to 14)
        if ($data['boy_tz'] < -12 || $data['boy_tz'] > 14) {
            return false;
        }
        
        // Validate girl timezone (-12 to 14)
        if ($data['girl_tz'] < -12 || $data['girl_tz'] > 14) {
            return false;
        }
        
        // Validate language
        $allowed_languages = array('en', 'hi', 'ta', 'te', 'ka', 'ml', 'be', 'gr', 'mr');
        if (!in_array($data['lang'], $allowed_languages)) {
            return false;
        }
        
        // Validate boy date format (should be in DD/MM/YYYY format)
        if (!preg_match('/^\d{2}\/\d{2}\/\d{4}$/', $data['boy_date'])) {
            return false;
        }
        
        // Validate girl date format (should be in DD/MM/YYYY format)
        if (!preg_match('/^\d{2}\/\d{2}\/\d{4}$/', $data['girl_date'])) {
            return false;
        }
        
        // Validate boy time format (should be in HH:MM format)
        if (!preg_match('/^\d{2}:\d{2}$/', $data['boy_time'])) {
            return false;
        }
        
        // Validate girl time format (should be in HH:MM format)
        if (!preg_match('/^\d{2}:\d{2}$/', $data['girl_time'])) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Validate Panchang data
     */
    private function validate_panchang_data($data) {
        // Check required fields
        if (empty($data['date']) || empty($data['time'])) {
            return false;
        }
        
        // Validate coordinates
        if (!$data['latitude'] || !$data['longitude']) {
            return false;
        }
        
        // Validate latitude (-90 to 90)
        if ($data['latitude'] < -90 || $data['latitude'] > 90) {
            return false;
        }
        
        // Validate longitude (-180 to 180)
        if ($data['longitude'] < -180 || $data['longitude'] > 180) {
            return false;
        }
        
        // Validate timezone (-12 to 14)
        if ($data['tz'] < -12 || $data['tz'] > 14) {
            return false;
        }
        
        // Validate language
        $allowed_languages = array('en', 'hi', 'ta', 'te', 'ka', 'ml', 'be', 'gr', 'mr');
        if (!in_array($data['lang'], $allowed_languages)) {
            return false;
        }
        
        // Validate date format (should be in YYYY-MM-DD format from HTML date input)
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $data['date'])) {
            return false;
        }
        
        // Validate time format (should be in HH:MM format)
        if (!preg_match('/^\d{2}:\d{2}$/', $data['time'])) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Rate limiting check
     */
    private function check_rate_limit() {
        $user_ip = $this->get_user_ip();
        $rate_limit_key = 'jyotisham_rate_limit_' . md5($user_ip);
        $rate_limit_data = get_transient($rate_limit_key);
        
        if ($rate_limit_data === false) {
            set_transient($rate_limit_key, array('count' => 1, 'reset_time' => time() + 3600), 3600);
            return true;
        }
        
        if ($rate_limit_data['count'] >= 10) { // 10 requests per hour
            return false;
        }
        
        $rate_limit_data['count']++;
        set_transient($rate_limit_key, $rate_limit_data, 3600);
        
        return true;
    }
    
    /**
     * Get user IP address
     */
    private function get_user_ip() {
		// Prefer validated IPs; parse potential comma-separated lists in proxies
		$server_vars = array(
			'HTTP_CLIENT_IP',
			'HTTP_X_FORWARDED_FOR',
			'REMOTE_ADDR',
		);

		foreach ($server_vars as $key) {
			if (empty($_SERVER[$key])) {
				continue;
			}

			$value = sanitize_text_field( wp_unslash( $_SERVER[$key] ) );
			// X_FORWARDED_FOR may be a comma-separated list; take the first valid IP
			$candidates = ($key === 'HTTP_X_FORWARDED_FOR') ? array_map('trim', explode(',', $value)) : array($value);

			foreach ($candidates as $candidate) {
				$ip = filter_var($candidate, FILTER_VALIDATE_IP);
				if ($ip) {
					return $ip;
				}
			}
		}

		return '0.0.0.0';
    }
    
    /**
     * Log API usage
     */
    private function log_api_usage($endpoint, $success) {
        // Logging removed for production
        
        // Update usage statistics
        $usage_stats = get_option('jyotisham_usage_stats', array(
            'total_requests' => 0,
            'successful_requests' => 0,
            'failed_requests' => 0,
            'last_request' => ''
        ));
        
        $usage_stats['total_requests']++;
        if ($success) {
            $usage_stats['successful_requests']++;
        } else {
            $usage_stats['failed_requests']++;
        }
        $usage_stats['last_request'] = current_time('mysql');
        
        update_option('jyotisham_usage_stats', $usage_stats);
    }
    
    /**
     * Sanitize Choghadiya data
     */
    private function sanitize_choghadiya_data($data) {
        return array(
            'date' => isset($data['date']) ? sanitize_text_field(wp_unslash($data['date'])) : '',
            'time' => isset($data['time']) ? sanitize_text_field(wp_unslash($data['time'])) : '',
            'latitude' => isset($data['latitude']) ? floatval($data['latitude']) : 0,
            'longitude' => isset($data['longitude']) ? floatval($data['longitude']) : 0,
            'tz' => isset($data['timezone']) ? floatval($data['timezone']) : 0,
            'lang' => isset($data['language']) ? sanitize_text_field(wp_unslash($data['language'])) : 'en'
        );
    }
    
    /**
     * Validate Choghadiya data
     */
    private function validate_choghadiya_data($data) {
        // Check required fields
        if (empty($data['date']) || empty($data['time'])) {
            return false;
        }
        
        // Validate coordinates
        if (!$data['latitude'] || !$data['longitude']) {
            return false;
        }
        
        // Validate latitude (-90 to 90)
        if ($data['latitude'] < -90 || $data['latitude'] > 90) {
            return false;
        }
        
        // Validate longitude (-180 to 180)
        if ($data['longitude'] < -180 || $data['longitude'] > 180) {
            return false;
        }
        
        // Validate timezone (-12 to 14)
        if ($data['tz'] < -12 || $data['tz'] > 14) {
            return false;
        }
        
        // Validate language
        $allowed_languages = array('en', 'hi', 'ta', 'te', 'ka', 'ml', 'be', 'gr', 'mr');
        if (!in_array($data['lang'], $allowed_languages)) {
            return false;
        }
        
        // Validate date format (should be in YYYY-MM-DD format from HTML date input)
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $data['date'])) {
            return false;
        }
        
        // Validate time format (should be in HH:MM format)
        if (!preg_match('/^\d{2}:\d{2}$/', $data['time'])) {
            return false;
        }
        
        return true;
    }
}
