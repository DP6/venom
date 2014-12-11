(function() {
	var ga = window[window.GoogleAnalyticsObject || 'ga'];
	var trackForm = function(util, config) {
		// Form is already tracked
		if (this.venomFormTracked) return false;

		this.venomFormTracked = true;

		if (typeof config !== 'object') {
			config = {};
		}

		if (config.handler && typeof config.handler !== 'function')
			throw util.errorBuilder('plugin:trackForm', '"handler" is not a function');
		if (config.category && typeof config.category !== 'string')
			throw util.errorBuilder('plugin:trackForm', '"category" is not a string');

		// Category of the UA event
		var category = config.category || 'Form Tracking',
			// Fires the UA event
			trackField = function(event) {
				var element = event.target,
					elementName = element.name || element.id || element.type || element.nodeName,
					formName = getFormName(element),
					action = 'form (' + formName + ')',
					label = elementName + ' (' + event.type + ')';

				if (typeof config.handler === 'function') {
					config.handler({
						element: element,
						elementName: elementName,
						formName: formName,
						event: event
					});
				} else {
					ga('send', 'event', category, action, label);
				}
			},
			// return the formName of the element
			getFormName = function(element) {
				while (element && element.nodeName !== 'HTML') {
					if (element.nodeName === 'FORM') {
						return element.name || element.id || 'none';
					}
					element = element.parentNode;
				}
				return 'none';
			};

		util.domReady(function() {
			var changeTags = ['input', 'select', 'textarea', 'hidden'],
				forms = document.getElementsByTagName('form'),
				elements;

			util.forEach(changeTags, function(tagName) {
				elements = document.getElementsByTagName(tagName);
				util.forEach(elements, function(element) {
					util.addListener(element, 'change', trackField);
				});
			});

			util.forEach(forms, function(form) {
				util.addListener(form, 'submit', trackField);
			});
		});
	};

	if (ga)
		ga('venom:provide', 'trackForm', trackForm);

}());