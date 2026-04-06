<?php
/**
 * WooCommerce integration for Astro PDF report products.
 */

if (!defined('ABSPATH')) {
    exit;
}

class Jyotisham_Astro_PDF_WooCommerce {

    private $frontend;
    private $api;
    private $rendered_download_sections = array();
    private $download_styles_printed = false;

    public function __construct() {
        if (!class_exists('WooCommerce')) {
            return;
        }

        $this->frontend = new Jyotisham_Astro_PDF_Frontend();
        $this->api = new Jyotisham_Astro_PDF_API();

        add_filter('product_type_selector', array($this, 'add_product_type'));
        add_filter('woocommerce_product_class', array($this, 'map_product_class'), 10, 4);
        add_filter('woocommerce_product_data_tabs', array($this, 'add_product_data_tab'));
        add_action('woocommerce_product_data_panels', array($this, 'render_product_data_panels'));
        add_action('woocommerce_admin_process_product_object', array($this, 'save_product_fields'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_assets'));

        add_filter('woocommerce_add_to_cart_validation', array($this, 'validate_add_to_cart'), 10, 3);
        add_filter('woocommerce_add_cart_item_data', array($this, 'add_cart_item_data'), 10, 3);
        add_filter('woocommerce_get_item_data', array($this, 'display_cart_item_data'), 10, 2);
        add_action('woocommerce_checkout_process', array($this, 'validate_checkout_report_items'));
        add_action('woocommerce_checkout_create_order_line_item', array($this, 'save_order_item_meta'), 10, 4);
        add_action('woocommerce_payment_complete', array($this, 'generate_pdfs_for_order'));
        add_action('woocommerce_order_status_processing', array($this, 'generate_pdfs_for_order'));
        add_action('woocommerce_order_status_completed', array($this, 'generate_pdfs_for_order'));

        add_action('woocommerce_thankyou', array($this, 'maybe_show_generation_spinner'));
        add_action('woocommerce_thankyou', array($this, 'render_download_links'));
        add_action('woocommerce_order_details_after_order_table', array($this, 'render_download_links'));
        add_action('woocommerce_email_after_order_table', array($this, 'render_email_download_links'), 10, 4);
        add_filter('woocommerce_my_account_my_orders_actions', array($this, 'add_my_account_action'), 10, 2);
        add_action('woocommerce_order_item_meta_end', array($this, 'render_structured_order_item_details'), 10, 4);
        add_filter('woocommerce_order_item_get_formatted_meta_data', array($this, 'filter_order_item_meta_display'), 10, 2);
    }

    public function add_product_type($types) {
        $types['astro_pdf_report'] = __('Astro PDF Report', 'synilogic-jyotisham-astro');
        return $types;
    }

    public function map_product_class($classname, $product_type, $post_type, $product_id) {
        if ($product_type === 'astro_pdf_report' && class_exists('WC_Product_Simple')) {
            return 'WC_Product_Simple';
        }

        return $classname;
    }

    public function add_product_data_tab($tabs) {
        $tabs['jyotisham_astro_pdf'] = array(
            'label' => __('Astro PDF', 'synilogic-jyotisham-astro'),
            'target' => 'jyotisham-astro-pdf-product-data',
            'priority' => 25,
        );

        return $tabs;
    }

    public function render_product_data_panels() {
        global $post;

        $product_id = $post instanceof WP_Post ? (int) $post->ID : 0;
        $current_report_type = $product_id ? get_post_meta($product_id, '_jyotisham_astro_pdf_report_type', true) : '';
        $current_report_slug = $product_id ? get_post_meta($product_id, '_jyotisham_astro_pdf_report_slug', true) : '';
        ?>
        <div id="jyotisham-astro-pdf-product-data" class="panel woocommerce_options_panel">
            <div class="options_group">
                <p class="form-field">
                    <span class="description"><?php esc_html_e('Select a report type below to turn this product into a report product with required birth details on the storefront.', 'synilogic-jyotisham-astro'); ?></span>
                </p>

                <p class="form-field">
                    <label for="_jyotisham_astro_pdf_report_type"><?php esc_html_e('Report Type', 'synilogic-jyotisham-astro'); ?></label>
                    <select id="_jyotisham_astro_pdf_report_type" name="_jyotisham_astro_pdf_report_type">
                        <?php foreach ($this->get_report_types() as $value => $label) : ?>
                            <option value="<?php echo esc_attr($value); ?>" <?php selected($current_report_type, $value); ?>><?php echo esc_html($label); ?></option>
                        <?php endforeach; ?>
                    </select>
                </p>

                <p class="form-field">
                    <label for="_jyotisham_astro_pdf_report_slug"><?php esc_html_e('Report Slug', 'synilogic-jyotisham-astro'); ?></label>
                    <input type="text" class="short" id="_jyotisham_astro_pdf_report_slug" name="_jyotisham_astro_pdf_report_slug" value="<?php echo esc_attr($current_report_slug); ?>" placeholder="destiny_of_heart" />
                    <span class="description"><?php esc_html_e('This slug is appended to /api/pdf/{report_slug}. Leave blank to use the selected report type slug.', 'synilogic-jyotisham-astro'); ?></span>
                </p>
            </div>
        </div>
        <?php
    }

    public function save_product_fields($product) {
        if (!$product) {
            return;
        }

        $report_type = isset($_POST['_jyotisham_astro_pdf_report_type'])
            ? sanitize_key(wp_unslash($_POST['_jyotisham_astro_pdf_report_type']))
            : $product->get_meta('_jyotisham_astro_pdf_report_type', true);
        $report_slug = isset($_POST['_jyotisham_astro_pdf_report_slug'])
            ? sanitize_title(wp_unslash($_POST['_jyotisham_astro_pdf_report_slug']))
            : $product->get_meta('_jyotisham_astro_pdf_report_slug', true);

        if (empty($report_slug)) {
            $report_slug = $report_type;
        }

        $product->update_meta_data('_jyotisham_astro_pdf_report_type', $report_type);
        $product->update_meta_data('_jyotisham_astro_pdf_report_slug', $report_slug);
    }

    public function enqueue_admin_assets($hook) {
        if (!in_array($hook, array('post.php', 'post-new.php'), true)) {
            return;
        }

        $screen = function_exists('get_current_screen') ? get_current_screen() : null;
        if (!$screen || $screen->post_type !== 'product') {
            return;
        }

        wp_enqueue_script(
            'jyotisham-astro-pdf-admin-script',
            JYOTISHAM_ASTRO_API_PLUGIN_URL . 'assets/js/astro-pdf-admin.js',
            array('jquery'),
            JYOTISHAM_ASTRO_API_PLUGIN_VERSION,
            true
        );
    }

    public function validate_add_to_cart($passed, $product_id, $quantity) {
        $product = wc_get_product($product_id);

        if (!$this->is_astro_pdf_product($product)) {
            return $passed;
        }

        if (!$this->api->is_configured()) {
            wc_add_notice(__('API not configured. Please contact the administrator.', 'synilogic-jyotisham-astro'), 'error');
            return false;
        }

        $data = $this->get_request_data();

        if (empty($data['name']) || empty($data['date']) || empty($data['time']) || empty($data['place']) || empty($data['latitude']) || empty($data['longitude']) || empty($data['timezone']) || empty($data['lang']) || empty($data['style'])) {
            wc_add_notice(__('Please fill out the details before to buy the report.', 'synilogic-jyotisham-astro'), 'error');
            return false;
        }

        if (!isset($_POST['jyotisham_astro_pdf_nonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['jyotisham_astro_pdf_nonce'])), 'jyotisham_astro_pdf_add_to_cart')) {
            wc_add_notice(__('Security check failed. Please refresh the product page and try again.', 'synilogic-jyotisham-astro'), 'error');
            return false;
        }

        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $data['date']) && !preg_match('/^\d{2}\/\d{2}\/\d{4}$/', $data['date'])) {
            wc_add_notice(__('Please enter a valid date.', 'synilogic-jyotisham-astro'), 'error');
            return false;
        }

        if (!preg_match('/^\d{2}:\d{2}$/', $data['time'])) {
            wc_add_notice(__('Please enter a valid time.', 'synilogic-jyotisham-astro'), 'error');
            return false;
        }

        if (!is_numeric($data['latitude']) || (float) $data['latitude'] < -90 || (float) $data['latitude'] > 90) {
            wc_add_notice(__('Please select a valid latitude.', 'synilogic-jyotisham-astro'), 'error');
            return false;
        }

        if (!is_numeric($data['longitude']) || (float) $data['longitude'] < -180 || (float) $data['longitude'] > 180) {
            wc_add_notice(__('Please select a valid longitude.', 'synilogic-jyotisham-astro'), 'error');
            return false;
        }

        if (!is_numeric($data['timezone']) || (float) $data['timezone'] < -12 || (float) $data['timezone'] > 14) {
            wc_add_notice(__('Please select a valid timezone.', 'synilogic-jyotisham-astro'), 'error');
            return false;
        }

        $allowed_languages = array('en', 'hi');
        if (!in_array($data['lang'], $allowed_languages, true)) {
            wc_add_notice(__('Please select a valid language.', 'synilogic-jyotisham-astro'), 'error');
            return false;
        }

        $allowed_styles = array('north', 'south', 'east');
        if (!in_array($data['style'], $allowed_styles, true)) {
            wc_add_notice(__('Please select a valid chart style.', 'synilogic-jyotisham-astro'), 'error');
            return false;
        }

        return $passed;
    }

    public function add_cart_item_data($cart_item_data, $product_id, $variation_id) {
        $product = wc_get_product($product_id);

        if (!$this->is_astro_pdf_product($product)) {
            return $cart_item_data;
        }

        $data = $this->get_request_data();

        $cart_item_data['jyotisham_astro_pdf'] = array(
            'name' => $data['name'],
            'date' => $data['date'],
            'time' => $data['time'],
            'place' => $data['place'],
            'latitude' => $data['latitude'],
            'longitude' => $data['longitude'],
            'timezone' => $data['timezone'],
            'lang' => $data['lang'],
            'style' => $data['style'],
            'report_type' => $data['report_type'],
            'report_slug' => $this->resolve_report_slug($product, $data['report_slug']),
        );

        $cart_item_data['jyotisham_astro_pdf_unique'] = md5(wp_json_encode($cart_item_data['jyotisham_astro_pdf']) . microtime(true));

        return $cart_item_data;
    }

    public function display_cart_item_data($item_data, $cart_item) {
        if (empty($cart_item['jyotisham_astro_pdf'])) {
            return $item_data;
        }

        $data = $cart_item['jyotisham_astro_pdf'];
        $item_data[] = array('key' => __('Name', 'synilogic-jyotisham-astro'), 'value' => esc_html($data['name']));
        $item_data[] = array('key' => __('Date', 'synilogic-jyotisham-astro'), 'value' => esc_html($data['date']));
        $item_data[] = array('key' => __('Time', 'synilogic-jyotisham-astro'), 'value' => esc_html($data['time']));
        $item_data[] = array('key' => __('Place', 'synilogic-jyotisham-astro'), 'value' => esc_html($data['place']));
        $item_data[] = array('key' => __('Language', 'synilogic-jyotisham-astro'), 'value' => esc_html(isset($data['lang']) ? $data['lang'] : 'en'));
        $item_data[] = array('key' => __('Chart Style', 'synilogic-jyotisham-astro'), 'value' => esc_html(isset($data['style']) ? $data['style'] : 'north'));

        return $item_data;
    }

    public function validate_checkout_report_items() {
        if (!WC()->cart) {
            return;
        }

        foreach (WC()->cart->get_cart() as $cart_item) {
            if (empty($cart_item['jyotisham_astro_pdf'])) {
                continue;
            }

            $data = $cart_item['jyotisham_astro_pdf'];

            if (empty($data['name']) || empty($data['date']) || empty($data['time']) || empty($data['place']) || empty($data['latitude']) || empty($data['longitude']) || empty($data['timezone']) || empty($data['lang']) || empty($data['style'])) {
                wc_add_notice(__('Please fill in all report details before placing your order.', 'synilogic-jyotisham-astro'), 'error');
                break;
            }
        }
    }

    public function save_order_item_meta($item, $cart_item_key, $values, $order) {
        if (empty($values['jyotisham_astro_pdf'])) {
            return;
        }

        $data = $values['jyotisham_astro_pdf'];

        $item->add_meta_data('_jyotisham_astro_pdf', $data, true);
        $item->add_meta_data('_jyotisham_astro_pdf_report_type', $data['report_type'], true);
    }

    public function generate_pdfs_for_order($order_id) {
        $order = wc_get_order($order_id);

        if (!$order) {
            return;
        }

        $updated_reports = array();
        $order_changed = false;
        $processed_items = 0;

        foreach ($order->get_items() as $item_id => $item) {
            $stored_data = $item->get_meta('_jyotisham_astro_pdf', true);
            if (empty($stored_data) || !is_array($stored_data)) {
                continue;
            }

            $processed_items++;

            $existing_download_url = $item->get_meta('_jyotisham_astro_pdf_download_url', true);
            if (!empty($existing_download_url)) {
                $item->delete_meta_data('_jyotisham_astro_pdf_error');
                $item->save();
                $updated_reports[] = array(
                    'item_id' => $item_id,
                    'download_url' => $existing_download_url,
                    'report_slug' => $stored_data['report_slug'],
                    'name' => $stored_data['name'],
                );
                continue;
            }

            $payload = $this->build_pdf_payload($order, $stored_data, $item);
            $result = $this->api->generate_pdf_report($stored_data['report_slug'], $payload);

            if (is_wp_error($result)) {
                $item->add_meta_data('_jyotisham_astro_pdf_error', $result->get_error_message(), true);
                $item->save();
                $order->add_order_note(sprintf(
                    __('Astro PDF report generation failed: %s', 'synilogic-jyotisham-astro'),
                    $result->get_error_message()
                ));
                continue;
            }

            $download_url = isset($result['downloadUrl']) ? esc_url_raw($result['downloadUrl']) : '';
            if (empty($download_url)) {
                continue;
            }

            $item->add_meta_data('_jyotisham_astro_pdf_download_url', $download_url, true);
            $item->add_meta_data('_jyotisham_astro_pdf_response', wp_json_encode($result['response']), true);
            $item->delete_meta_data('_jyotisham_astro_pdf_error');
            $item->save();

            $updated_reports[] = array(
                'item_id' => $item_id,
                'download_url' => $download_url,
                'report_slug' => $stored_data['report_slug'],
                'name' => $stored_data['name'],
            );
            $order_changed = true;
        }

        if ($processed_items > 0 && ($order_changed || !empty($updated_reports))) {
            $order->update_meta_data('_jyotisham_astro_pdf_reports', $updated_reports);
            $order->save();
        }
    }

    public function render_download_links($order_id) {
        $order = is_a($order_id, 'WC_Order') ? $order_id : wc_get_order($order_id);
        if (!$order) {
            return;
        }

        $order_key = (int) $order->get_id();
        if (isset($this->rendered_download_sections[$order_key])) {
            return;
        }

        // Fallback: try generation when order is viewed and links are still missing.
        if ($this->order_has_pdf_items($order) && !$this->order_has_download_url($order)) {
            $this->generate_pdfs_for_order($order->get_id());
            $order = wc_get_order($order->get_id());
        }

        $reports = $this->get_order_reports($order);
        if (empty($reports)) {
            $errors = $this->get_order_report_errors($order);
            if (!empty($errors)) {
                $this->rendered_download_sections[$order_key] = true;
                echo '<section class="jyotisham-astro-pdf-downloads">';
                echo '<h2>' . esc_html__('Your report is ready', 'synilogic-jyotisham-astro') . '</h2>';
                foreach ($errors as $error) {
                    echo '<p class="woocommerce-error">' . esc_html($error) . '</p>';
                }
                echo '</section>';
            }
            return;
        }

        $download_reports = array_values(array_filter($reports, static function ($report) {
            return !empty($report['download_url']);
        }));

        if (empty($download_reports)) {
            return;
        }

        $this->rendered_download_sections[$order_key] = true;
        $this->print_download_styles_once();

        $first_report = $download_reports[0];
        $report_name = $this->format_report_name(isset($first_report['report_slug']) ? $first_report['report_slug'] : '');

        echo '<section class="jyotisham-astro-pdf-downloads">';
        if (count($download_reports) === 1 && !empty($report_name)) {
            echo '<h2>' . esc_html(sprintf(__('Your report is ready (%s)', 'synilogic-jyotisham-astro'), $report_name)) . '</h2>';
        } else {
            echo '<h2>' . esc_html__('Your reports are ready', 'synilogic-jyotisham-astro') . '</h2>';
        }

        foreach ($download_reports as $report) {
            echo '<p><a class="button jyotisham-astro-pdf-download-button" href="' . esc_url($report['download_url']) . '" target="_blank" rel="noopener noreferrer">';
            echo esc_html__('Download PDF', 'synilogic-jyotisham-astro');
            echo '</a></p>';
        }

        echo '</section>';
    }

    public function render_email_download_links($order, $sent_to_admin, $plain_text, $email) {
        if ($plain_text) {
            return;
        }

        $reports = $this->get_order_reports($order);
        if (empty($reports)) {
            return;
        }

        $download_reports = array_values(array_filter($reports, static function ($report) {
            return !empty($report['download_url']);
        }));

        if (empty($download_reports)) {
            return;
        }

        echo '<h2>' . esc_html__('Your report is ready', 'synilogic-jyotisham-astro') . '</h2>';
        foreach ($download_reports as $report) {
            echo '<p><a href="' . esc_url($report['download_url']) . '" target="_blank" rel="noopener noreferrer">' . esc_html__('Download PDF', 'synilogic-jyotisham-astro') . '</a></p>';
        }
    }

    public function render_structured_order_item_details($item_id, $item, $order, $plain_text) {
        if (!$item || empty($item->get_meta('_jyotisham_astro_pdf', true))) {
            return;
        }

        $data = $item->get_meta('_jyotisham_astro_pdf', true);
        if (!is_array($data)) {
            return;
        }

        $rows = array(
            __('Birth Name', 'synilogic-jyotisham-astro') => isset($data['name']) ? $data['name'] : '',
            __('Birth Date', 'synilogic-jyotisham-astro') => isset($data['date']) ? $data['date'] : '',
            __('Birth Time', 'synilogic-jyotisham-astro') => isset($data['time']) ? $data['time'] : '',
            __('Birth Place', 'synilogic-jyotisham-astro') => isset($data['place']) ? $data['place'] : '',
            __('Language', 'synilogic-jyotisham-astro') => $this->format_language(isset($data['lang']) ? $data['lang'] : 'en'),
            __('Chart Style', 'synilogic-jyotisham-astro') => $this->format_chart_style(isset($data['style']) ? $data['style'] : 'north'),
        );

        echo '<div class="jyotisham-astro-pdf-item-details">';
        echo '<strong>' . esc_html__('Report Details', 'synilogic-jyotisham-astro') . '</strong>';
        echo '<ul class="jyotisham-astro-pdf-item-grid">';

        foreach ($rows as $label => $value) {
            if ($value === '') {
                continue;
            }

            echo '<li class="jyotisham-astro-pdf-item-row">';
            echo '<span class="jyotisham-astro-pdf-item-label">' . esc_html($label) . '</span>';
            echo '<span class="jyotisham-astro-pdf-item-value">' . esc_html($value) . '</span>';
            echo '</li>';
        }

        echo '</ul>';
        echo '</div>';
    }

    public function filter_order_item_meta_display($formatted_meta, $item) {
        if (empty($item->get_meta('_jyotisham_astro_pdf', true))) {
            return $formatted_meta;
        }

        $hidden_keys = array(
            'Astro PDF Report',
            'Birth Name',
            'Birth Date',
            'Birth Time',
            'Birth Place',
            'Latitude',
            'Longitude',
            'Timezone',
            'Language',
            'Chart Style',
        );

        foreach ($formatted_meta as $meta_id => $meta) {
            if (in_array($meta->display_key, $hidden_keys, true)) {
                unset($formatted_meta[$meta_id]);
            }
        }

        return $formatted_meta;
    }

    public function add_my_account_action($actions, $order) {
        $reports = $this->get_order_reports($order);
        if (empty($reports)) {
            return $actions;
        }

        $first_report = reset($reports);
        if (!empty($first_report['download_url'])) {
            $actions['jyotisham_astro_pdf_download'] = array(
                'url' => $first_report['download_url'],
                'name' => __('Download PDF', 'synilogic-jyotisham-astro'),
            );
        }

        return $actions;
    }

    public function maybe_show_generation_spinner($order_id) {
        $order = wc_get_order($order_id);
        if (!$order) {
            return;
        }

        $has_pdf_items = $this->order_has_pdf_items($order);

        if (!$has_pdf_items) {
            return;
        }

        $reports = $this->get_order_reports($order);
        $has_download_url = false;
        foreach ($reports as $report) {
            if (!empty($report['download_url'])) {
                $has_download_url = true;
                break;
            }
        }

        if ($has_download_url) {
            return;
        }

        echo '<div class="woocommerce-info jyotisham-astro-pdf-loading">';
        echo '<span class="jyotisham-astro-pdf-loading-spinner"></span>';
        echo esc_html__('Generating your PDF report. Please wait a moment.', 'synilogic-jyotisham-astro');
        echo '</div>';
    }

    private function get_report_types() {
        return array(
            'vedic_five_year_predictions' => __('Vedic Five Year Predictions', 'synilogic-jyotisham-astro'),
            'vedic_ten_year_predictions' => __('Vedic Ten Year Predictions', 'synilogic-jyotisham-astro'),
            'vedic_fifteen_year_predictions' => __('Vedic Fifteen Year Predictions', 'synilogic-jyotisham-astro'),
            'destiny_of_heart' => __('Destiny Of Heart', 'synilogic-jyotisham-astro'),
            'numero_three_year_predictions' => __('Numero Three Year Predictions', 'synilogic-jyotisham-astro'),
            'numero_five_year_predictions' => __('Numero Five Year Predictions', 'synilogic-jyotisham-astro'),
            'numero_nine_year_predictions' => __('Numero Nine Year Predictions', 'synilogic-jyotisham-astro'),
            'life_purpose_report' => __('Life Purpose Report', 'synilogic-jyotisham-astro'),
            'career_success' => __('Career Success', 'synilogic-jyotisham-astro'),
            'foreign_travel_report' => __('Foreign Travel Report', 'synilogic-jyotisham-astro'),
            'government_job_report' => __('Government Job Report', 'synilogic-jyotisham-astro'),
            'financial_opportunities_and_challenges_report' => __('Financial Opportunities And Challenges Report', 'synilogic-jyotisham-astro'),
            'education_and_learning_pathways_report' => __('Education And Learning Pathways Report', 'synilogic-jyotisham-astro'),
            'kundali_samyak' => __('Kundali Samyak', 'synilogic-jyotisham-astro'),
            'kundali_dirghadrishti' => __('Kundali DirghaDrishti', 'synilogic-jyotisham-astro'),
            'kundali_moolpatrika' => __('Kundali MoolPatrika', 'synilogic-jyotisham-astro'),
            'motherhood_by_numbers' => __('Motherhood By Numbers', 'synilogic-jyotisham-astro'),
            'startup_success' => __('Startup Success', 'synilogic-jyotisham-astro'),
            'decision_year_report_2026' => __('Decision Year Report 2026', 'synilogic-jyotisham-astro'),
            'master_combo_report_2026' => __('Master Combo Report 2026', 'synilogic-jyotisham-astro'),
            'wellness_guide' => __('Wellness Guide', 'synilogic-jyotisham-astro'),
            'life_direction_report_2026' => __('Life Direction Report 2026', 'synilogic-jyotisham-astro'),
            'personal_empowerment_report' => __('Personal Empowerment Report', 'synilogic-jyotisham-astro'),
            'radiant_health' => __('Radiant Health', 'synilogic-jyotisham-astro'),
            'custom' => __('Custom', 'synilogic-jyotisham-astro'),
        );
    }

    private function get_request_data() {
        return array(
            'name' => isset($_POST['jyotisham_astro_pdf_name']) ? sanitize_text_field(wp_unslash($_POST['jyotisham_astro_pdf_name'])) : '',
            'date' => isset($_POST['jyotisham_astro_pdf_date']) ? sanitize_text_field(wp_unslash($_POST['jyotisham_astro_pdf_date'])) : '',
            'time' => isset($_POST['jyotisham_astro_pdf_time']) ? sanitize_text_field(wp_unslash($_POST['jyotisham_astro_pdf_time'])) : '',
            'place' => isset($_POST['jyotisham_astro_pdf_place']) ? sanitize_text_field(wp_unslash($_POST['jyotisham_astro_pdf_place'])) : '',
            'latitude' => isset($_POST['jyotisham_astro_pdf_latitude']) ? sanitize_text_field(wp_unslash($_POST['jyotisham_astro_pdf_latitude'])) : '',
            'longitude' => isset($_POST['jyotisham_astro_pdf_longitude']) ? sanitize_text_field(wp_unslash($_POST['jyotisham_astro_pdf_longitude'])) : '',
            'timezone' => isset($_POST['jyotisham_astro_pdf_timezone']) ? sanitize_text_field(wp_unslash($_POST['jyotisham_astro_pdf_timezone'])) : '',
            'lang' => isset($_POST['jyotisham_astro_pdf_language']) ? sanitize_key(wp_unslash($_POST['jyotisham_astro_pdf_language'])) : 'en',
            'style' => isset($_POST['jyotisham_astro_pdf_style']) ? sanitize_key(wp_unslash($_POST['jyotisham_astro_pdf_style'])) : 'north',
            'report_type' => isset($_POST['jyotisham_astro_pdf_report_type']) ? sanitize_key(wp_unslash($_POST['jyotisham_astro_pdf_report_type'])) : '',
            'report_slug' => isset($_POST['jyotisham_astro_pdf_report_slug']) ? sanitize_title(wp_unslash($_POST['jyotisham_astro_pdf_report_slug'])) : '',
        );
    }

    private function resolve_report_slug($product, $report_slug) {
        if (!empty($report_slug)) {
            return sanitize_title($report_slug);
        }

        $stored_slug = $product->get_meta('_jyotisham_astro_pdf_report_slug', true);
        if (!empty($stored_slug)) {
            return sanitize_title($stored_slug);
        }

        $stored_type = $product->get_meta('_jyotisham_astro_pdf_report_type', true);
        return sanitize_title($stored_type);
    }

    private function is_astro_pdf_product($product) {
        if (!$product) {
            return false;
        }

        $report_type = $product->get_meta('_jyotisham_astro_pdf_report_type', true);
        $report_slug = $product->get_meta('_jyotisham_astro_pdf_report_slug', true);

        return !empty($report_type) || !empty($report_slug);
    }

    private function build_pdf_payload($order, array $stored_data, $item) {
        $company_data = $this->api->get_company_payload();

        $extra_data = array(
            'order_id' => $order->get_id(),
            'order_number' => $order->get_order_number(),
            'report_slug' => $stored_data['report_slug'],
            'report_type' => !empty($stored_data['report_type']) ? $stored_data['report_type'] : $item->get_meta('_jyotisham_astro_pdf_report_type', true),
            'lang' => isset($stored_data['lang']) ? $stored_data['lang'] : 'en',
            'style' => isset($stored_data['style']) ? $stored_data['style'] : 'north',
            'watermark' => $this->api->get_watermark_text(),
        );

        return $this->api->build_request_payload($stored_data, $company_data, $extra_data);
    }

    private function get_order_reports($order) {
        $reports = $order->get_meta('_jyotisham_astro_pdf_reports', true);

        if (!empty($reports) && is_array($reports)) {
            return $reports;
        }

        $fallback_reports = array();

        foreach ($order->get_items() as $item_id => $item) {
            $download_url = $item->get_meta('_jyotisham_astro_pdf_download_url', true);
            $stored_data = $item->get_meta('_jyotisham_astro_pdf', true);

            if (empty($stored_data) || !is_array($stored_data)) {
                continue;
            }

            $fallback_reports[] = array(
                'item_id' => $item_id,
                'download_url' => $download_url,
                'report_slug' => $stored_data['report_slug'],
                'name' => $stored_data['name'],
            );
        }

        return $fallback_reports;
    }

    private function order_has_pdf_items($order) {
        foreach ($order->get_items() as $item) {
            if (!empty($item->get_meta('_jyotisham_astro_pdf', true))) {
                return true;
            }
        }

        return false;
    }

    private function order_has_download_url($order) {
        $reports = $this->get_order_reports($order);

        foreach ($reports as $report) {
            if (!empty($report['download_url'])) {
                return true;
            }
        }

        return false;
    }

    private function get_order_report_errors($order) {
        $errors = array();

        foreach ($order->get_items() as $item) {
            if (empty($item->get_meta('_jyotisham_astro_pdf', true))) {
                continue;
            }

            $error = $item->get_meta('_jyotisham_astro_pdf_error', true);
            if (!empty($error)) {
                $errors[] = $error;
            }
        }

        return array_values(array_unique($errors));
    }

    private function print_download_styles_once() {
        if ($this->download_styles_printed) {
            return;
        }

        $this->download_styles_printed = true;

        echo '<style>';
        echo '.jyotisham-astro-pdf-downloads{margin:24px 0;padding:22px;border:1px solid #e7e7e7;border-radius:14px;background:linear-gradient(145deg,#ffffff,#f7fafc)}';
        echo '.jyotisham-astro-pdf-downloads h2{margin:0 0 14px;font-size:28px;line-height:1.2;color:#111827}';
        echo '.jyotisham-astro-pdf-download-button{display:inline-block;padding:12px 24px;border-radius:999px;background:#0f172a;color:#fff !important;font-weight:600;letter-spacing:.02em;border:0;box-shadow:0 10px 24px rgba(15,23,42,.2);text-decoration:none !important;transition:none}';
        echo '.jyotisham-astro-pdf-download-button:hover,.jyotisham-astro-pdf-download-button:focus{color:#fff !important;text-decoration:none !important;transform:none;box-shadow:0 10px 24px rgba(15,23,42,.2)}';
        echo '.jyotisham-astro-pdf-item-details{margin-top:8px;padding:10px 12px;border:1px solid #ececec;border-radius:10px;background:#fcfcfc}';
        echo '.jyotisham-astro-pdf-item-details strong{display:block;margin-bottom:8px;font-size:16px}';
        echo '.jyotisham-astro-pdf-item-grid{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px 12px}';
        echo '.jyotisham-astro-pdf-item-row{display:flex;flex-direction:column;padding:8px 10px;border:1px solid #ededed;border-radius:8px;background:#fff}';
        echo '.jyotisham-astro-pdf-item-label{font-size:12px;font-weight:600;color:#6b7280;line-height:1.2;margin-bottom:4px}';
        echo '.jyotisham-astro-pdf-item-value{font-size:14px;color:#111827;line-height:1.25}';
        echo '@media (max-width:768px){.jyotisham-astro-pdf-downloads h2{font-size:22px}.jyotisham-astro-pdf-item-grid{grid-template-columns:1fr}}';
        echo '</style>';
    }

    private function format_report_name($slug) {
        if (empty($slug)) {
            return '';
        }

        $report_types = $this->get_report_types();
        if (isset($report_types[$slug])) {
            return wp_strip_all_tags($report_types[$slug]);
        }

        return ucwords(str_replace('_', ' ', sanitize_text_field((string) $slug)));
    }

    private function format_language($lang) {
        $map = array(
            'en' => __('English', 'synilogic-jyotisham-astro'),
            'hi' => __('Hindi', 'synilogic-jyotisham-astro'),
        );

        return isset($map[$lang]) ? $map[$lang] : strtoupper((string) $lang);
    }

    private function format_chart_style($style) {
        $map = array(
            'north' => __('North Indian', 'synilogic-jyotisham-astro'),
            'south' => __('South Indian', 'synilogic-jyotisham-astro'),
            'east' => __('East Indian', 'synilogic-jyotisham-astro'),
        );

        return isset($map[$style]) ? $map[$style] : ucwords((string) $style);
    }
}
