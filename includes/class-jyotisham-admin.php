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
        register_setting('jyotisham_settings', 'jyotisham_enable_astro_pdf', array(
            'type' => 'string',
            'sanitize_callback' => array($this, 'sanitize_checkbox_value'),
            'default' => '1'
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

    public function sanitize_checkbox_value($value) {
        return !empty($value) ? '1' : '0';
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
        $enable_astro_pdf = get_option('jyotisham_enable_astro_pdf', '1');
        $woocommerce_installed = class_exists('WooCommerce');
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
                                    <th scope="row">
                                        <label for="jyotisham_enable_astro_pdf">Enable Astro PDF Report</label>
                                    </th>
                                    <td>
                                        <label>
                                            <input type="checkbox"
                                                   id="jyotisham_enable_astro_pdf"
                                                   name="jyotisham_enable_astro_pdf"
                                                   value="1"
                                                   <?php checked($enable_astro_pdf, '1'); ?>
                                                   <?php disabled(!$woocommerce_installed); ?> />
                                            Enable Astro PDF Report product options in WooCommerce products.
                                        </label>
                                        <?php if (!$woocommerce_installed) : ?>
                                            <p class="description" style="color:#b32d2e; font-weight:600; margin-top:8px;">*You must install Woocommerce Plugin to enable PDF option</p>
                                        <?php endif; ?>
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
        $shortcodes = array(
            array('label' => 'Kundli Generator', 'shortcode' => '[jyotisham_kundli]', 'description' => 'Displays the complete Kundli form with all features.'),
            array('label' => 'Numerology', 'shortcode' => '[jyotisham_numerology]', 'description' => 'Displays Numerology for name and date-based report.'),
            array('label' => 'Hora Muhurta', 'shortcode' => '[jyotisham_hora]', 'description' => 'Displays Hora Muhurta for planetary hours.'),
            array('label' => 'Horoscope', 'shortcode' => '[jyotisham_horoscope]', 'description' => 'Displays Horoscope with daily, weekly, monthly, and yearly predictions.'),
            array('label' => 'Sade Sati Report', 'shortcode' => '[jyotisham_sadesati]', 'description' => 'Displays the Sade Sati report for current Sade Sati status and remedies.'),
            array('label' => 'Kundli Matching Generator', 'shortcode' => '[jyotisham_matching]', 'description' => 'Displays Kundli matching for compatibility analysis between two people.'),
            array('label' => 'Panchang Generator', 'shortcode' => '[jyotisham_panchang]', 'description' => 'Displays Panchang for detailed astrological information.'),
            array('label' => 'Choghadiya Generator', 'shortcode' => '[jyotisham_choghadiya]', 'description' => 'Displays Choghadiya Muhurat for auspicious timing information.'),
        );
        ?>
        <div class="wrap">
            <h1>Available Shortcodes</h1>
            
            <div class="jyotisham-shortcodes-panel">
                <table class="widefat striped jyotisham-shortcodes-table">
                    <thead>
                        <tr>
                            <th scope="col">Shortcode Name</th>
                            <th scope="col">Description</th>
                            <th scope="col">Plugin Shortcode</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($shortcodes as $shortcode) : ?>
                            <tr>
                                <td><?php echo esc_html($shortcode['label']); ?></td>
                                <td class="jyotisham-shortcode-description"><?php echo esc_html($shortcode['description']); ?></td>
                                <td>
                                    <code class="jyotisham-shortcode-code" onclick="copyToClipboard('<?php echo esc_js($shortcode['shortcode']); ?>')"><?php echo esc_html($shortcode['shortcode']); ?></code>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
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
        $enable_astro_pdf = isset($_POST['jyotisham_enable_astro_pdf']) ? '1' : '0';

        if (!class_exists('WooCommerce')) {
            $enable_astro_pdf = '0';
        }
        
        update_option('jyotisham_api_key', $api_key);
        update_option('jyotisham_google_maps_key', $google_maps_key);
        update_option('jyotisham_enable_astro_pdf', $enable_astro_pdf);
        
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
