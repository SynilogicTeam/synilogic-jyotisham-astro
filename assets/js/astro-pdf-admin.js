jQuery(function($) {
    'use strict';

    var reportType = $('#_jyotisham_astro_pdf_report_type');
    var reportSlug = $('#_jyotisham_astro_pdf_report_slug');

    if (!reportType.length || !reportSlug.length) {
        return;
    }

    var manuallyEdited = false;

    reportSlug.on('input', function() {
        manuallyEdited = true;
    });

    reportType.on('change', function() {
        if (manuallyEdited) {
            return;
        }

        var value = String(reportType.val() || '').trim();
        if (!value) {
            return;
        }

        if (value === 'custom') {
            return;
        }

        reportSlug.val(value);
    });
});
