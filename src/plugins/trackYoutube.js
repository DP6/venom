(function (window, gaName) {
	function trackYoutube(util, opt_config) {
		opt_config = opt_config || {};
		if (opt_config.percentages && util.typeOf(opt_config.percentages) !== 'Array')
			throw util.errorBuilder('venom:plugin[trackYoutube]', '"percentages" is not a function');
		if (opt_config.category && typeof opt_config.category !== 'string')
			throw util.errorBuilder('venom:plugin[trackYoutube]', '"category" is not a string');
		if (opt_config && typeof opt_config !== 'object')
			throw util.errorBuilder('venom:plugin[trackYoutube]', 'argument is not an object');

		opt_config = {
			force: !!opt_config.force || false,
			category: opt_config.category || 'YouTube Video', 
			percentages: opt_config.percentages || [5, 25, 50, 90]
		}

		

		/**
		 * Default values to function.
		 */
		var self = this;

		/**
		 * Array of percentage to fire events.
		 */
		var timeTriggers = opt_config.percentages;


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
				window[gaName]('send', 'event', opt_config.category, action + '%', target.getVideoUrl());
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

		function youtubeStateChange(event) {
			var stateHandler = states[event.data];
			var action;

			if (typeof stateHandler === 'function') {
				action = stateHandler(event.target);
			}

			if (action) {
				window[gaName]('venom:trigger', 'youtube_' + action);
				window[gaName]('send', 'event', opt_config.category, action, event.target.getVideoUrl());
			}
		}

		/**
		 * Called when the player fires an Error Event
		 *
		 * @param {Object} event the event passed by the YT api.
		 */
		function youtubeError(event) {
			window[gaName]('send', 'event', opt_config.category, 'error (' + event.data + ')', event.target.getVideoUrl());
		}

		/**
		 * Triggers the YouTube Tracking on the page
		 *
		 * Only works for the iframe tag. The video must have the parameter
		 * enablejsapi=1 on the url in order to make the tracking work.
		 *
		 * @param {(object)} opts.
		 */
		function universalTrackYoutube(opts) {
			var iframes = document.getElementsByTagName('iframe');
			var force = opts.force;
			var youtube_videos = [];
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
				// this function will be called when the youtube api loads
				window.onYouTubePlayerAPIReady = function (youtube_videos_api, p, i) {
					console.log(arguments);
					states[YT.PlayerState.ENDED] = function (event) {
						stopPool(event);
						return 'finish';
					};
					states[YT.PlayerState.PLAYING] = function (event) {
						startPool(event);
						return 'play';
					};
					states[YT.PlayerState.PAUSED] = function (event) {
						stopPool(event);
						return 'pause';
					};
					states[YT.PlayerState.BUFFERING] = function (event) {
						return null;
					};
					states[YT.PlayerState.CUED] = function (event) {
						return null;
					};
					if (!youtube_videos_api) {
						for (i = 0; i < youtube_videos.length; i++) {
							p = new YT.Player(youtube_videos[i]);
							p.addEventListener('onStateChange', youtubeStateChange);
							p.addEventListener('onError', youtubeError);
							p = null;
						}
					} else if (youtube_videos_api) {
						for (i = 0; i < youtube_videos_api.length; i++) {
							p = new YT.Player(youtube_videos_api[i]);
							p.addEventListener('onStateChange', youtubeStateChange);
							p.addEventListener('onError', youtubeError);
							p = null;
						}
					}
					
				};
				if (window.YT) onYouTubePlayerAPIReady(youtube_videos)
				else {
					var script = document.createElement('script');
					script.src = (document.location.protocol === 'https:' ? 'https:' : 'http:') + '//www.youtube.com/iframe_api';
					script.type = 'text/javascript';
					script.async = true;
					var firstScript = document.getElementsByTagName('script')[0];
					firstScript.parentNode.insertBefore(script, firstScript);
				}	
			}
		}

		util.domReady(function () {
			universalTrackYoutube.call(self, opt_config);
		});
	}

	window[gaName]('venom:setPlugin', 'trackYoutube', trackYoutube);
}(window, window.GoogleAnalyticsObject || 'ga'));