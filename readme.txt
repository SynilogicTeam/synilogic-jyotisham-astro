=== Astro API By Synilogic ===
Tags: astrology, horoscope, kundli, panchang, numerology
Requires at least: 5.0
Tested up to: 6.9
Requires PHP: 7.4
Stable tag: 1.0.4
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Astro API By Synilogic connects your site to JyotishamAstro to deliver Kundli, Matching, Panchang and Numerology via simple shortcodes.

== Description ==
Build rich astrological experiences with configurable forms, multilingual outputs, and Google Maps-based place lookup and timezone detection. The plugin is free; the Synilogic Astro API is a paid service. Get API access and plan details at https://www.jyotishamastroapi.com/.

Plugin slug: `synilogic-jyotisham-astro`

= Highlights =
- Kundli & charts: North/South/East Indian layouts plus divisional charts
- Panchang, Choghadiya, Numerology, Hora Muhurta experiences
- Matching: Ashtakoot, Dashakoot, aggregate scoring
- Multilingual output (en, hi, ta, te, ka, ml, be, gr, mr)
- Google Maps autocomplete with timezone detection
- Server-side API calls; keys never exposed in the browser
- Responsive UI and shortcode-first setup

= Shortcodes =
- `[jyotisham_kundli]` — Full Kundli generator 
- `[jyotisham_matching]` — Kundli matching / compatibility
- `[jyotisham_panchang]` — Daily Panchang
- `[jyotisham_choghadiya]` — Choghadiya timings
- `[jyotisham_numerology]` — Numerology insights
- `[jyotisham_hora]` — Hora Muhurta
- `[jyotisham_horoscope]` — Daily, weekly, monthly, and yearly horoscope
- `[jyotisham_sadesati]` — Sade Sati status, timeline, and remedies

= Screenshots =
1. Plugin settings page
1. All shortcodes list
3. Kundli Shortcode
4. Matching Shortcode


= Privacy & Security =
- API keys are stored server-side; calls are made from your server.
- Nonce validation on AJAX endpoints; input sanitization and validation.
- Data sent: birth details and options required to generate charts/results via Synilogic Astro API.
- Review Synilogic policies for data handling: https://synilogic.in/privacy-policy and https://synilogic.in/terms

Ownership: Developed and maintained by Synilogic.

== Installation ==
1. Upload the `synilogic-jyotisham-astro` folder to `/wp-content/plugins/`.
2. Activate via the WordPress Plugins screen.
3. Go to **JyotishamAstro API** in wp-admin, add your JyotishamAstro API key (and Google Maps key for autocomplete/timezone), then save.
4. Add the desired shortcode to a page or post and publish.

== Frequently Asked Questions ==
= Do I need an API key? =
Yes. Get it from https://www.jyotishamastroapi.com/. Without a valid key the shortcodes will show a configuration message.

= How do I embed the forms? =
Create or edit a page and add `[jyotisham_kundli]` (or any shortcode above).

= I'm seeing "invalid request" or empty results. =
Confirm your JyotishamAstro API key is active and has credits, verify your Google Maps key (if using autocomplete), and ensure your server can make outbound HTTPS requests. Enable WP_DEBUG for details.

= How much does this cost? =
The plugin is free. API usage is billed per your JyotishamAstro API plan. See pricing and limits at https://www.jyotishamastroapi.com/

= Which languages are supported? =
English, Hindi, Tamil, Telugu, Kannada, Malayalam, Bengali, Gujarati, and Marathi (as supported by the JyotishamAstro API).

== Changelog ==
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

