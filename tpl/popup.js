;(function($) {
	var $form = $;

	// 원본 이미지의 가로:세로 비율 (width / height). 이미지 로드 전에는 null
	var aspectRatio = null;
	// width/height 입력 change 핸들러끼리 서로를 무한 호출하지 않도록 막는 플래그
	var suppressSync = false;

	// 기존에 삽입된 mh_zoom 이미지를 더블클릭해서 다시 연 경우, 값을 채워줌
	function getComponent() {
		if (typeof(opener) == "undefined") return;

		var node = opener.editorPrevNode;
		if (!node || node.nodeName != 'IMG' || !node.getAttribute('editor_component')) return;
		if (node.getAttribute('editor_component') != 'mh_zoom') return;

		var src = node.getAttribute('src') || '';
		$form.find('#src').val(src);
		$form.find('#width').val(node.getAttribute('width') || 300);
		$form.find('#height').val(node.getAttribute('height') || '');
		$form.find('#position').val(node.getAttribute('position') || 'inside');
		$form.find('#zoom_scale').val(node.getAttribute('zoom_scale') || 100);
		$form.find('#show_scale_control').prop('checked', node.getAttribute('show_scale_control') !== 'N');
		$form.find('#title').val(node.getAttribute('title') || '');
		$form.find('#bottom_text').val(node.getAttribute('bottom_text') || '');

		if (src) {
			showPreview(src);
		}
	}

	function showPreview(url) {
		$form.find('#preview_img').attr('src', url).show();
		updateAspectRatioFromUrl(url);
	}

	// 원본 이미지의 실제 크기를 읽어와 가로세로 비율을 계산해 둠
	// (썸네일 표시용 width/height 속성과 무관하게, 항상 원본 파일 기준으로 계산)
	function updateAspectRatioFromUrl(url) {
		aspectRatio = null;
		if (!url) return;

		var img = new Image();
		img.onload = function() {
			if (!this.naturalWidth || !this.naturalHeight) return;
			aspectRatio = this.naturalWidth / this.naturalHeight;

			// 세로 값이 비어 있으면, 현재 입력된 가로 값 기준으로 자동 계산해 채워줌
			var $height = $form.find('#height');
			if ($.trim($height.val()) === '') {
				var w = parseInt($form.find('#width').val(), 10) || 300;
				suppressSync = true;
				$height.val(Math.round(w / aspectRatio));
				suppressSync = false;
			}
		};
		img.src = url;
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
			height: parseInt($form.find('#height').val(), 10) || 0,
			position: $form.find('#position').val(),
			zoom_scale: parseInt($form.find('#zoom_scale').val(), 10) || 100,
			show_scale_control: $form.find('#show_scale_control').is(':checked') ? 'Y' : 'N',
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

	// 가로 값을 입력하면 원본 비율에 맞춰 세로 값을 자동 계산
	function onWidthInput() {
		if (suppressSync || !aspectRatio) return;
		var w = parseInt($form.find('#width').val(), 10);
		if (!w) return;
		suppressSync = true;
		$form.find('#height').val(Math.round(w / aspectRatio));
		suppressSync = false;
	}

	// 세로 값을 입력하면 원본 비율에 맞춰 가로 값을 자동 계산
	function onHeightInput() {
		if (suppressSync || !aspectRatio) return;
		var h = parseInt($form.find('#height').val(), 10);
		if (!h) return;
		suppressSync = true;
		$form.find('#width').val(Math.round(h * aspectRatio));
		suppressSync = false;
	}

	/* DOM READY */
	$(function() {
		$form = $('#fo');
		$form.find('#btn_insert').click(insertComponent);
		$form.find('#upload_file').on('change', function() {
			var file = this.files && this.files[0];
			uploadImage(file);
		});
		$form.find('#width').on('input', onWidthInput);
		$form.find('#height').on('input', onHeightInput);
		if (typeof(opener) != "undefined") getComponent();
	});

})(jQuery);
