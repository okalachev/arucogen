function generateMarkerSvg(width, height, bits, fixPdfArtifacts = true) {
	var svg = document.createElement('svg');
	svg.setAttribute('viewBox', '0 0 ' + (width + 2) + ' ' + (height + 2));
	svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
	svg.setAttribute('shape-rendering', 'crispEdges');

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
			var white = bits[i * height + j];
			if (!white) continue;

			var pixel = document.createElement('rect');;
			pixel.setAttribute('width', 1);
			pixel.setAttribute('height', 1);
			pixel.setAttribute('x', j + 1);
			pixel.setAttribute('y', i + 1);
			pixel.setAttribute('fill', 'white');
			svg.appendChild(pixel);

			if (!fixPdfArtifacts) continue;

			if ((j < width - 1) && (bits[i * height + j + 1])) {
				pixel.setAttribute('width', 1.5);
			}

			if ((i < height - 1) && (bits[(i + 1) * height + j])) {
				var pixel2 = document.createElement('rect');;
				pixel2.setAttribute('width', 1);
				pixel2.setAttribute('height', 1.5);
				pixel2.setAttribute('x', j + 1);
				pixel2.setAttribute('y', i + 1);
				pixel2.setAttribute('fill', 'white');
				svg.appendChild(pixel2);
			}
		}
	}

	return svg;
}

var dict;

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
		var option = dictSelect.options[dictSelect.selectedIndex];
		var dictName = option.value;
		var width = Number(option.getAttribute('data-width'));
		var height = Number(option.getAttribute('data-height'));
		var maxId = (Number(option.getAttribute('data-number')) || 1000) - 1;

		markerIdInput.setAttribute('max', maxId);

		if (markerId > maxId) {
			markerIdInput.value = maxId;
			markerId = maxId;
		}

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
