<?php
/**
 * @class  mh_zoom
 * @author 팔공산 (80san@moonhouse.co.kr)
 * @brief  Cloud Zoom 라이브러리를 이용해 이미지를 확대해서 보여주는 에디터 컴포넌트
 */
class mh_zoom extends EditorHandler
{
	// editor.class.php의 EditorModel::getComponentObject()가 반드시 이 두 값을 넘겨줌
	var $editor_sequence = 0;
	var $component_path = '';

	/**
	 * @brief editor_sequence와 컴포넌트 경로를 전달받음
	 */
	function __construct($editor_sequence, $component_path)
	{
		$this->editor_sequence = $editor_sequence;
		$this->component_path = $component_path;
	}

	/**
	 * @brief 에디터에서 컴포넌트 버튼을 눌렀을 때 뜨는 팝업창 내용
	 */
	function getPopupContent()
	{
		$tpl_path = $this->component_path . 'tpl';
		Context::set('tpl_path', $tpl_path);

		$oTemplate = TemplateHandler::getInstance();
		return $oTemplate->compile($tpl_path, 'popup.html');
	}

	/**
	 * @brief 본문에 저장된 <img editor_component="mh_zoom" .../> 태그를
	 *        화면에 보여줄 때마다 실제 Cloud Zoom 마크업으로 변환
	 */
	function transHTML($xml_obj)
	{
		$src = $xml_obj->attrs->src ?? '';
		if ($src === '')
		{
			return '';
		}

		$width = (int)($xml_obj->attrs->width ?? 0);
		$width = $width > 0 ? $width : 300;

		$position = $xml_obj->attrs->position ?? 'inside';
		if (!in_array($position, ['left', 'right', 'top', 'bottom', 'inside'], true))
		{
			$position = 'inside';
		}

		$title = trim($xml_obj->attrs->title ?? '');
		$bottom_text = trim($xml_obj->attrs->bottom_text ?? '');

		$zoom_scale = (int)($xml_obj->attrs->zoom_scale ?? 100);
		if ($zoom_scale < 10 || $zoom_scale > 500)
		{
			$zoom_scale = 100;
		}

		// 값이 없으면(과거에 삽입된 이미지 포함) 기본적으로 노출
		$show_scale_control = ($xml_obj->attrs->show_scale_control ?? 'Y') !== 'N';

		// 상대경로 이미지 주소를 절대경로로 변환 (코어 image_link 컴포넌트와 동일한 방식)
		$normalized_src = str_replace(['&', '"'], ['&amp;', '&quot;'], $src);
		$normalized_src = str_replace('&amp;amp;', '&amp;', $normalized_src);
		if (substr($normalized_src, 0, 2) === './')
		{
			$normalized_src = \RX_BASEURL . substr($normalized_src, 2);
		}
		elseif (substr($normalized_src, 0, 1) !== '/' && !preg_match('!^https?:!i', $normalized_src))
		{
			$normalized_src = \RX_BASEURL . $normalized_src;
		}

		$zoom_info = new stdClass();
		$zoom_info->id = 'mhZoom' . substr(md5($src . microtime()), 0, 8);
		// 업로드는 이미지 1장만 받으므로, 썸네일과 확대용 원본이 같은 파일을 가리킴
		$zoom_info->src = $normalized_src;
		$zoom_info->zoom_src = $normalized_src;
		$zoom_info->width = $width;
		// 게시판 스킨 CSS(예: .xe_content img{width:auto!important})가 width 속성을 덮어써서
		// 원본 크기로 나오는 문제를 막기 위해, 인라인 style에도 !important로 강제 지정
		$zoom_info->size_style = ' style="width:' . $width . 'px !important;"';
		$zoom_info->position = $position;
		$zoom_info->zoom_scale_percent = $zoom_scale;
		$zoom_info->scale_control_id = $zoom_info->id . 'Scale';
		// cloud-zoom.js에 넘길 확대 배율 (1 = 원본 100%, 1.5 = 150%, 0.5 = 50%)
		$zoom_info->zoom_scale = $zoom_scale / 100;
		$zoom_info->alt_attr = htmlspecialchars($title, ENT_QUOTES);
		$zoom_info->title_attr = $title !== '' ? ' title="' . htmlspecialchars($title, ENT_QUOTES) . '"' : '';
		$zoom_info->show_title = $title !== '' ? 'true' : 'false';
		// 이미지 하단에 항상 보이는 별도 문구 (마우스 오버용 title과는 별개)
		$zoom_info->bottom_html = $bottom_text !== ''
			? '<span class="mh_zoom_bottom_text" style="width:' . $width . 'px !important;">' . htmlspecialchars($bottom_text, ENT_QUOTES) . '</span>'
			: '';
		// 이미지 밖 우측 상단에 책갈피 모양으로 붙여서 보여줄 확대 배율 조절 UI (옵션으로 켜고 끌 수 있음)
		// 라벨 문구 없이 입력창 + % 만 단순하게 노출
		$zoom_info->scale_control_html = $show_scale_control
			? '<span class="mh_zoom_scale_control">'
				. '<span class="mh_zoom_scale_icon" aria-hidden="true">🔍</span>'
				. '<input type="number" id="' . $zoom_info->scale_control_id . '" class="mh_zoom_scale_input" value="' . $zoom_info->zoom_scale_percent . '" min="10" max="500" step="10" data-target="' . $zoom_info->id . '" aria-label="확대 배율" />'
				. '<span class="mh_zoom_scale_unit">%</span></span>'
			: '';

		Context::set('zoom_info', $zoom_info);

		$tpl_path = $this->component_path . 'tpl';
		Context::set('tpl_path', $tpl_path);

		$oTemplate = TemplateHandler::getInstance();
		return $oTemplate->compile($tpl_path, 'display.html');
	}
}
/* End of file mh_zoom.class.php */
/* Location: ./modules/editor/components/mh_zoom/mh_zoom.class.php */
