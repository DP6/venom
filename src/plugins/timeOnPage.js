(function (window, gaName) {
	function timeOnPage(util, opt_config) {
		var self = this;
		var performance = window.performance;
		var start;
		if (typeof opt_config !== 'object')
			opt_config = {};

		if (opt_config.timeBucket && util.typeOf(opt_config.timeBucket) !== 'Array')
			throw util.errorBuilder('venom:plugin[timeOnPage]', '"handler" is not an array');
		if (opt_config.category && typeof opt_config.category !== 'string')
			throw util.errorBuilder('venom:plugin[timeOnPage]', '"category" is not a string');

		if (!opt_config.timeBucket)
			opt_config.timeBucket = [1, 2, 5, 10, 20, 30, 40, 50, 60, 120, 180, 300, 600, 900, 1200, 1500];
		if (!opt_config.category)
			opt_config.category = 'Time on Page(s)';

		if (!performance || performance.timing || !performance.now) {
			start = new Date().getTime();
		}

		util.addListener(window, 'beforeunload', function () {
			self.venomUnloaded = true;
			var ms = start ? (new Date().getTime() - start) : performance.now();
			var range = getRange(ms / 1000, opt_config.timeBucket);
			window[gaName]('send', {
				hitType: 'event',
				eventCategory: opt_config.category,
				eventAction: range,
				eventLabel: range
			});
		});

		util.addListener(window, 'unload', function () {
			if (!self.venomUnloaded) {
				var ms = start ? (new Date().getTime() - start) : performance.now();
				var range = getRange(ms / 1000, opt_config.timeBucket);
				window[gaName]('send', {
					hitType: 'event',
					eventCategory: opt_config.category,
					eventAction: range,
					eventLabel: range
				});
			}
		});
	}

	function getRange(ms, timeBucket) {
		for (var i = 0, length = timeBucket.length; i < length; i++) {
			if (timeBucket[i] > ms) break;
		}

		return timeBucket[i + 1] ? timeBucket[i] + '-' + timeBucket[i + 1] : timeBucket[i - 1] + '+';
	}

	window[gaName]('venom:setPlugin', 'timeOnPage', timeOnPage);
}(window, window.GoogleAnalyticsObject || 'ga'));