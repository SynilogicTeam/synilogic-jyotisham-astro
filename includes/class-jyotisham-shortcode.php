<?php
/**
 * Shortcode handler for Jyotisham Kundli Generator
 */

if (!defined('ABSPATH')) {
    exit;
}

class Jyotisham_Shortcode {
    
    public function __construct() {
        add_shortcode('jyotisham_kundli', array($this, 'render_kundli_shortcode'));
    }
    
    /**
     * Render the main Kundli generator shortcode
     */
    public function render_kundli_shortcode($atts) {
        $atts = shortcode_atts(array(
            'basic' => 'false',
            'language' => 'en',
            'title' => 'Kundli Generator',
            'description' => 'Generate your complete astrological chart using JyotishamAstro API'
        ), $atts);
        
        // Check if API is configured
        $api_status = get_option('jyotisham_api_status', 'disconnected');
        if ($api_status !== 'connected') {
            return $this->render_error_message('API not configured. Please contact the administrator.');
        }
        
        // Enqueue assets directly when shortcode is rendered
        // This ensures CSS/JS loads regardless of how shortcode is added (page builder, widget, etc.)
        $google_maps_key = get_option('jyotisham_google_maps_key', '');
        
        // Enqueue Google Maps API if key is available
        if (!empty($google_maps_key)) {
            wp_enqueue_script(
                'google-maps-api',
                'https://maps.googleapis.com/maps/api/js?key=' . $google_maps_key . '&libraries=places&loading=async',
                array(),
                JYOTISHAM_ASTRO_API_PLUGIN_VERSION,
                true
            );
        }
        
        // Enqueue main plugin styles
        wp_enqueue_style(
            'jyotisham-astro-api-style',
            JYOTISHAM_ASTRO_API_PLUGIN_URL . 'assets/css/style.css',
            array(),
            JYOTISHAM_ASTRO_API_PLUGIN_VERSION
        );
        
        // Enqueue main plugin scripts
        wp_enqueue_script(
            'jyotisham-astro-api-script',
            JYOTISHAM_ASTRO_API_PLUGIN_URL . 'assets/js/script.js',
            array('jquery'),
            JYOTISHAM_ASTRO_API_PLUGIN_VERSION,
            true
        );
        
        // Localize script with AJAX URL and nonce
        wp_localize_script('jyotisham-astro-api-script', 'jyotisham_ajax', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('jyotisham_nonce'),
            'google_maps_key' => $google_maps_key
        ));
        
        // Generate unique ID for this instance
        $instance_id = 'jyotisham-' . uniqid();
        
        ob_start();
        ?>
        <div id="<?php echo esc_attr($instance_id); ?>" class="jyotisham-container jyotisham-kundli-container">
            <header class="jyotisham-header">
                <h1>🔮 <?php echo esc_html($atts['title']); ?></h1>
                <p><?php echo esc_html($atts['description']); ?></p>
            </header>

            <!-- User Input Form -->
            <div class="jyotisham-form-container">
                <form id="jyotisham-astro-api-form" class="jyotisham-form">
                    <div class="jyotisham-form-group">
                        <label for="jyotisham-name">Name:</label>
                        <input type="text" id="jyotisham-name" name="name" required />
                    </div>

                    <div class="jyotisham-form-group">
                        <label for="jyotisham-dateOfBirth">Date of Birth:</label>
                        <input type="date" id="jyotisham-dateOfBirth" name="dateOfBirth" required />
                    </div>

                    <div class="jyotisham-form-group">
                        <label for="jyotisham-timeOfBirth">Time of Birth:</label>
                        <input type="time" id="jyotisham-timeOfBirth" name="timeOfBirth" required />
                    </div>

                    <div class="jyotisham-form-group">
                        <label for="jyotisham-placeOfBirth">Place of Birth:</label>
                        <div class="jyotisham-search-input-container">
                            <input type="text" id="jyotisham-placeOfBirth" name="placeOfBirth" 
                                   placeholder="Enter your place of birth" required autocomplete="off" />
                        </div>
                        <input type="hidden" id="jyotisham-latitude" name="latitude" />
                        <input type="hidden" id="jyotisham-longitude" name="longitude" />
                        <input type="hidden" id="jyotisham-timezone" name="timezone" />
                    </div>

