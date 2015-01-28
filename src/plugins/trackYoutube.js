(function (window, gaName) {
	function trackYoutube(util, opt_config) {
		opt_config = opt_config || {};
		if (opt_config.percentages && util.typeOf(opt_config.percentages) !== 'Array')
			throw util.errorBuilder('venom:plugin[trackYoutube]', '"percentages" is not a function');
		if (opt_config.category && typeof opt_config.category !== 'string')
			throw util.errorBuilder('venom:plugin[trackYoutube]', '"category" is not a string');

		/**
		 * Default values to function.
		 */
		var self = this;

		/**
		 * Array of percentage to fire events.
		 */
		var timeTriggers = [];
		var opts;


		/**
		 * Used to map each vid to a set of timeTriggers and it's pool timer
		 */
		var poolMaps = {};

		function pool(target, hash) {
			if (poolMaps[hash] === undefined ||
				poolMaps[hash].timeTriggers.length <= 0) {
				return false;
			}
			var p = target.getCurrentTime() / target.getDuration() * 100;
			if (p >= poolMaps[hash].timeTriggers[0]) {
				var action = poolMaps[hash].timeTriggers.shift();
				// Event
				window[gaName]('send', 'event', opts.category, action + '%', target.getVideoUrl());
			}
			poolMaps[hash].timer = setTimeout(pool, 1000, target, hash);
		}

		function stopPool(target) {
			var h = target.getVideoUrl();
			if (poolMaps[h] && poolMaps[h].timer) {
				pool(target, h); // Pool one last time before clearing it.
				clearTimeout(poolMaps[h].timer);
			}
		}

		function startPool(target) {
			if (timeTriggers && timeTriggers.length) {
				var h = target.getVideoUrl();
				if (poolMaps[h]) {
					stopPool(target);
				} else {
					poolMaps[h] = {};
					poolMaps[h].timeTriggers = Array.prototype.slice.call(timeTriggers);
				}
				poolMaps[h].timer = setTimeout(pool, 1000, target, h);
			}
		}


		/**
		 * Called when the Video State changes
		 *
		 * We are currently tracking only finish, play and pause events
		 *
		 * @param {Object} event the event passed by the YT api.
		 */
		var states = {};

		function _ytStateChange(event) {
			var stateHandler = states[event.data];
			var action;

			if (typeof stateHandler === 'function') {
				action = stateHandler(event.target);
			}

			if (action) {
				window[gaName]('venom:trigger', 'youtube_' + action);
				window[gaName]('send', 'event', opts.category, action, event.target.getVideoUrl());
			}
		}

		/**
		 * Called when the player fires an Error Event
		 *
		 * @param {Object} event the event passed by the YT api.
		 */
		function _ytError(event) {
			window[gaName]('send', 'event', opts.category, 'error (' + event.data + ')', event.target.getVideoUrl());
		}

		/**
		 * Triggers the YouTube Tracking on the page
		 *
		 * Only works for the iframe tag. The video must have the parameter
		 * enablejsapi=1 on the url in order to make the tracking work.
		 *
		 * @param {(object)} opts.
		 */
		function _trackYoutube(opts) {
			var iframes = document.getElementsByTagName('iframe');
			var opt_timeTriggers = opts.percentages;
			var youtube_videos = [];
			var force = opts.force;
			var firstTag, script, i;
			for (i = 0; i < iframes.length; i++) {
				if (iframes[i].src.indexOf('//www.youtube.com/embed') >= 0) {
					if (iframes[i].src.indexOf('enablejsapi=1') === -1) {
						if (force) {
							// Reload the video enabling the api
							if (iframes[i].src.indexOf('?') === -1) {
								iframes[i].src += '?enablejsapi=1';
							} else {
								iframes[i].src += '&enablejsapi=1';
							}
						} else {
							// We can't track players that don't have api enabled.
							continue;
						}
					}
					youtube_videos.push(iframes[i]);
				}
			}
			if (youtube_videos.length > 0) {
				if (opt_timeTriggers && opt_timeTriggers.length) {
					timeTriggers = opt_timeTriggers;
				}
				// this function will be called when the youtube api loads
				window.onYouTubePlayerAPIReady = function (youtube_videos, p, i) {
					states[YT.PlayerState.ENDED] = function (target) {
						stopPool(target);
						return 'finish';
					};
					states[YT.PlayerState.PLAYING] = function (event) {
						startPool(target);
						return 'play';
					};
					states[YT.PlayerState.PAUSED] = function (event) {
						stopPool(target);
						return 'pause';
					};
					states[YT.PlayerState.BUFFERING] = function (event) {
						return null;
					};
					states[YT.PlayerState.CUED] = function (event) {
						return null;
					};
					for (i = 0; i < youtube_videos.length; i++) {
						p = new YT.Player(youtube_videos[i]);
						p.addEventListener('onStateChange', _ytStateChange);
						p.addEventListener('onError', _ytError);
						p = null;
					}
				};
				if (window.YT) onYouTubePlayerAPIReady(youtube_videos);

				var script = document.createElement('script');
				script.src = (document.location.protocol === 'https:' ? 'https:' : 'http:') + '//www.youtube.com/iframe_api';
				script.type = 'text/javascript';
				script.async = true;
				var firstScript = document.getElementsByTagName('script')[0];
				firstScript.parentNode.insertBefore(script, firstScript);
			}
		}

		function _gaTrackYoutube(config, deprecated_percentages) {
			// Support for legacy parameters
			var args = Array.prototype.slice.call(arguments);
			if (typeof config === 'boolean' || config === 'force') {
				opts = {
					force: !!config,
					percentages: deprecated_percentages && deprecated_percentages.length ? deprecated_percentages : false
				};
			}

			if (!opt_config.force)
				opt_config.force = false;
			if (!opt_config.category)
				opt_config.category = 'YouTube Video';
			if (!opt_config.percentages)
				opt_config.percentages = [5, 25, 50, 90];

			opts = opt_config;
			util.domReady(function () {
				_trackYoutube.call(self, opt_config);
			});
			return false;
		}
		_gaTrackYoutube(opt_config);
	}

	window[gaName]('venom:setPlugin', 'trackYoutube', trackYoutube);
}(window, window.GoogleAnalyticsObject || 'ga'));