(function (window) {
	var gaName = window.GoogleAnalyticsObject || 'ga';

	function mirrorTracker(util) {
		var self = this;
		var name = self.config.mirrorTracker;
		
		if (typeof self.config.mirrorTracker === true)
			name = self.tracker.get('name');

		window[gaName]('venom:on', 'gaPageview', function (info) {
			util.forEach(ga.getAll(), function (tracker) {
				if (name !== tracker.get('name'))
					tracker.send('pageview', {
						page: info.page,
						title: info.title
					});
			});
		});

		window[gaName]('venom:on', 'gaEvent', function (info) {
			util.forEach(ga.getAll(), function (tracker) {
				if (name !== tracker.get('name'))
					tracker.send('event', {
						eventCategory: info.eventCategory,
						eventAction: info.eventAction,
						eventLabel: info.eventLabel,
						eventValue: info.eventValue
					});
			});
		});
	}

	if (ga)
		window[gaName]('venom:provide', 'mirrorTracker', mirrorTracker);
}(window));