=== Astro API By Synilogic ===
Tags: astrology, horoscope, kundli, panchang, numerology, reports
Requires at least: 5.0
Tested up to: 6.9
Requires PHP: 7.4
Stable tag: 1.0.5
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Astro API By Synilogic connects your site to JyotishamAstro to deliver Kundli, Matching, Panchang and Numerology via shortcodes, plus paid WooCommerce Astro PDF Reports.

== Description ==
Build rich astrological experiences with configurable forms, multilingual outputs, and Google Maps-based place lookup and timezone detection. The plugin is free; the Synilogic Astro API is a paid service. Get API access and plan details at https://www.jyotishamastroapi.com/.

Plugin slug: `synilogic-jyotisham-astro`

= Highlights =
- Kundli & charts: North/South/East Indian layouts plus divisional charts
- Panchang, Choghadiya, Numerology, Hora Muhurta experiences
- Matching: Ashtakoot, Dashakoot, aggregate scoring
- Multilingual output (en, hi, ta, te, ka, ml, be, gr, mr)
- Google Maps autocomplete with timezone detection
- WooCommerce Astro PDF report products with paid-order generation workflow
- Matching PDF flow with separate boy and girl details
- Kundali PDF size support (Small/Medium/Large)
- Automatic customer email with report download links after generation

= Shortcodes =
- `[jyotisham_kundli]` — Full Kundli generator 
- `[jyotisham_matching]` — Kundli matching / compatibility
- `[jyotisham_panchang]` — Daily Panchang
- `[jyotisham_choghadiya]` — Choghadiya timings
- `[jyotisham_numerology]` — Numerology insights
- `[jyotisham_hora]` — Hora Muhurta
- `[jyotisham_horoscope]` — Daily, weekly, monthly, and yearly horoscope
- `[jyotisham_sadesati]` — Sade Sati status, timeline, and remedies

= WooCommerce Astro PDF Report Integration =
Use this if you want to sell report PDFs as WooCommerce products.

1. Install and activate WooCommerce.
2. Go to **JyotishamAstro API** and configure:
	- API key (required)
	- Google Maps key (recommended for place autocomplete and timezone detection)
3. In **JyotishamAstro API > Astro PDF Reports**, configure company details and watermark behavior (optional).
4. Add a WooCommerce product and enable **Enable Astro PDF Report** in product data.
5. Select report type/slug for that product:
	- Standard reports: calls `/api/pdf/{report_slug}`
	- Kundali Small/Medium/Large: calls `/api/pdf/generate` with `pdf_type`
	- Matching report: calls `/api/pdf/generate_matching`
6. Publish product and test on frontend:
	- Standard reports require birth details
	- Matching report requires separate boy/girl details
7. Checkout rules:
	- COD is blocked for report products
	- PDFs are generated only after successful payment
8. Delivery:
	- Download links are shown in order view
	- Customer email is sent automatically when report is ready

= Screenshots =
1. Plugin settings page
1. All shortcodes list
3. Kundli Shortcode
4. Matching Shortcode


= Privacy & Security =
- API keys are stored server-side; calls are made from your server.
- Nonce validation on AJAX endpoints; input sanitization and validation.
- Data sent: birth details and options required to generate charts/results
- Review Synilogic policies for data handling: https://synilogic.in/privacy-policy and https://synilogic.in/terms

Ownership: Developed and maintained by Synilogic.

== Installation ==
1. Upload the `synilogic-jyotisham-astro` folder to `/wp-content/plugins/`.
2. Activate via the WordPress Plugins screen.
3. Go to **Astro API By Synilogic** in wp-admin, add your JyotishamAstro API key (and Google Maps key for autocomplete/timezone), then save.
4. Add the desired shortcode to a page or post and publish.
5. Optional (for selling PDFs): install WooCommerce, create report products, and enable Astro PDF settings per product.

== Frequently Asked Questions ==
= Do I need an API key? =
Yes. Get it from https://www.jyotishamastroapi.com/. Without a valid key the shortcodes will show a configuration message.

= How do I embed the forms? =
Create or edit a page and add `[jyotisham_kundli]` (or any shortcode above).

= How do I integrate report PDFs with WooCommerce? =
Install WooCommerce, configure API settings, create/edit a product, enable **Enable Astro PDF Report**, choose report type/slug, and publish. Customers submit details on product page, complete online payment, then receive download links in order and email.

= Why is Cash on Delivery not available for report products? =
COD is intentionally blocked for Astro PDF products so reports are generated only for paid orders.

= When are PDFs generated? =
Reports are generated after payment is successful. If an order is unpaid, report generation does not run.

= I'm seeing "invalid request" or empty results. =
Confirm your JyotishamAstro API key is active and has credits, verify your Google Maps key (if using autocomplete), and ensure your server can make outbound HTTPS requests. Enable WP_DEBUG for details.

= How much does this cost? =
The plugin is free. API usage is billed per your JyotishamAstro API plan. See pricing and limits at https://www.jyotishamastroapi.com/

= Which languages are supported? =
English, Hindi, Tamil, Telugu, Kannada, Malayalam, Bengali, Gujarati, and Marathi (as supported by the JyotishamAstro API).

= Which languages are available for Astro PDF report products? =
English and Hindi.

== Changelog ==
= 1.0.5 =
* Added/expanded WooCommerce Astro PDF report flow and documentation.
* Added matching PDF support with separate boy/girl details end-to-end.
* Added Kundali Small/Medium/Large PDF support through generate endpoint with pdf_type.
* Enforced paid-only report generation and blocked COD for report products.
* Improved frontend report forms, place autocomplete, timezone handling, and validations.
* Added report-ready customer email delivery and order download UX improvements.
* Added global and per-product Astro PDF enable controls with WooCommerce dependency handling.
* Updated admin pages, helper descriptions, and shortcode documentation UI.

= 1.0.4 =
* Maintenance release with minor compatibility and stability improvements.
* Internal refactors and housekeeping in preparation for future features.

= 1.0.3 =
* Improved mobile responsiveness and overflow handling across all shortcode outputs.
* Enhanced Google Maps autocomplete and timezone detection reliability.
* Minor UX improvements to forms, loading states, and admin UI.

= 1.0.2 =
* Added Sade Sati and Horoscope shortcodes to the shortcode list.
* Improved input validation (including longitude range checks) for all forms.
* Better error messages when API keys are missing or misconfigured.

= 1.0.1 =
* Added Numerology and Hora Muhurta shortcodes.
* Added admin quick-start guide and plugin info panel.
* General stability and performance improvements for AJAX handlers.

= 1.0.0 =
* Initial release

