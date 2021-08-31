function generateMarkerSvg(width, height, bits) {
	var svg = document.createElement('svg');
	svg.setAttribute('viewBox', '0 0 ' + (width + 2) + ' ' + (height + 2));
	svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
	svg.setAttribute('shape-rendering', 'crispEdges'); // disable anti-aliasing to avoid little gaps between rects

	// Background rect
	var rect = document.createElement('rect');
	rect.setAttribute('x', 0);
	rect.setAttribute('y', 0);
	rect.setAttribute('width', width + 2);
	rect.setAttribute('height', height + 2);
	rect.setAttribute('fill', 'black');
	svg.appendChild(rect);

	// "Pixels"
	for (var i = 0; i < height; i++) {
		for (var j = 0; j < width; j++) {
			var color = bits[i * height + j] ? 'white' : 'black';
			var pixel = document.createElement('rect');;
			pixel.setAttribute('width', 1);
			pixel.setAttribute('height', 1);
			pixel.setAttribute('x', j + 1);
			pixel.setAttribute('y', i + 1);
			pixel.setAttribute('fill', color);
			svg.appendChild(pixel);
		}
	}

	return svg;
}

var dict;

function generateArucoMarker(width, height, dictName, id) {
	console.log('Generate ArUco marker ' + dictName + ' ' + id);

	var bytes = dict[dictName][id];
	var bits = [];
	var bitsCount = width *  height;

	// Parse marker's bytes
	for (var byte of bytes) {
		var start = bitsCount - bits.length;
		for (var i = Math.min(7, start - 1); i >= 0; i--) {
			bits.push((byte >> i) & 1);
		}
	}

	return generateMarkerSvg(width, height, bits);
}

// Fetch markers dict
var loadDict = fetch('dict.json').then(function(res) {
	return res.json();
}).then(function(json) {
	dict = json;
});

function init() {
	var dictSelect = document.querySelector('.setup select[name=dict]');
	var markerIdInput = document.querySelector('.setup input[name=id]');
	var sizeInput = document.querySelector('.setup input[name=size]');
	var saveButton = document.querySelector('.save-button');

	function updateMarker() {
		var markerId = Number(markerIdInput.value);
		var size = Number(sizeInput.value);
		var dictName = dictSelect.options[dictSelect.selectedIndex].value;
		var width = Number(dictSelect.options[dictSelect.selectedIndex].getAttribute('data-width'));
		var height = Number(dictSelect.options[dictSelect.selectedIndex].getAttribute('data-height'));

		// Wait until dict data is loaded
		loadDict.then(function() {
			// Generate marker
			var svg = generateArucoMarker(width, height, dictName, markerId, size);
			svg.setAttribute('width', size + 'mm');
			svg.setAttribute('height', size + 'mm');
			document.querySelector('.marker').innerHTML = svg.outerHTML;
			saveButton.setAttribute('href', 'data:image/svg;base64,' + btoa(svg.outerHTML.replace('viewbox', 'viewBox')));
			saveButton.setAttribute('download', dictName + '-' + markerId + '.svg');
			document.querySelector('.marker-id').innerHTML = 'ID ' + markerId;
		})
	}

	updateMarker();

	dictSelect.addEventListener('change', updateMarker);
	dictSelect.addEventListener('input', updateMarker);
	markerIdInput.addEventListener('input', updateMarker);
	sizeInput.addEventListener('input', updateMarker);
}

init();
