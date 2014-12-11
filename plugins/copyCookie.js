(function (window) {
	var ga = window[window.GoogleAnalyticsObject || 'ga'];

	function copyCookie(util, config) {
		var elementLinks;
		if (!config.listDomain)
			throw util.errorBuilder('plugin:copyCookie', '"listDomain" was not supplied');

		this.listDomain = config.listDomain;
		this.params = config.params || [util.getParamURL()];

		function decorateMe(event) {
			event = event || window.event;
			var target = event.target || event.srcElement;

			if (target && target.href) {
				ga('linker:decorate', target);
			}
		};

		elementLinks = document.getElementsByTagName('a');
		for (var i = elementLinks.length - 1; i >= 0; i--) {
			util.addListener(elementLinks[i], 'mousedown', function () {
				decorateMe(event);
			});
		}

		VenomCopyCookie.prototype.set = function () {
			// Load plugin to listener all links on the page and automatically fire cookie GA.
			ga('require', 'linker');
			ga('linker:autoLink', this.listDomain);
		};
	}

	if (ga)
		ga('venom:provide', 'copyCookie', copyCookie);
}(window));