(function (window, gaName) {
	// ====================
	// Name: timeOnPage
	// Description: It includes the tools to let the "truePageview" plugin to modify its behavior.
	// truePageview stops the time counter when the user is not actually seeing the page.
	// ====================
	var start;
	function timeOnPage(util, opt_config) {
		var self = this;
		var performance = window.performance;
		
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

		if(!(opt_config.origin === "truePageviewHidden" || opt_config.origin === "truePageviewShown")){
			if (!performance || performance.timing || !performance.now) {//or !performance.timing?
				start = new Date().getTime();
			}
		}
		
		function handleTimeOnPage() {
			var ms = start ? (new Date().getTime() - start) : performance.now();
			var range = getRange(ms / 1000, opt_config.timeBucket);
			window[gaName]('send', {
				hitType: 'event',
				eventCategory: opt_config.category,
				eventAction: range,
				eventLabel: range
			});
		}
		self.venomUnloaded = false;
		if(opt_config.origin === "truePageviewHidden"){
			handleTimeOnPage();
		}
		else if (opt_config.origin === "truePageviewShown"){
			start = new Date().getTime();
			handleTimeOnPage();
		}
		else{
			if(self.venomUnloaded === false){
				util.addListener(window, 'beforeunload', handleTimeOnPage);
				self.venomUnloaded = true;
			}
			else{
				util.addListener(window, 'unload', handleTimeOnPage);
			}
		}	
	}

	function getRange(ms, timeBucket) {
		for (var i = 0, length = timeBucket.length; i < length; i++) {
			if (timeBucket[i] > ms) break;
		}
		return timeBucket[i + 1] ? timeBucket[i] + '-' + timeBucket[i + 1] : timeBucket[i - 1] + '+';
	}
	window[gaName]('venom:setPlugin', 'timeOnPage', timeOnPage);
}(window, window.GoogleAnalyticsObject || 'ga'));
