;(function($) {
	var $form = $;

	// 기존에 삽입된 mh_zoom 이미지를 더블클릭해서 다시 연 경우, 값을 채워줌
	function getComponent() {
		if (typeof(opener) == "undefined") return;

		var node = opener.editorPrevNode;
		if (!node || node.nodeName != 'IMG' || !node.getAttribute('editor_component')) return;
		if (node.getAttribute('editor_component') != 'mh_zoom') return;

		var src = node.getAttribute('src') || '';
		$form.find('#src').val(src);
		$form.find('#width').val(node.getAttribute('width') || 300);
		$form.find('#position').val(node.getAttribute('position') || 'inside');
		$form.find('#zoom_scale').val(node.getAttribute('zoom_scale') || 100);
		$form.find('#title').val(node.getAttribute('title') || '');
		$form.find('#bottom_text').val(node.getAttribute('bottom_text') || '');

		if (src) {
			showPreview(src);
		}
	}

	function showPreview(url) {
		$form.find('#preview_img').attr('src', url).show();
	}

	function uploadImage(file) {
		if (!file) return;

		var $status = $form.find('#upload_status');
		var $btnInsert = $form.find('#btn_insert');

		var formData = new FormData();
		formData.append('Filedata', file);
		formData.append('editor_sequence', $form.find('#editor_sequence').val());
		formData.append('module_srl', $form.find('#module_srl').val());
		formData.append('mid', $form.find('#mid').val());

		$status.text('업로드 중...');
		$btnInsert.prop('disabled', true);

		$.ajax({
			url: './index.php?module=file&act=procFileUpload',
			type: 'POST',
			data: formData,
			processData: false,
			contentType: false,
			dataType: 'json',
			success: function(data) {
				$btnInsert.prop('disabled', false);
				if (!data || data.error != 0 || !data.download_url) {
					$status.text('업로드 실패' + (data && data.message ? (': ' + data.message) : ''));
					return;
				}
				$form.find('#src').val(data.download_url);
				$status.text('업로드 완료');
				showPreview(data.download_url);
			},
			error: function() {
				$btnInsert.prop('disabled', false);
				$status.text('업로드 실패 (서버 오류)');
			}
		});
	}

	function insertComponent() {
		if (typeof(opener) == "undefined") return;

		var src = $.trim($form.find('#src').val());
		if (!src) {
			alert('이미지를 먼저 업로드해 주세요.');
			return;
		}

		var attrs = {
			editor_component: 'mh_zoom',
			src: src,
			width: parseInt($form.find('#width').val(), 10) || 300,
			position: $form.find('#position').val(),
			zoom_scale: parseInt($form.find('#zoom_scale').val(), 10) || 100,
			title: $form.find('#title').val(),
			bottom_text: $form.find('#bottom_text').val()
		};

		var $img = $('<img />').attr(attrs);
		var iframe_obj = opener.editorGetIFrame(opener.editorPrevSrl);

		try {
			var prevNode = opener.editorPrevNode;
			prevNode.parentNode.insertBefore($img.get(0), prevNode);
			prevNode.parentNode.removeChild(prevNode);
		} catch (e) {
			try {
				opener.editorReplaceHTML(iframe_obj, $('<div>').append($img).html());
			} catch (ee) { }
		}

		opener.editorFocus(opener.editorPrevSrl);
		window.close();
	}

	/* DOM READY */
	$(function() {
		$form = $('#fo');
		$form.find('#btn_insert').click(insertComponent);
		$form.find('#upload_file').on('change', function() {
			var file = this.files && this.files[0];
			uploadImage(file);
		});
		if (typeof(opener) != "undefined") getComponent();
	});

})(jQuery);
