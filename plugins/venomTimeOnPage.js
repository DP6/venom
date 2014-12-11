(function(window) {
	var ga = window[window['GoogleAnalyticsObject'] || 'ga'];

	function providePlugin(pluginName, plugin) {
		if (ga) ga('venom:provide', pluginName, plugin);
	}

	function timeOnPage(util, opt_config) {
		opt_config = opt_config || {};
		opt_config.timeBucket = opt_config.timeBucket || [1, 2, 5, 10, 20, 30, 40, 50, 60, 120, 180, 300, 600, 900, 1200, 1500];
		opt_config.category = opt_config.category || 'TimeOnPage (s)';
		var performance = window.performance;
		var start;

		if (!performance || !performance.timing || !performance.now) {
			start = new Date().getTime();
		}

		util.addListener(window, 'unload', function() {
			var time = start ? (new Date().getTime() - start) : performance.now();
			var range = findInBucket(time / 1000, opt_config.bucket);
			ga('send', 'event', opt_config.category, range, range);
		});
	}

	function findInBucket(time, timeBucket) {
		for (var i = 0, length = timeBucket.length; i < length; i++) {
			if (timeBucket[i] > time) break;
		}

		return timeBucket[i + 1] ? timeBucket[i] + '-' + timeBucket[i + 1] : timeBucket[i - 1] + '+';
	}
	providePlugin('timeOnPage', timeOnPage);
}(window));