(function (window) {
	var ga = window[window.GoogleAnalyticsObject || 'ga'];

	function trackForm(util, opt_config) {
		opt_config = opt_config || {};

		if (opt_config.handler && typeof opt_config.handler !== 'function')
			throw util.errorBuilder('venom:plugin[trackForm]', '"handler" is not a function');
		if (opt_config.category && typeof opt_config.category !== 'string')
			throw util.errorBuilder('venom:plugin[trackForm]', '"category" is not a string');

		if (!opt_config.category)
			opt_config.category = 'Form Tracking';

		if (!opt_config.handler)
			opt_config.handler = function (info) {
				var action = 'form (' + info.formName + ')';
				var label = info.elementName + ' (' + info.event.type + ')';
				ga('send', 'event', opt_config.category, action, label);
			};
		opt_config.handler = util.safeFunction(opt_config.handler);

		var trackField = util.safeFunction(function (event) {
			event = event || window.event;
			var element = event.target || event.srcElement;
			try {
				opt_config.handler({
					element: element,
					elementName: getAttribute(element, 'name') || getAttribute(element, 'id') || getAttribute(element, 'type') || element.nodeName,
					formName: getFormName(element) || 'none',
					event: event
				});
			} catch (e) {
				throw util.errorBuilder('venom:plugin[trackForm]', 'opt_config.handler:' + e);
			}
		});

		var getFormName = util.safeFunction(function (element) {
			while (element && element.nodeName !== 'HTML') {
				if (element.nodeName === 'FORM') {
					return getAttribute(element, 'name') || getAttribute(element, 'id') || 'none';
				}
				element = element.parentNode;
			}
			return 'none';
		});

		var getAttribute = util.safeFunction(function (node, attr) {
			return typeof node[attr] === 'string' ? node[attr] : node.getAttribute(attr);
		});

		util.domReady(function () {
			util.forEach(['input', 'select', 'textarea', 'hidden'], function (tagName) {
				var elements = document.getElementsByTagName(tagName);
				util.forEach(elements, function (element) {
					if (!element.venomFormTracked) {
						element.venomFormTracked = true;
						util.addListener(element, 'change', trackField);
					}
				});
			});

			util.forEach(document.getElementsByTagName('form'), function (form) {
				if (!element.venomFormTracked) {
					element.venomFormTracked = true;
					util.addListener(form, 'submit', trackField);
				}
			});
		});
	}

	if (ga)
		ga('venom:provide', 'trackForm', trackForm);
}(window));