<?php
/**
 * External API handler for Astro PDF reports.
 */

if (!defined('ABSPATH')) {
    exit;
}

class Jyotisham_Astro_PDF_API {

    private $base_url = 'https://api.jyotishamastroapi.com';

    public function get_api_key() {
        return get_option('jyotisham_api_key', '');
    }

    public function is_configured() {
        return !empty($this->get_api_key());
    }

    public function generate_pdf_report($report_slug, array $payload = array()) {
        $api_key = $this->get_api_key();

        if (empty($api_key)) {
            return new WP_Error('jyotisham_pdf_missing_key', 'PDF API key is not configured.');
        }

        $report_slug = sanitize_title($report_slug);
        if (empty($report_slug)) {
            return new WP_Error('jyotisham_pdf_missing_slug', 'Report slug is required.');
        }

        $kundali_pdf_type_map = array(
            'kundali_small' => 'small',
            'kundali_medium' => 'medium',
            'kundali_large' => 'large',
        );

        if (isset($kundali_pdf_type_map[$report_slug])) {
            $payload['pdf_type'] = $kundali_pdf_type_map[$report_slug];
            unset($payload['report_slug']);
            $url = trailingslashit($this->base_url) . 'api/pdf/generate';
        } elseif ($report_slug === 'generate_matching') {
            unset($payload['report_slug']);
            $url = trailingslashit($this->base_url) . 'api/pdf/generate_matching';
        } else {
            $url = trailingslashit($this->base_url) . 'api/pdf/' . rawurlencode($report_slug);
        }

        $url = add_query_arg($this->sanitize_payload($payload), $url);

        $response = wp_remote_get($url, array(
            'timeout' => 45,
            'sslverify' => true,
            'headers' => array(
                'key' => $api_key,
                'Accept' => 'application/json',
                'User-Agent' => 'WordPress-Jyotisham-Astro-PDF/' . JYOTISHAM_ASTRO_API_PLUGIN_VERSION,
            ),
        ));

        if (is_wp_error($response)) {
            return $response;
        }

        $response_code = wp_remote_retrieve_response_code($response);
        $body = wp_remote_retrieve_body($response);

        if ((int) $response_code < 200 || (int) $response_code >= 300) {
            $body_excerpt = wp_strip_all_tags((string) $body);
            if (strlen($body_excerpt) > 300) {
                $body_excerpt = substr($body_excerpt, 0, 300) . '...';
            }
            return new WP_Error('jyotisham_pdf_http_error', 'PDF API request failed with code: ' . $response_code . '. Response: ' . $body_excerpt);
        }

        $data = json_decode($body, true);

        if (json_last_error() !== JSON_ERROR_NONE || !is_array($data)) {
            return new WP_Error('jyotisham_pdf_json_error', 'Invalid JSON response from PDF API.');
        }

        $download_url = $this->extract_download_url($data);

        if (empty($download_url)) {
            return new WP_Error('jyotisham_pdf_missing_url', 'The PDF API response did not include a download URL.');
        }

        return array(
            'downloadUrl' => esc_url_raw($download_url),
            'response' => $data,
        );
    }

    public function build_request_payload(array $user_data, array $company_data, array $extra_data = array()) {
        $latitude = isset($user_data['latitude']) ? (string) floatval($user_data['latitude']) : '';
        $longitude = isset($user_data['longitude']) ? (string) floatval($user_data['longitude']) : '';
        $timezone = isset($user_data['timezone']) ? (string) floatval($user_data['timezone']) : '';
        $date = isset($user_data['date']) ? $this->normalize_date($user_data['date']) : '';

        $payload = array_merge(array(
            'name' => isset($user_data['name']) ? sanitize_text_field($user_data['name']) : '',
            'date' => $date,
            'time' => isset($user_data['time']) ? sanitize_text_field($user_data['time']) : '',
            'place' => isset($user_data['place']) ? sanitize_text_field($user_data['place']) : '',
            'latitude' => $latitude,
            'longitude' => $longitude,
            'lat' => $latitude,
            'lon' => $longitude,
            'tz' => $timezone,
            'lang' => isset($user_data['lang']) ? sanitize_text_field($user_data['lang']) : 'en',
            'style' => isset($user_data['style']) ? sanitize_text_field($user_data['style']) : 'north',
            'watermark' => $this->is_watermark_enabled() ? 'true' : 'false',
        ), $this->sanitize_payload($company_data), $this->sanitize_payload($extra_data));

        return array_filter($payload, static function ($value) {
            return $value !== '' && $value !== null;
        });
    }

    public function get_company_payload() {
        return array(
            'company_name' => get_option('jyotisham_pdf_company_name', ''),
            'company_address' => get_option('jyotisham_pdf_company_address', ''),
            'company_email' => get_option('jyotisham_pdf_company_email', ''),
            'company_phone' => get_option('jyotisham_pdf_company_phone', ''),
            'company_website' => get_option('jyotisham_pdf_company_website', ''),
        );
    }

    public function is_watermark_enabled() {
        return get_option('jyotisham_pdf_watermark_enabled', '0') === '1';
    }

    private function sanitize_payload(array $payload) {
        $clean = array();

        foreach ($payload as $key => $value) {
            if (is_array($value)) {
                continue;
            }

            $key = sanitize_key($key);

            if (in_array($key, array('company_website', 'downloadUrl', 'download_url'), true)) {
                $clean[$key] = esc_url_raw($value);
                continue;
            }

            if (in_array($key, array('latitude', 'longitude', 'tz', 'price', 'boy_lat', 'boy_lon', 'boy_tz', 'girl_lat', 'girl_lon', 'girl_tz'), true)) {
                $clean[$key] = (string) floatval($value);
                continue;
            }

            $clean[$key] = sanitize_text_field($value);
        }

        return $clean;
    }

    private function extract_download_url(array $data) {
        if (!empty($data['downloadUrl'])) {
            return $data['downloadUrl'];
        }

        if (!empty($data['download_url'])) {
            return $data['download_url'];
        }

        if (!empty($data['response']['downloadUrl'])) {
            return $data['response']['downloadUrl'];
        }

        if (!empty($data['data']['downloadUrl'])) {
            return $data['data']['downloadUrl'];
        }

        return '';
    }

    private function normalize_date($date_value) {
        $date_value = sanitize_text_field((string) $date_value);

        if (preg_match('/^\d{2}\/\d{2}\/\d{4}$/', $date_value)) {
            return $date_value;
        }

        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $date_value)) {
            $timestamp = strtotime($date_value);
            if ($timestamp) {
                return gmdate('d/m/Y', $timestamp);
            }
        }

        return $date_value;
    }
}
