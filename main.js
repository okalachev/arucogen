function generateMarkerSvg(width, height, bits) {
	var svg = $('<svg/>').attr({
		viewBox: '0 0 ' + (width + 2) + ' ' + (height + 2),
		xmlns: 'http://www.w3.org/2000/svg',
		'shape-rendering': 'crispEdges' // disable anti-aliasing to avoid little gaps between rects
	});

	// Background rect
	$('<rect/>').attr({
		x: 0,
		y: 0,
		width: width + 2,
		height: height + 2,
		fill: 'black'
	}).appendTo(svg);

	// "Pixels"
	for (var i = 0; i < height; i++) {
		for (var j = 0; j < width; j++) {
			var color = bits[i * height + j] ? 'white' : 'black';
			var pixel = $('<rect/>').attr({
				width: 1,
				height: 1,
				x: j + 1,
				y: i + 1,
				fill: color
			});
			pixel.appendTo(svg);
		}
	}

	return svg;
}

var dict;
var layouts;

function generateArucoMarker(width, height, dictName, id) {
	console.log('Generate ArUco marker ' + dictName + ' ' + id);

	var bytes = dict[dictName][id];
	var bits = [];
	var bitsCount = width * height;

	// Parse marker's bytes
	for (var byte of bytes) {
		var start = bitsCount - bits.length;
		for (var i = Math.min(7, start - 1); i >= 0; i--) {
			bits.push((byte >> i) & 1);
		}
	}

	return generateMarkerSvg(width, height, bits);
}

var loadDict = $.getJSON('dict.json', function (data) {
	dict = data;
});

var loadLayouts = $.getJSON('layouts.json', function (data) {
	layouts = data;
});

$(function () {
	var dictSelect = $('.setup select[name=dict]');
	var markerIdInput = $('.setup input[name=id]');
	var sizeInput = $('.setup input[name=size]');

	function updateMarker() {
		var markerId = Number(markerIdInput.val());
		var size = Number(sizeInput.val());
		var dictName = dictSelect.val();
		var width = Number(dictSelect.find('option:selected').attr('data-width'));
		var height = Number(dictSelect.find('option:selected').attr('data-height'));

		// Wait until dict data is loaded
		loadDict.then(function () {
			// Generate marker
			var svg = generateArucoMarker(width, height, dictName, markerId, size);
			svg.attr({
				width: size + 'mm',
				height: size + 'mm'
			});
			$('.marker').html(svg[0].outerHTML);
			$('.save-button').attr({
				href: 'data:image/svg;base64,' + btoa(svg[0].outerHTML.replace('viewbox', 'viewBox')),
				download: dictName + '-' + markerId + '.svg'
			});
			$('.marker-id').html('ID ' + markerId);
		})
	}

	updateMarker();

	dictSelect.change(updateMarker);
	$('.setup input').on('input', updateMarker);

});

function positionMarker(realMarker, realParent, jsonMarker, jsonParent){
	// var style = getComputedStyle(realParent);
	var left = jsonParent.margin + jsonMarker.left/(jsonParent.width - 2* jsonParent.margin) * 21.0; //* style.width;
	var top = jsonParent.margin + jsonMarker.top/(jsonParent.height - 2* jsonParent.margin) * 29.7; //* style.width;
	var width = jsonMarker.size/jsonParent.width * 21.0; //* style.width;
	var height = jsonMarker.size/jsonParent.width * 21.0; //* style.height;

	realMarker.setAttribute('style','width:' + width + 'mm;' + ' height:' + height + 'mm;' + ' top:' + top + 'mm;' + ' left:' + left + 'mm;' );
};

$(document).ready(function showPrintLayouts() {

	// Wait until dict data is loaded
	loadLayouts.then(function () {
		$.each (layouts, function(i, layout){

			// create a div element in the left panel for each print layout
			var element = document.createElement("div");
			element.setAttribute('class', 'print-layout');
			element.setAttribute('id', i);
			element.addEventListener("click", function(){
				var coll = document.getElementsByClassName('print-layout');

				$.each(coll, function(i, elem){elem.setAttribute('class','print-layout');})
				this.setAttribute('class', 'print-layout selected');

			});

			$.each(layout.markers, function(i, marker){
				var markerPreview = document.createElement("div");
				markerPreview.setAttribute('class','marker-preview');
				positionMarker(markerPreview, element, marker,layout);
				
				element.appendChild(markerPreview);
			});

			if (element != null) {
				document.getElementById('print-layouts').appendChild(element);
			}
		});

		// select default page layout
		// layouts[0].setAttribute('class', 'print-layout selected')
	});


});
