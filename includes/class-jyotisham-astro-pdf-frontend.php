<?php
/**
 * Frontend form for Astro PDF report products.
 */

if (!defined('ABSPATH')) {
    exit;
}

class Jyotisham_Astro_PDF_Frontend {

    private $maps;
    private $api;

    public function __construct() {
        $this->maps = new Jyotisham_Astro_PDF_Google_Maps();
        $this->api = new Jyotisham_Astro_PDF_API();

        add_action('wp_enqueue_scripts', array($this, 'enqueue_assets'));
        add_action('woocommerce_before_add_to_cart_button', array($this, 'render_form'));
    }

    public function enqueue_assets() {
        if (!function_exists('is_product') || !is_product()) {
            return;
        }

        $product = wc_get_product(get_the_ID());
        if (!$this->is_astro_pdf_product($product)) {
            return;
        }

        if (!$this->api->is_configured()) {
            return;
        }

        $this->maps->enqueue_google_maps_script();

        wp_enqueue_style(
            'jyotisham-astro-pdf-report-style',
            JYOTISHAM_ASTRO_API_PLUGIN_URL . 'assets/css/astro-pdf-report.css',
            array(),
            JYOTISHAM_ASTRO_API_PLUGIN_VERSION
        );

        wp_enqueue_script(
            'jyotisham-astro-pdf-report-script',
            JYOTISHAM_ASTRO_API_PLUGIN_URL . 'assets/js/astro-pdf-report.js',
            array(),
            JYOTISHAM_ASTRO_API_PLUGIN_VERSION,
            true
        );

        wp_localize_script('jyotisham-astro-pdf-report-script', 'jyotishamAstroPdfReport', array(
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('jyotisham_nonce'),
            'timezoneAction' => $this->maps->get_timezone_action(),
            'messages' => array(
                'placeRequired' => __('Please select a place from Google Places suggestions.', 'synilogic-jyotisham-astro'),
                'timezonePending' => __('Timezone is still loading. Please wait a moment and try again.', 'synilogic-jyotisham-astro'),
            ),
        ));
    }

