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
            '',
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

        $company_name = get_option('jyotisham_pdf_company_name', '');
        $company_email = get_option('jyotisham_pdf_company_email', '');
        $company_phone = get_option('jyotisham_pdf_company_phone', '');
        $company_website = get_option('jyotisham_pdf_company_website', '');
        $watermark_enabled = get_option('jyotisham_pdf_watermark_enabled', '0');
        $astro_pdf_option_enabled = get_option('jyotisham_enable_astro_pdf', '1') === '1';
        $woocommerce_installed = class_exists('WooCommerce');
        $astro_pdf_enabled = $astro_pdf_option_enabled && $woocommerce_installed;
        ?>
        <div class="wrap">
            <h1>Astro PDF Reports</h1>

            <div class="jyotisham-admin-container">
                <div class="jyotisham-admin-main">
                    <form method="post" action="options.php">
                        <?php settings_fields('jyotisham_pdf_settings'); ?>

                        <div class="jyotisham-settings-card">
                            <h2>Company Details</h2>
                            <table class="form-table">
                                <?php do_settings_fields('jyotisham_pdf_settings', 'jyotisham_pdf_company_section'); ?>
                            </table>

                            <table class="form-table">
                                <tr>
                                    <th scope="row">
                                        <label for="jyotisham_pdf_watermark_enabled">Enable Watermark</label>
                                    </th>
                                    <td>
                                        <label>
                                            <input type="checkbox"
                                                   id="jyotisham_pdf_watermark_enabled"
                                                   name="jyotisham_pdf_watermark_enabled"
                                                   value="1"
                                                   <?php checked($watermark_enabled, '1'); ?> />
                                            Show watermark on generated PDFs
                                        </label>
                                    </td>
                                </tr>
                            </table>

                            <p class="jyotisham-watermark-callout">
                                *Add your logo and watermark on :-
                                <a href="https://jyotishamastroapi.com" target="_blank" rel="noopener noreferrer"><strong>jyotishamastroapi.com</strong></a>
                            </p>

                            <div class="jyotisham-actions">
                                <?php submit_button('Save Settings', 'button button-primary', 'submit', false); ?>
                            </div>
                        </div>
                    </form>
                </div>

                <div class="jyotisham-admin-sidebar">
                    <div class="jyotisham-info-card">
                        <h3>PDF Profile Summary</h3>
                        <p>
                            <strong>Astro PDF Report:</strong>
                            <span class="jyotisham-status-badge <?php echo $astro_pdf_enabled ? 'jyotisham-status-connected' : 'jyotisham-status-disconnected'; ?>">
                                <?php echo $astro_pdf_enabled ? 'Enabled' : 'Disabled'; ?>
                            </span>
                        </p>
                        <?php if (!$woocommerce_installed) : ?>
                            <p><em>WooCommerce not installed.</em></p>
                        <?php endif; ?>
                        <p><strong>Company:</strong> <?php echo esc_html(!empty($company_name) ? $company_name : 'Not set'); ?></p>
                        <p><strong>Email:</strong> <?php echo esc_html(!empty($company_email) ? $company_email : 'Not set'); ?></p>
                        <p><strong>Phone:</strong> <?php echo esc_html(!empty($company_phone) ? $company_phone : 'Not set'); ?></p>
                        <p><strong>Website:</strong> <?php echo esc_html(!empty($company_website) ? $company_website : 'Not set'); ?></p>
                        <p><strong>Watermark:</strong> <?php echo esc_html($watermark_enabled === '1' ? 'Enabled' : 'Disabled'); ?></p>
                    </div>

                    <div class="jyotisham-info-card">
                        <h3>How It Works</h3>
                        <ol>
                            <li>Add company details on this page.</li>
                            <li>Save settings to apply them to generated reports.</li>
                            <li>Create WooCommerce products with Astro PDF Report enabled.</li>
                            <li>Customer reports will use this company profile data.</li>
                        </ol>
                    </div>
                </div>
            </div>
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
