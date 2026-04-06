<?php
/**
 * Admin settings for WooCommerce Astro PDF reports.
 */

if (!defined('ABSPATH')) {
    exit;
}

class Jyotisham_Astro_PDF_Admin {

    const MENU_SLUG = 'jyotisham-astro-pdf-report';

    public function __construct() {
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'register_settings'));
    }

    public function add_admin_menu() {
        add_submenu_page(
            'jyotisham-astro-api',
            'Astro PDF Reports',
            'Astro PDF Reports',
            'manage_options',
            self::MENU_SLUG,
            array($this, 'render_settings_page')
        );
    }

    public function register_settings() {
        $settings = array(
            'jyotisham_pdf_company_name' => array('sanitize_text_field', ''),
            'jyotisham_pdf_company_address' => array('sanitize_textarea_field', ''),
            'jyotisham_pdf_company_email' => array('sanitize_email', ''),
            'jyotisham_pdf_company_phone' => array('sanitize_text_field', ''),
            'jyotisham_pdf_company_website' => array('esc_url_raw', ''),
            'jyotisham_pdf_watermark_enabled' => array(array($this, 'sanitize_checkbox'), '0'),
            'jyotisham_pdf_watermark_text' => array('sanitize_text_field', ''),
        );

        foreach ($settings as $option => $config) {
            register_setting('jyotisham_pdf_settings', $option, array(
                'type' => 'string',
                'sanitize_callback' => $config[0],
                'default' => $config[1],
            ));
        }

        add_settings_section(
            'jyotisham_pdf_company_section',
            'Company Details',
            '__return_false',
            'jyotisham_pdf_settings'
        );

        $this->add_field('jyotisham_pdf_company_name', 'Company Name', 'jyotisham_pdf_company_section', array($this, 'render_text_field'));
        $this->add_field('jyotisham_pdf_company_address', 'Company Address', 'jyotisham_pdf_company_section', array($this, 'render_textarea_field'));
        $this->add_field('jyotisham_pdf_company_email', 'Company Email', 'jyotisham_pdf_company_section', array($this, 'render_text_field'));
        $this->add_field('jyotisham_pdf_company_phone', 'Company Phone', 'jyotisham_pdf_company_section', array($this, 'render_text_field'));
        $this->add_field('jyotisham_pdf_company_website', 'Company Website', 'jyotisham_pdf_company_section', array($this, 'render_text_field'));

    }

    private function add_field($id, $label, $section, $callback) {
        add_settings_field(
            $id,
            $label,
            $callback,
            'jyotisham_pdf_settings',
            $section,
            array('option_name' => $id)
        );
    }

    public function sanitize_checkbox($value) {
        return !empty($value) ? '1' : '0';
    }

    public function render_settings_page() {
        if (!current_user_can('manage_options')) {
            return;
        }
        ?>
        <div class="wrap">
            <h1>Astro PDF Reports</h1>
            <form method="post" action="options.php">
                <?php settings_fields('jyotisham_pdf_settings'); ?>
                <?php do_settings_sections('jyotisham_pdf_settings'); ?>
                <?php submit_button('Save Settings'); ?>
            </form>
        </div>
        <?php
    }

    public function render_text_field($args) {
        $option_name = $args['option_name'];
        $value = get_option($option_name, '');
        printf(
            '<input type="text" class="regular-text" id="%1$s" name="%1$s" value="%2$s" />',
            esc_attr($option_name),
            esc_attr($value)
        );
    }

    public function render_password_field($args) {
        $option_name = $args['option_name'];
        $value = get_option($option_name, '');
        printf(
            '<input type="password" class="regular-text" id="%1$s" name="%1$s" value="%2$s" autocomplete="off" />',
            esc_attr($option_name),
            esc_attr($value)
        );
    }

    public function render_textarea_field($args) {
        $option_name = $args['option_name'];
        $value = get_option($option_name, '');
        printf(
            '<textarea class="large-text" rows="4" id="%1$s" name="%1$s">%2$s</textarea>',
            esc_attr($option_name),
            esc_textarea($value)
        );
    }

    public function render_checkbox_field($args) {
        $option_name = $args['option_name'];
        $value = get_option($option_name, '0');
        printf(
            '<label><input type="checkbox" id="%1$s" name="%1$s" value="1" %2$s /> Enable watermark on generated PDFs</label>',
            esc_attr($option_name),
            checked($value, '1', false)
        );
    }

}