                    <div class="jyotisham-form-group">
                        <label for="<?php echo esc_attr($instance_id); ?>-language">Language:</label>
                        <select id="<?php echo esc_attr($instance_id); ?>-language" name="language" required>
                            <option value="en" <?php selected($atts['language'], 'en'); ?>>English</option>
                            <option value="hi" <?php selected($atts['language'], 'hi'); ?>>Hindi</option>
                            <option value="ta" <?php selected($atts['language'], 'ta'); ?>>Tamil</option>
                            <option value="te" <?php selected($atts['language'], 'te'); ?>>Telugu</option>
                            <option value="ka" <?php selected($atts['language'], 'ka'); ?>>Kannada</option>
                            <option value="ml" <?php selected($atts['language'], 'ml'); ?>>Malayalam</option>
                            <option value="be" <?php selected($atts['language'], 'be'); ?>>Bengali</option>
                            <option value="gr" <?php selected($atts['language'], 'gr'); ?>>Gujarati</option>
                            <option value="mr" <?php selected($atts['language'], 'mr'); ?>>Marathi</option>
                        </select>
                    </div>

                    <button type="submit" class="jyotisham-generate-btn">
                        Generate Kundli
                    </button>
                </form>
            </div>

            <!-- Loading Indicator -->
            <div class="jyotisham-loading jyotisham-hidden" data-role="loading">
                <div class="jyotisham-spinner"></div>
                <p>Generating your Kundli...</p>
            </div>

            <!-- Results Container -->
            <div class="jyotisham-results jyotisham-hidden" data-role="results">
                <?php if ($atts['basic'] !== 'true'): ?>
                <!-- Tab Navigation -->
                <div class="jyotisham-tab-navigation">
                    <button class="jyotisham-tab-btn jyotisham-active" data-tab="basic">
                        Basic
                    </button>
                    <button class="jyotisham-tab-btn" data-tab="chart">Chart</button>
                    <button class="jyotisham-tab-btn" data-tab="planetary">
                        Planetary
                    </button>
                    <button class="jyotisham-tab-btn" data-tab="dashas">Dashas</button>
                    <button class="jyotisham-tab-btn" data-tab="ashtakvarga">
                        Ashtakvarga
                    </button>
                    <button class="jyotisham-tab-btn" data-tab="ascendant">
                        Ascendant Sign
                    </button>
                    <button class="jyotisham-tab-btn" data-tab="kp">KP</button>
                    <button class="jyotisham-tab-btn" data-tab="dosh">Dosh</button>
                    <button class="jyotisham-tab-btn" data-tab="rudraksh">
                        Rudraksh
                    </button>
                    <button class="jyotisham-tab-btn" data-tab="gem">
                        Gem Suggestion
                    </button>
                </div>
                <?php endif; ?>

                <!-- Tab Content -->
                <div class="jyotisham-tab-content">
                    <!-- Basic Tab -->
                    <div id="jyotisham-basic" class="jyotisham-tab-pane jyotisham-active">
                        <h2>Basic Details</h2>
                        <div id="jyotisham-basicContent" class="jyotisham-content"></div>
                    </div>

