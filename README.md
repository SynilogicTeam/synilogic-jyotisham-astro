# Astro API By Synilogic WordPress Plugin

A comprehensive WordPress plugin that integrates the hosted Astro API By Synilogic service to provide a complete Kundli (astrological chart) generator with secure server-side API key handling.

## Features

- **Secure API Integration**: All API calls are made server-side to protect your API keys
- **Google Maps Integration**: Location autocomplete with timezone detection
- **Multiple Chart Types**: North Indian, South Indian, and East Indian chart styles
- **Comprehensive Reports**: Basic details, planetary positions, dashas, ashtakvarga, and more
- **Responsive Design**: Mobile-friendly interface with touch support
- **Shortcode Support**: Easy integration on any page or post
- **Admin Dashboard**: Complete settings management and API status monitoring
- **Rate Limiting**: Built-in protection against API abuse
- **Error Handling**: Comprehensive error handling and user feedback

## Installation

1. Upload the `synilogic-jyotisham-astro` folder to your `/wp-content/plugins/` directory
2. Activate the plugin through the 'Plugins' menu in WordPress
3. Go to 'Astro API By Synilogic' in your admin menu to configure the plugin

## Configuration

### Required API Keys

1. **Astro API By Synilogic Key**: Get your API key from [Astro API By Synilogic](https://synilogic.in)
2. **Google Maps API Key**: Get your API key from [Google Cloud Console](https://console.cloud.google.com)

### Setup Steps

1. Navigate to **Astro API By Synilogic > Settings** in your WordPress admin
2. Enter your Astro API By Synilogic API key
3. Enter your Google Maps API key
4. Click "Test API Connection" to verify your keys
5. Save your settings

## Usage

### Shortcodes

#### Basic Kundli Generator
```
[jyotisham_kundli]
```

#### Basic Form Only
```
[jyotisham_kundli basic="true"]
```

#### Custom Language
```
[jyotisham_kundli language="hi"]
```

#### Custom Title and Description
```
[jyotisham_kundli title="My Kundli Generator" description="Generate your personalized astrological chart"]
```

### Available Languages
- `en` - English
- `hi` - Hindi
- `ta` - Tamil
- `te` - Telugu
- `ka` - Kannada
- `ml` - Malayalam
- `be` - Bengali
- `gr` - Gujarati
- `mr` - Marathi

## Features Overview

### 1. Basic Information
- Personal details
- Astrological information (Ascendant, Rasi, Nakshatra)
- Vedic details (Gana, Yoni, Vasya, etc.)
- Gemstone recommendations
- Panchang details

### 2. Astrological Charts
- Multiple chart styles (North Indian, South Indian, East Indian)
- Various chart divisions (D1, D3, D4, D6, D7, D8, D9, D10, D12, D16, D20, D24, D27, D30, D40, D45, D60)
- Special charts (Sun, Moon, Bhav Chalit, Transit)

### 3. Planetary Details
- Complete planetary positions
- Zodiac signs and houses
- Nakshatra information
- Lucky details (gems, numbers, colors, letters)

### 4. Dashas (Planetary Periods)
- Current Mahadasha and Antardasha
- Complete Mahadasha periods
- Detailed timing information

### 5. Ashtakvarga
- Ashtakvarga points for all houses
- Planetary contributions
- Strength analysis

### 6. Ascendant Sign Report
- Detailed ascendant analysis
- Zodiac characteristics
- Predictions and qualities
- Gayatri mantra

### 7. KP Astrology
- Pseudo Rasi and Nakshatra
- Sub lords and sub-sub lords
- KP planetary positions

### 8. Dosh Analysis
- Mangal Dosh
- Kaal Sarp Dosh
- Manglik Dosh
- Pitra Dosh

### 9. Rudraksh Suggestions
- Recommended Rudraksh beads
- Wearing instructions
- Mantras and qualities

### 10. Gemstone Suggestions
- Personalized gem recommendations
- Wearing instructions
- Benefits and substitutes

## Security Features

- **Server-side API calls**: All API keys are stored securely and used only on the server
- **Nonce verification**: All AJAX requests are protected with WordPress nonces
- **Input validation**: Comprehensive validation of all user inputs
- **Rate limiting**: Protection against API abuse
- **Sanitization**: All data is properly sanitized before processing

## Technical Requirements

- WordPress 5.0 or higher
- PHP 7.4 or higher
- cURL extension enabled
- SSL certificate (recommended for production)

## API Usage

The plugin makes the following API calls to Astro API By Synilogic:

- `/api/extended_horoscope/extended_kundali` - Basic Kundli data
- `/api/chart_image/{division}` - Chart images
- `/api/horoscope/planet-details` - Planetary positions
- `/api/dasha/current-mahadasha-full` - Dasha information
- `/api/horoscope/ashtakvarga` - Ashtakvarga data
- `/api/horoscope/ascendant-report` - Ascendant details
- `/api/extended_horoscope/planets_kp` - KP astrology
- `/api/dosha/*` - Dosh analysis
- `/api/extended_horoscope/rudraksh_suggestion` - Rudraksh recommendations
- `/api/extended_horoscope/gem_suggestion` - Gemstone suggestions

## Troubleshooting

### Common Issues

1. **API Connection Failed**
   - Verify your API keys are correct
   - Check if your API key has sufficient credits
   - Ensure your server can make outbound HTTPS requests

2. **Google Maps Not Working**
   - Verify your Google Maps API key is valid
   - Ensure the Places API is enabled
   - Check if your domain is authorized

3. **Charts Not Displaying**
   - Check if your API key supports chart generation
   - Verify the chart division is valid
   - Check browser console for JavaScript errors

### Debug Mode

Enable WordPress debug mode to see detailed error logs:

```php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
```

## Support

For support and questions:
- Check the plugin settings page for API status
- Review the error logs in WordPress debug mode
- Contact the plugin developer (Synilogic) for technical support

## Legal

- Privacy Policy: https://synilogic.in/privacy-policy
- Terms of Service: https://synilogic.in/terms

## Changelog

### Version 1.0.3
- Improved mobile responsiveness and overflow handling across all shortcode outputs
- Enhanced Google Maps autocomplete and timezone detection reliability
- Minor UX improvements to forms, loading states, and admin UI

### Version 1.0.2
- Added Sade Sati and Horoscope shortcodes to the shortcode list
- Improved input validation (including longitude range checks) for all forms
- Better error messages when API keys are missing or misconfigured

### Version 1.0.1
- Added Numerology and Hora Muhurta shortcodes
- Added admin quick-start guide and plugin information panel
- General stability and performance improvements for AJAX handlers

### Version 1.0.0
- Initial release
- Complete Kundli generator functionality
- Secure API integration
- Admin dashboard
- Shortcode support
- Responsive design
- Mobile touch support

## License

This plugin is licensed under the GPL v2 or later.

## Credits

- Astro API By Synilogic for astrological calculations
- Google Maps API for location services
- WordPress community for the platform
