(function (window, gaName) {
	function mirrorTracker(util) {
		var self = this;
		var name = self.config.mirrorTracker;

		if (name === true)
			name = self.tracker.get('name');

		window[gaName]('venom:on', 'gaPageview', function (util, info) {
			util.forEach(ga.getAll(), function (tracker) {
				if (name !== tracker.get('name'))
					tracker.send('pageview', {
						page: info.page,
						title: info.title
					});
			});
		});

		window[gaName]('venom:on', 'gaEvent', function (util, info) {
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

	window[gaName]('venom:setPlugin', 'mirrorTracker', mirrorTracker);
}(window, window.GoogleAnalyticsObject || 'ga'));