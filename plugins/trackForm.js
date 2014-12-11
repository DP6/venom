(function (window) {
	var ga = window[window.GoogleAnalyticsObject || 'ga'];

	function trackForm(util, opt_config) {
		opt_config = opt_config || {};

		// Form is already tracked
		if (this.venomFormTracked) return false;
		this.venomFormTracked = true;

		if (opt_config.handler && typeof opt_config.handler !== 'function')
			throw util.errorBuilder('plugin:trackForm', '"handler" is not a function');
		if (opt_config.category && typeof opt_config.category !== 'string')
			throw util.errorBuilder('plugin:trackForm', '"category" is not a string');

		opt_config.category = opt_config.category || 'Form Tracking';

		function trackField(event) {
			var element = event.target,
				elementName = element.name || element.id || element.type || element.nodeName,
				formName = getFormName(element),
				action = 'form (' + formName + ')',
				label = elementName + ' (' + event.type + ')';

			if (typeof opt_config.handler === 'function') {
				opt_config.handler({
					element: element,
					elementName: elementName,
					formName: formName,
					event: event
				});
			} else {
				ga('send', 'event', opt_config.category, action, label);
			}
		}

		function getFormName(element) {
			while (element && element.nodeName !== 'HTML') {
				if (element.nodeName === 'FORM') {
					return element.name || element.id || 'none';
				}
				element = element.parentNode;
			}
			return 'none';
		}

		util.domReady(function () {
			var changeTags = ['input', 'select', 'textarea', 'hidden'],
				forms = document.getElementsByTagName('form'),
				elements;

			util.forEach(changeTags, function (tagName) {
				elements = document.getElementsByTagName(tagName);
				util.forEach(elements, function (element) {
					util.addListener(element, 'change', trackField);
				});
			});

			util.forEach(forms, function (form) {
				util.addListener(form, 'submit', trackField);
			});
		});
	}

	if (ga)
		ga('venom:provide', 'trackForm', trackForm);
}(window));