                    <?php if ($atts['basic'] !== 'true'): ?>
                    <!-- Chart Tab -->
                    <div id="jyotisham-chart" class="jyotisham-tab-pane">
                        <h2>Astrological Charts</h2>
                        <div class="jyotisham-chart-controls">
                            <div class="jyotisham-chart-style-tabs">
                                <button class="jyotisham-style-btn jyotisham-active" data-style="north">
                                    North Indian
                                </button>
                                <button class="jyotisham-style-btn" data-style="south">
                                    South Indian
                                </button>
                                <button class="jyotisham-style-btn" data-style="east">
                                    East Indian
                                </button>
                            </div>
                            <div class="jyotisham-chart-division-tabs">
                                <button class="jyotisham-division-btn jyotisham-active" data-division="d1">
                                    D1
                                </button>
                                <button class="jyotisham-division-btn" data-division="d3">
                                    D3
                                </button>
                                <button class="jyotisham-division-btn" data-division="d4">
                                    D4
                                </button>
                                <button class="jyotisham-division-btn" data-division="d6">
                                    D6
                                </button>
                                <button class="jyotisham-division-btn" data-division="d7">
                                    D7
                                </button>
                                <button class="jyotisham-division-btn" data-division="d8">
                                    D8
                                </button>
                                <button class="jyotisham-division-btn" data-division="d9">
                                    D9
                                </button>
                                <button class="jyotisham-division-btn" data-division="d10">
                                    D10
                                </button>
                                <button class="jyotisham-division-btn" data-division="d12">
                                    D12
                                </button>
                                <button class="jyotisham-division-btn" data-division="d16">
                                    D16
                                </button>
                                <button class="jyotisham-division-btn" data-division="d20">
                                    D20
                                </button>
                                <button class="jyotisham-division-btn" data-division="d24">
                                    D24
                                </button>
                                <button class="jyotisham-division-btn" data-division="d27">
                                    D27
                                </button>
                                <button class="jyotisham-division-btn" data-division="d30">
                                    D30
                                </button>
                                <button class="jyotisham-division-btn" data-division="d40">
                                    D40
                                </button>
                                <button class="jyotisham-division-btn" data-division="d45">
                                    D45
                                </button>
                                <button class="jyotisham-division-btn" data-division="d60">
                                    D60
                                </button>
                                <button class="jyotisham-division-btn" data-division="sun">
                                    SUN
                                </button>
                                <button class="jyotisham-division-btn" data-division="moon">
                                    MOON
                                </button>
                                <button class="jyotisham-division-btn" data-division="bhav_chalit_chart">
                                    BHAV CHALIT
                                </button>
                                <!-- <button class="jyotisham-division-btn" data-division="transit_chart">
                                    TRANSIT CHART
                                </button> -->
                            </div>
                        </div>
                        <div id="jyotisham-chartContent" class="jyotisham-content"></div>
                    </div>

                    <!-- Planetary Tab -->
                    <div id="jyotisham-planetary" class="jyotisham-tab-pane">
                        <h2>Planetary Details</h2>
                        <div id="jyotisham-planetaryContent" class="jyotisham-content"></div>
                    </div>

                    <!-- Dashas Tab -->
                    <div id="jyotisham-dashas" class="jyotisham-tab-pane">
                        <h2>Planetary Periods (Dashas)</h2>
                        <div id="jyotisham-dashasContent" class="jyotisham-content"></div>
                    </div>

                    <!-- Ashtakvarga Tab -->
                    <div id="jyotisham-ashtakvarga" class="jyotisham-tab-pane">
                        <h2>Ashtakvarga</h2>
                        <div id="jyotisham-ashtakvargaContent" class="jyotisham-content"></div>
                    </div>

                    <!-- Ascendant Tab -->
                    <div id="jyotisham-ascendant" class="jyotisham-tab-pane">
                        <h2>Ascendant Sign Report</h2>
                        <div id="jyotisham-ascendantContent" class="jyotisham-content"></div>
                    </div>

                    <!-- KP Tab -->
                    <div id="jyotisham-kp" class="jyotisham-tab-pane">
                        <h2>KP Astrology</h2>
                        <div id="jyotisham-kpContent" class="jyotisham-content"></div>
                    </div>

                    <!-- Dosh Tab -->
                    <div id="jyotisham-dosh" class="jyotisham-tab-pane">
                        <h2>Astrological Afflictions (Dosh)</h2>
                        <div id="jyotisham-doshContent" class="jyotisham-content"></div>
                    </div>

                    <!-- Rudraksh Tab -->
                    <div id="jyotisham-rudraksh" class="jyotisham-tab-pane">
                        <h2>Rudraksh Suggestions</h2>
                        <div id="jyotisham-rudrakshContent" class="jyotisham-content"></div>
                    </div>

                    <!-- Gem Tab -->
                    <div id="jyotisham-gem" class="jyotisham-tab-pane">
                        <h2>Gemstone Suggestions</h2>
                        <div id="jyotisham-gemContent" class="jyotisham-content"></div>
                    </div>
                    <?php endif; ?>
                </div>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }
    
    /**
     * Render error message
     */
    private function render_error_message($message) {
        return '<div class="jyotisham-error-message"><p>' . esc_html($message) . '</p></div>';
    }
    
    /**
     * Get available shortcodes for admin
     */
    public static function get_available_shortcodes() {
        return array(
            'jyotisham_kundli' => array(
                'description' => 'Main Kundli generator with all features',
                'attributes' => array(
                    'basic' => 'Set to "true" for basic form only',
                    'language' => 'Default language (en, hi, gu, ta, te, bn)',
                    'title' => 'Custom title for the form',
                    'description' => 'Custom description text'
                )
            )
        );
    }
}
