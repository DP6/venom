(function (window, gaName) {
	function gaHitHook(util, opt_config) {
		window[gaName](function (tracker) {
			var task = tracker.get('sendHitTask');

			tracker.set('sendHitTask', function (data) {
				var hitType = data.get('hitType');

				if (hitType === 'pageview') {
					window[gaName]('venom:trigger', 'gaPageview', {
						page: data.get('page') || document.location.pathname,
						title: data.get('title') || document.title
					});
				} else if (hitType === 'event') {
					window[gaName]('venom:trigger', 'gaEvent', {
						eventCategory: data.get('eventCategory'),
						eventAction: data.get('eventAction'),
						eventLabel: data.get('eventLabel'),
						eventValue: data.get('eventValue'),
						page: data.get('page') || document.location.pathname
					});
				} else if (hitType === 'timing') {
					window[gaName]('venom:trigger', 'gaTiming', {
						timingCategory: data.get('timingCategory'),
						timingVar: data.get('timingVar'),
						timingValue: data.get('timingValue'),
						timingLabel: data.get('timingLabel'),
						page: data.get('page') || document.location.pathname
					});
				}

				task(data);
			});
		});
	}

	if (ga)
		window[gaName]('venom:provide', 'gaHitHook', gaHitHook);
}(window, window.GoogleAnalyticsObject || 'ga'));