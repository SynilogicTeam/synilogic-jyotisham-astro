<?php
/**
 * Admin functionality for Jyotisham Kundli Generator
 */

if (!defined('ABSPATH')) {
    exit;
}

class Jyotisham_Admin {
    
    public function __construct() {
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'register_settings'));
        add_action('admin_notices', array($this, 'admin_notices'));
    }
    
    public function add_admin_menu() {
        add_menu_page(
            'Astro API By Synilogic',
            'Astro API By Synilogic',
            'manage_options',
            'jyotisham-astro-api',
            array($this, 'admin_page'),
            'dashicons-chart-line',
            30
        );
        
        add_submenu_page(
            'jyotisham-astro-api',
            'Settings',
            'Settings',
            'manage_options',
            'jyotisham-astro-api',
            array($this, 'admin_page')
        );
        
        add_submenu_page(
            'jyotisham-astro-api',
            'Shortcodes',
            'Shortcodes',
            'manage_options',
            'jyotisham-shortcodes',
            array($this, 'shortcodes_page')
        );
    }
    
    public function register_settings() {
        register_setting('jyotisham_settings', 'jyotisham_api_key', array(
            'type' => 'string',
            'sanitize_callback' => 'sanitize_text_field',
            'default' => ''
        ));
        register_setting('jyotisham_settings', 'jyotisham_google_maps_key', array(
            'type' => 'string',
            'sanitize_callback' => 'sanitize_text_field',
            'default' => ''
        ));
        register_setting('jyotisham_settings', 'jyotisham_api_status', array(
            'type' => 'string',
            'sanitize_callback' => array($this, 'sanitize_api_status'),
            'default' => 'disconnected'
        ));
        
        add_settings_section(
            'jyotisham_api_section',
            'API Configuration',
            array($this, 'api_section_callback'),
            'jyotisham_settings'
        );
        
        add_settings_field(
            'jyotisham_api_key',
            'Astro API By Synilogic API Key',
            array($this, 'api_key_field_callback'),
            'jyotisham_settings',
            'jyotisham_api_section'
        );
        
        add_settings_field(
            'jyotisham_google_maps_key',
            'Google Maps API Key',
            array($this, 'google_maps_key_field_callback'),
            'jyotisham_settings',
            'jyotisham_api_section'
        );
        
        add_settings_field(
            'jyotisham_api_status',
            'API Status',
            array($this, 'api_status_field_callback'),
            'jyotisham_settings',
            'jyotisham_api_section'
        );
    }

    /**
     * Sanitize API status option to an allowed value.
     *
     * @param string $value Raw option value
     * @return string Sanitized value: 'connected' or 'disconnected'
     */
    public function sanitize_api_status($value) {
        $allowed = array('connected', 'disconnected');
        $value = is_string($value) ? strtolower($value) : '';
        return in_array($value, $allowed, true) ? $value : 'disconnected';
    }
    
    public function api_section_callback() {
        echo '<p>Configure your API keys to enable the Kundli generator functionality.</p>';
    }
    
    public function api_key_field_callback() {
        $api_key = get_option('jyotisham_api_key', '');
        echo '<input type="password" id="jyotisham_api_key" name="jyotisham_api_key" value="' . esc_attr($api_key) . '" class="regular-text" />';
        echo '<p class="description">Enter your Astro API By Synilogic API key. This will be stored securely and used server-side only. <a href="https://www.jyotishamastroapi.com/" target="_blank" rel="noopener noreferrer">Get your API key here</a></p>';
    }
    
    public function google_maps_key_field_callback() {
        $google_maps_key = get_option('jyotisham_google_maps_key', '');
        echo '<input type="password" id="jyotisham_google_maps_key" name="jyotisham_google_maps_key" value="' . esc_attr($google_maps_key) . '" class="regular-text" />';
        echo '<p class="description">Enter your Google Maps API key for location autocomplete functionality. <a href="https://developers.google.com/maps/documentation/javascript/get-api-key" target="_blank" rel="noopener noreferrer">Get your Google Maps API key here</a></p>';
    }
    
    public function api_status_field_callback() {
        $api_status = get_option('jyotisham_api_status', 'disconnected');
        $status_class = $api_status === 'connected' ? 'jyotisham-status-connected' : 'jyotisham-status-disconnected';
        $status_text = $api_status === 'connected' ? 'Connected' : 'Disconnected';
        
        echo '<div class="jyotisham-status-indicator ' . esc_attr($status_class) . '">';
        echo '<span class="jyotisham-status-dot"></span>';
        echo '<span class="jyotisham-status-text">' . esc_html($status_text) . '</span>';
        echo '</div>';
        echo '<p class="description">Current connection status to Astro API By Synilogic.</p>';
    }
    
    public function admin_page() {
        if (isset($_POST['submit']) && isset($_POST['jyotisham_nonce']) && wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['jyotisham_nonce'])), 'jyotisham_settings_nonce')) {
            $this->handle_form_submission();
        }
        
        $api_key = get_option('jyotisham_api_key', '');
        $google_maps_key = get_option('jyotisham_google_maps_key', '');
        $api_status = get_option('jyotisham_api_status', 'disconnected');
        ?>
        <div class="wrap">
            <h1>Astro API By Synilogic Settings</h1>
            
            <div class="jyotisham-admin-container">
                <div class="jyotisham-admin-main">
                    <form method="post" action="">
                        <?php wp_nonce_field('jyotisham_settings_nonce', 'jyotisham_nonce'); ?>
                        
                        <div class="jyotisham-settings-card">
                            <h2>API Configuration</h2>
                            
                            <table class="form-table">
                                <tr>
                                    <th scope="row">
                                        <label for="jyotisham_api_key">Astro API By Synilogic API Key</label>
                                    </th>
                                    <td>
                                        <input type="password" 
                                               id="jyotisham_api_key" 
                                               name="jyotisham_api_key" 
                                               value="<?php echo esc_attr($api_key); ?>" 
                                               class="regular-text" />
                                        <p class="description">
                                            Enter your Astro API By Synilogic API key. 
                                            <a href="https://www.jyotishamastroapi.com/" target="_blank" rel="noopener noreferrer">Get your API key here</a>
                                        </p>
                                    </td>
                                </tr>
                                
                                <tr>
                                    <th scope="row">
                                        <label for="jyotisham_google_maps_key">Google Maps API Key</label>
                                    </th>
                                    <td>
                                        <input type="password" 
                                               id="jyotisham_google_maps_key" 
                                               name="jyotisham_google_maps_key" 
                                               value="<?php echo esc_attr($google_maps_key); ?>" 
                                               class="regular-text" />
                                        <p class="description">
                                            Enter your Google Maps API key for location autocomplete functionality. 
                                            <a href="https://developers.google.com/maps/documentation/javascript/get-api-key" target="_blank" rel="noopener noreferrer">Get your Google Maps API key here</a>
                                        </p>
                                    </td>
                                </tr>
                                
                                <tr>
                                    <th scope="row">API Status</th>
                                    <td>
                                        <div class="jyotisham-status-indicator <?php echo $api_status === 'connected' ? 'jyotisham-status-connected' : 'jyotisham-status-disconnected'; ?>">
                                            <span class="jyotisham-status-dot"></span>
                                            <span class="jyotisham-status-text">
                                                <?php echo $api_status === 'connected' ? 'Connected' : 'Disconnected'; ?>
                                            </span>
                                        </div>
                                        <p class="description">Current connection status to Astro API By Synilogic.</p>
                                    </td>
                                </tr>
                            </table>
                            
                            <div class="jyotisham-actions">
                                <button type="submit" name="test_api" class="button button-secondary">
                                    Test API Connection
                                </button>
                                <button type="submit" name="submit" class="button button-primary">
                                    Save Settings
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
                
                <div class="jyotisham-admin-sidebar">
                    <div class="jyotisham-info-card">
                        <h3>Plugin Information</h3>
                        <p><strong>Version:</strong> <?php echo esc_html(JYOTISHAM_ASTRO_API_PLUGIN_VERSION); ?></p>
                        <p><strong>Status:</strong> 
                            <span class="jyotisham-status-badge <?php echo $api_status === 'connected' ? 'jyotisham-status-connected' : 'jyotisham-status-disconnected'; ?>">
                                <?php echo $api_status === 'connected' ? 'Active' : 'Inactive'; ?>
                            </span>
                        </p>
                    </div>
                    
                    <div class="jyotisham-info-card">
                        <h3>Quick Start</h3>
                        <ol>
                            <li>Enter your Astro API By Synilogic API key</li>
                            <li>Enter your Google Maps API key</li>
                            <li>Test the API connection</li>
                            <li>Use the shortcode <code>[jyotisham_kundli]</code> on any page</li>
                            <li>Use the shortcode <code>[jyotisham_matching]</code> on any page</li>
                            <li>Use the shortcode <code>[jyotisham_panchang]</code> on any page</li>
                            <li>Use the shortcode <code>[jyotisham_choghadiya]</code> on any page</li>
							<li>Use the shortcode <code>[jyotisham_numerology]</code> on any page</li>
						<li>Use the shortcode <code>[jyotisham_hora]</code> on any page</li>
						<li>Use the shortcode <code>[jyotisham_horoscope]</code> on any page</li>
							<li>Use the shortcode <code>[jyotisham_sadesati]</code> on any page</li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>
        <?php
    }
    
    public function shortcodes_page() {
        ?>
        <div class="wrap">
            <h1>Available Shortcodes</h1>
            
            <div class="jyotisham-shortcodes-container">
                <div class="jyotisham-shortcode-card">
                    <h2>Kundli Generator</h2>
                    <p>Displays the complete Kundli generator form with all features.</p>
                    <div class="jyotisham-shortcode-example">
                        <code>[jyotisham_kundli]</code>
                        <button type="button" class="button button-small" onclick="copyToClipboard('[jyotisham_kundli]')">Copy</button>
                    </div>
                </div>
                
				<div class="jyotisham-shortcode-card">
					<h2>Numerology</h2>
					<p>Displays the Numerology generator for name and date-based numerology report.</p>
					<div class="jyotisham-shortcode-example">
						<code>[jyotisham_numerology]</code>
						<button type="button" class="button button-small" onclick="copyToClipboard('[jyotisham_numerology]')">Copy</button>
					</div>
				</div>

				<div class="jyotisham-shortcode-card">
					<h2>Hora Muhurta</h2>
					<p>Displays the Hora Muhurta generator for planetary hours.</p>
					<div class="jyotisham-shortcode-example">
						<code>[jyotisham_hora]</code>
						<button type="button" class="button button-small" onclick="copyToClipboard('[jyotisham_hora]')">Copy</button>
					</div>
				</div>

				<div class="jyotisham-shortcode-card">
					<h2>Horoscope</h2>
					<p>Displays the Horoscope generator with daily, weekly, monthly, and yearly predictions.</p>
					<div class="jyotisham-shortcode-example">
						<code>[jyotisham_horoscope]</code>
						<button type="button" class="button button-small" onclick="copyToClipboard('[jyotisham_horoscope]')">Copy</button>
					</div>
				</div>

				<div class="jyotisham-shortcode-card">
					<h2>Sade Sati Report</h2>
					<p>Displays the Sade Sati report generator for current Sade Sati status and remedies.</p>
					<div class="jyotisham-shortcode-example">
						<code>[jyotisham_sadesati]</code>
						<button type="button" class="button button-small" onclick="copyToClipboard('[jyotisham_sadesati]')">Copy</button>
					</div>
				</div>

                
                <div class="jyotisham-shortcode-card">
                    <h2>Kundli Matching Generator</h2>
                    <p>Displays the Kundli matching generator for compatibility analysis between two people.</p>
                    <div class="jyotisham-shortcode-example">
                        <code>[jyotisham_matching]</code>
                        <button type="button" class="button button-small" onclick="copyToClipboard('[jyotisham_matching]')">Copy</button>
                    </div>
                </div>

                <div class="jyotisham-shortcode-card">
                    <h2>Panchang Generator</h2>
                    <p>Displays the Panchang generator for detailed astrological information.</p>
                    <div class="jyotisham-shortcode-example">
                        <code>[jyotisham_panchang]</code>
                        <button type="button" class="button button-small" onclick="copyToClipboard('[jyotisham_panchang]')">Copy</button>
                    </div>
                </div>
                
                <div class="jyotisham-shortcode-card">
                    <h2>Choghadiya Generator</h2>
                    <p>Displays the Choghadiya Muhurat generator for auspicious timing information.</p>
                    <div class="jyotisham-shortcode-example">
                        <code>[jyotisham_choghadiya]</code>
                        <button type="button" class="button button-small" onclick="copyToClipboard('[jyotisham_choghadiya]')">Copy</button>
                    </div>
                
                </div>
             
            </div>
        </div>
        <?php
    }
    
    private function handle_form_submission() {
        // Verify nonce for security
        if (!isset($_POST['jyotisham_nonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['jyotisham_nonce'])), 'jyotisham_settings_nonce')) {
            wp_die('Security check failed');
        }
        
        if (isset($_POST['test_api'])) {
            $this->test_api_connection();
        } else {
            $this->save_settings();
        }
    }
    
    private function save_settings() {
        // Verify nonce for security
        if (!isset($_POST['jyotisham_nonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['jyotisham_nonce'])), 'jyotisham_settings_nonce')) {
            wp_die('Security check failed');
        }
        
        $api_key = isset($_POST['jyotisham_api_key']) ? sanitize_text_field(wp_unslash($_POST['jyotisham_api_key'])) : '';
        $google_maps_key = isset($_POST['jyotisham_google_maps_key']) ? sanitize_text_field(wp_unslash($_POST['jyotisham_google_maps_key'])) : '';
        
        update_option('jyotisham_api_key', $api_key);
        update_option('jyotisham_google_maps_key', $google_maps_key);
        
        // Test API connection after saving
        $this->test_api_connection();
        
        add_settings_error('jyotisham_settings', 'settings_saved', 'Settings saved successfully!', 'updated');
    }
    
    private function test_api_connection() {
        $api_key = get_option('jyotisham_api_key', '');
        
        if (empty($api_key)) {
            update_option('jyotisham_api_status', 'disconnected');
            add_settings_error('jyotisham_settings', 'api_test_failed', 'API key is required to test connection.', 'error');
            return;
        }
        
        // Test API with a simple request
        $api = new Jyotisham_API();
        $test_result = $api->test_connection();
        
        if ($test_result['success']) {
            update_option('jyotisham_api_status', 'connected');
            add_settings_error('jyotisham_settings', 'api_test_success', 'API connection successful!', 'updated');
        } else {
            update_option('jyotisham_api_status', 'disconnected');
            add_settings_error('jyotisham_settings', 'api_test_failed', 'API connection failed: ' . $test_result['message'], 'error');
        }
    }
    
    public function admin_notices() {
        settings_errors('jyotisham_settings');
    }
}
