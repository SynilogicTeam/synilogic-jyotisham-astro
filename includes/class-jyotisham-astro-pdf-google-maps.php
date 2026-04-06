<?php
/**
 * Google Maps helper for Astro PDF reports.
 */

if (!defined('ABSPATH')) {
    exit;
}

class Jyotisham_Astro_PDF_Google_Maps {

    public function get_google_maps_key() {
        return get_option('jyotisham_google_maps_key', '');
    }

    public function has_google_maps_key() {
        return !empty($this->get_google_maps_key());
    }

    public function get_timezone_action() {
        return 'jyotisham_get_timezone';
    }

    public function get_timezone_nonce_action() {
        return 'jyotisham_nonce';
    }

    public function get_timezone_url() {
        return admin_url('admin-ajax.php');
    }

    public function enqueue_google_maps_script() {
        $google_maps_key = $this->get_google_maps_key();

        if (empty($google_maps_key)) {
            return;
        }

        wp_enqueue_script(
            'google-maps-api',
            'https://maps.googleapis.com/maps/api/js?key=' . rawurlencode($google_maps_key) . '&libraries=places&loading=async',
            array(),
            JYOTISHAM_ASTRO_API_PLUGIN_VERSION,
            true
        );
    }
}
