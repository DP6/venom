(function (window, gaName) {
	function trackScroll(util, opt_config) {
		
        var opt_config = opt_config || {};

        if (opt_config.category && typeof opt_config.category !== 'string')
            throw util.errorBuilder('venom:plugin[trackScroll]', '"category" is not a string');

        if (!opt_config.category)
            opt_config.category = 'Max Scroll';

		var body = window.body || window.getElementsByTagName('body')[0],
			documentElement = document.documentElement,
			maxScroll = 0, timeout = null;

		//Get current browser viewpane heigtht
		function getWindowHeight() {
			return window.innerHeight || documentElement.clientHeight ||
				body.clientHeight || 0;
		}

		// Get current absolute window scroll position
		function getWindowYScroll() {
			return window.pageYOffset || body.scrollTop ||
				documentElement.scrollTop || 0;
		}

		// Get current absolute document height
		function getDocHeight() {
			return Math.max(
				body.scrollHeight || 0, documentElement.scrollHeight || 0,
				body.offsetHeight || 0, documentElement.offsetHeight || 0,
				body.clientHeight || 0, documentElement.clientHeight || 0
			);
		}


		// Get current vertical scroll percentage
		function getScroll() {
			return ((getWindowYScroll() + getWindowHeight()) / getDocHeight()) * 100;
		}

		function updateScroll(now) {

			if (now === true) {
				_max_scroll = Math.max(getScroll(), maxScroll);
				return;
			}
            clearTimeout(timeout);
			timeout = setTimeout(function () {
				_max_scroll = Math.max(getScroll(), maxScroll);
			}, 400);
		}

		function sendScroll() {
			updateScroll(true);
			maxScroll = Math.floor(maxScroll);
			if (maxScroll <= 0 || maxScroll > 100) return;
			var bucket = (maxScroll > 10 ? 1 : 0) * (
				Math.floor((maxScroll - 1) / 10) * 10 + 1
			);
			bucket = String(bucket) + '-' +
				String(Math.ceil(maxScroll / 10) * 10);

			ga('send', 'event', opt_config.category, url, bucket, Math.floor(maxScroll));
		}

		// Tracks the max Scroll on the page.
		this._addEventListener(window, 'scroll', updateScroll);
		this._addEventListener(window, 'beforeunload', sendScroll);
	}

	window[gaName]('venom:setPlugin', 'trackScroll', trackScroll);
}(window, window.GoogleAnalyticsObject || 'ga'));