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

function renderMarkers() {
	var dictSelect = $('.setup select[name=dict]');
	var markerIdInput = $('.setup textarea[name=id]');
	var sizeInput = $('.setup input[name=size]');

	function updateMarker() {
		var markerId = Number(markerIdInput.val());
		var size = Number(sizeInput.val());
		var dictName = dictSelect.val();
		var width = Number(dictSelect.find('option:selected').attr('data-width'));
		var height = Number(dictSelect.find('option:selected').attr('data-height'));

		// Wait until dict data is loaded
		loadDict.then(function () {

			var markers = document.getElementsByClassName('marker');
			var markerIDs = document.getElementsByClassName('marker-id');

			for (i = 0; i< markers.length; i++){
				markerId = markerIDs[i].getAttribute('val'); //Math.floor(Math.random() * 1000);
				svg = generateArucoMarker(width, height, dictName, markerId, size);

				markers[i].innerHTML = svg[0].outerHTML;
				markerIDs[i].innerHTML = 'ID ' + markerId;
			}
		})
	}

	updateMarker();

	dictSelect.change(updateMarker);
	$('.setup input').on('input', updateMarker);

};

// resize and put marker in it's parent at the defined position
function positionMarker(realMarker, realParent, jsonMarker, jsonParent){
	// var style = getComputedStyle(realParent);
	var left = jsonParent.margin + jsonMarker.left/(jsonParent.width - 2* jsonParent.margin) * 21.0; //* style.width;
	var top = jsonParent.margin + jsonMarker.top/(jsonParent.height - 2* jsonParent.margin) * 29.7; //* style.width;
	var width = jsonMarker.size/jsonParent.width * 21.0; //* style.width;
	var height = jsonMarker.size/jsonParent.width * 21.0; //* style.height;

	realMarker.setAttribute('style','width:' + width + 'mm;' + ' height:' + height + 'mm;' + ' top:' + top + 'mm;' + ' left:' + left + 'mm;' );
	realMarker.setAttribute('markerLeft',left * 10);
	realMarker.setAttribute('markerTop',top * 10);
	realMarker.setAttribute('markerWidth',width * 10);
	realMarker.setAttribute('markerHeight',height * 10);
};

// read json and display available print layouts in the left panel
$(document).ready(function showPrintLayouts() {

	// Wait until layouts data is loaded
	loadLayouts.then(function () {
		$.each (layouts, function(i, layout){

			// create a div element in the left panel for each print layout
			var element = document.createElement("div");
			element.setAttribute('class', 'print-layout');
			element.setAttribute('id', i);
			element.setAttribute('markers-per-page',Object.keys(layout.markers).length);

			element.addEventListener("click", function(){
				var coll = document.getElementsByClassName('print-layout');

				$.each(coll, function(i, elem){elem.setAttribute('class','print-layout');})
				this.setAttribute('class', 'print-layout selected');
				
				showMarkers();
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
		if (document.getElementById('layout1') != null)  {
			document.getElementById('layout1').setAttribute('class', 'print-layout selected')
			showMarkers();
		}
	});


});

// refresh markers
function showMarkers() {
	var sizeInput = $('.setup input[name=size]');

	// clear previous
	printPages = document.getElementById('printPages');
	printPages.innerHTML='';

	// read number of markers per page
	markersPerPage = 0;
	markerPositions =null;
	var coll = document.getElementsByClassName('print-layout selected');
	if (coll.length == 0) return;
	
	markersPerPage = coll[0].getAttribute('markers-per-page');
	markerPositions = coll[0].getElementsByClassName('marker-preview');
	

	var markerIdInput = $('.setup textarea[name=id]');
	var arrIDs = markerIdInput.val().trim().split(',');
	markersCount =arrIDs.length; 
	if (markerIdInput.val().trim() == "")	markersCount = 0;

	pagesCount = 0;

	// loop list of marker ids
	xMarker = -1;
	for (xi = 0; xi<markersCount; xi++){
		xID = parseInt(arrIDs[xi].trim());
		if (!isNaN(xID) && arrIDs[xi].trim() != "" && xID>=0 && xID <=999) {
			xMarker++;

			if (xMarker % Number(markersPerPage) == 0) {
				// create new page
				var printPage = document.createElement('div');
				printPage.setAttribute('class','printPage');

				printPages.appendChild(printPage);
			}

			var markerContainer = document.createElement('div');
			markerContainer.setAttribute('class', 'marker-container');
			printPage.appendChild(markerContainer);

			// add marker ID
			var markerID = document.createElement('div');
			markerID.setAttribute('class','marker-id');
			markerID.setAttribute('val',arrIDs[xi]);
			markerContainer.appendChild(markerID);
			
			// add marker
			var marker = document.createElement('div');
			marker.setAttribute('class','marker');
			markerContainer.appendChild(marker);
			
			markerContainer.setAttribute('style','left: ' + markerPositions[xMarker % Number(markersPerPage)].getAttribute('markerLeft') + 'mm; ' +
										'top: ' + markerPositions[xMarker % Number(markersPerPage)].getAttribute('markerTop') + 'mm; ' +
										'width: ' + markerPositions[xMarker % Number(markersPerPage)].getAttribute('markerWidth') + 'mm; ' +
										'height: ' + markerPositions[xMarker % Number(markersPerPage)].getAttribute('markerHeight') + 'mm; ');


			marker.setAttribute('style','margin:' +  Number(sizeInput.val()) + 'mm;')
		}
	}

	renderMarkers();
};

//TODO save as SVG all markers