    public function render_form() {
        global $product;

        if (!$this->is_astro_pdf_product($product)) {
            return;
        }

        if (!$this->api->is_configured()) {
            echo '<p class="woocommerce-error">' . esc_html__('API not configured. Please contact the administrator.', 'synilogic-jyotisham-astro') . '</p>';
            return;
        }

        $product_id = $product->get_id();
        $report_type = get_post_meta($product_id, '_jyotisham_astro_pdf_report_type', true);
        $report_slug = get_post_meta($product_id, '_jyotisham_astro_pdf_report_slug', true);
        $google_maps_key = $this->maps->get_google_maps_key();
        ?>
        <div class="jyotisham-astro-pdf-form-wrap" data-jyotisham-astro-pdf-form>
            <h3><?php echo esc_html__('Report Details', 'synilogic-jyotisham-astro'); ?></h3>

            <div class="jyotisham-astro-pdf-fields">
                <div class="jyotisham-astro-pdf-field">
                    <label for="jyotisham_astro_pdf_name"><?php echo esc_html__('Birth Name', 'synilogic-jyotisham-astro'); ?> <span class="required">*</span></label>
                    <input type="text" id="jyotisham_astro_pdf_name" name="jyotisham_astro_pdf_name" placeholder="Enter your name" required />
                </div>

                <div class="jyotisham-astro-pdf-field">
                    <label for="jyotisham_astro_pdf_date"><?php echo esc_html__('Birth Date', 'synilogic-jyotisham-astro'); ?> <span class="required">*</span></label>
                    <input type="date" id="jyotisham_astro_pdf_date" name="jyotisham_astro_pdf_date" required />
                </div>

                <div class="jyotisham-astro-pdf-field">
                    <label for="jyotisham_astro_pdf_time"><?php echo esc_html__('Birth Time', 'synilogic-jyotisham-astro'); ?> <span class="required">*</span></label>
                    <input type="time" id="jyotisham_astro_pdf_time" name="jyotisham_astro_pdf_time" required />
                </div>

                <div class="jyotisham-astro-pdf-field">
                    <label for="jyotisham_astro_pdf_place"><?php echo esc_html__('Birth Place', 'synilogic-jyotisham-astro'); ?> <span class="required">*</span></label>
                    <input type="text" id="jyotisham_astro_pdf_place" name="jyotisham_astro_pdf_place" autocomplete="off" placeholder="<?php echo esc_attr__('Search a place', 'synilogic-jyotisham-astro'); ?>" required />
                </div>

                <div class="jyotisham-astro-pdf-field">
                    <label for="jyotisham_astro_pdf_language"><?php echo esc_html__('Language', 'synilogic-jyotisham-astro'); ?> <span class="required">*</span></label>
                    <select id="jyotisham_astro_pdf_language" name="jyotisham_astro_pdf_language" required>
                        <option value="en"><?php echo esc_html__('English', 'synilogic-jyotisham-astro'); ?></option>
                        <option value="hi"><?php echo esc_html__('Hindi', 'synilogic-jyotisham-astro'); ?></option>
                    </select>
                </div>

                <div class="jyotisham-astro-pdf-field">
                    <label for="jyotisham_astro_pdf_style"><?php echo esc_html__('Chart Style', 'synilogic-jyotisham-astro'); ?> <span class="required">*</span></label>
                    <select id="jyotisham_astro_pdf_style" name="jyotisham_astro_pdf_style" required>
                        <option value="north"><?php echo esc_html__('North Indian', 'synilogic-jyotisham-astro'); ?></option>
                        <option value="south"><?php echo esc_html__('South Indian', 'synilogic-jyotisham-astro'); ?></option>
                        <option value="east"><?php echo esc_html__('East Indian', 'synilogic-jyotisham-astro'); ?></option>
                    </select>
                </div>
            </div>

            <input type="hidden" id="jyotisham_astro_pdf_latitude" name="jyotisham_astro_pdf_latitude" />
            <input type="hidden" id="jyotisham_astro_pdf_longitude" name="jyotisham_astro_pdf_longitude" />
            <input type="hidden" id="jyotisham_astro_pdf_timezone" name="jyotisham_astro_pdf_timezone" />
            <input type="hidden" id="jyotisham_astro_pdf_place_name" name="jyotisham_astro_pdf_place_name" />
            <input type="hidden" name="jyotisham_astro_pdf_nonce" value="<?php echo esc_attr(wp_create_nonce('jyotisham_astro_pdf_add_to_cart')); ?>" />
            <input type="hidden" name="jyotisham_astro_pdf_report_type" value="<?php echo esc_attr($report_type); ?>" />
            <input type="hidden" name="jyotisham_astro_pdf_report_slug" value="<?php echo esc_attr($report_slug); ?>" />

            <div class="jyotisham-astro-pdf-status" data-role="status"></div>
            <div class="jyotisham-astro-pdf-spinner" data-role="spinner" aria-hidden="true"></div>

            <?php if (empty($google_maps_key)): ?>
                <p class="woocommerce-info jyotisham-astro-pdf-warning">
                    <?php echo esc_html__('Google Maps API key is not configured. Place autocomplete will be unavailable until it is set.', 'synilogic-jyotisham-astro'); ?>
                </p>
            <?php endif; ?>
        </div>
        <?php
    }

    private function is_astro_pdf_product($product) {
        if (!$product) {
            return false;
        }

        $enabled = $product->get_meta('_jyotisham_astro_pdf_enabled', true);
        if ($enabled === 'yes') {
            return true;
        }

        if ($enabled === 'no') {
            return false;
        }

        $report_slug = $product->get_meta('_jyotisham_astro_pdf_report_slug', true);
        $report_type = $product->get_meta('_jyotisham_astro_pdf_report_type', true);

        return !empty($report_slug) || !empty($report_type);
    }
}
