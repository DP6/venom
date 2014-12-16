(function (window) {
	var gaName = window.GoogleAnalyticsObject || 'ga';

	function copyCookie(util, config) {
		if (!config || !config.domainList)
			throw util.errorBuilder('plugin:copyCookie', '"domainList" was not supplied');
		if (util.typeOf(config.domainList) !== 'Array')
			throw util.errorBuilder('plugin:copyCookie', '"domainList" is not an array');

		window[gaName]('require', 'linker');
		if (config.useAutoLinker) {
			// Load plugin to listener all links on the page and automatically fire cookie GA.
			window[gaName]('linker:autoLink', config.domainList);
		} else {
			util.forEach(document.getElementsByTagName('a'), function (el) {
				util.addListener(el, 'mousedown', function (event) {
					if (verifyDomain(util, config.domainList, this.hostname)) {
						event = event || window.event;
						var target = event.target || event.srcElement;

						if (target && target.href) {
							window[gaName]('linker:decorate', target);
						}
					}
				});
			});
		}
	}

	function verifyDomain(util, domainList, host) {
		var ret = false;
		util.forEach(domainList, function (domain) {
			if (typeof domain === 'string' && host.indexOf('domain') >= 0 || util.typeOf(domain) === 'RegExp' && domain.test(host))
				ret = true;
		});
		return ret;
	}

	if (ga)
		window[gaName]('venom:provide', 'copyCookie', copyCookie);
}(window));