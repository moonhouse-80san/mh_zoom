jQuery(function($) {
	$(document).off('change.mhZoomScale', '.mh_zoom_scale_input');
	$(document).on('change.mhZoomScale', '.mh_zoom_scale_input', function() {
		var $input = $(this);
		var zoomId = $input.data('target');
		var $zoom = $('#' + zoomId);
		var scalePercent = parseInt($input.val(), 10);

		if (!$zoom.length || isNaN(scalePercent)) {
			return;
		}

		scalePercent = Math.max(10, Math.min(500, scalePercent));
		$input.val(scalePercent);

		var rel = $zoom.attr('rel') || '';
		var zoomScale = scalePercent / 100;
		if (rel.match(/zoomScale\s*:/)) {
			rel = rel.replace(/zoomScale\s*:\s*[^,]+/, 'zoomScale:' + zoomScale);
		} else {
			rel += (rel ? ', ' : '') + 'zoomScale:' + zoomScale;
		}
		$zoom.attr('rel', rel);

		var zoom = $zoom.data('zoom');
		if (zoom && typeof zoom.destroy === 'function') {
			zoom.destroy();
		}
		$zoom.CloudZoom();
	});
});