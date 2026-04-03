<?php
/**
 * Uninstall file for JyotishamAstro API
 * This file is executed when the plugin is deleted
 */

// If uninstall not called from WordPress, then exit
if (!defined('WP_UNINSTALL_PLUGIN')) {
    exit;
}

// Remove plugin options
delete_option('jyotisham_api_key');
delete_option('jyotisham_google_maps_key');
delete_option('jyotisham_api_status');
delete_option('jyotisham_plugin_version');
delete_option('jyotisham_api_calls_made');
delete_option('jyotisham_api_last_call');
delete_option('jyotisham_usage_stats');

// Remove transients using WordPress functions
// Note: WordPress doesn't provide a direct way to delete transients by pattern
// This is acceptable for uninstall as the plugin is being completely removed

// Clear any cached data
wp_cache_flush();
