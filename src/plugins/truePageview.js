(function (window, gaName) {
	// ====================
	// Name: truePageview
	// Description: Another way send pageviews, by not sending it when 
	// the user opens the page, but when he actually see it. Other functions
	// include send events about the change of the visibility of the page and 
	// stop the time counter of the "timeOnPage" plugin when the visibility is
	// set to "hidden".
	// ====================
	function truePageview(util, opt_config) {
		var hidden, visibilityChange;
		if (typeof document.hidden !== "undefined") {
		  hidden = "hidden";
		  visibilityChange = "visibilitychange";
		}
		else if (typeof document.mozHidden !== "undefined") {
		  hidden = "mozHidden";
		  visibilityChange = "mozvisibilitychange";
		}
		else if (typeof document.msHidden !== "undefined") {
		  hidden = "msHidden";
		  visibilityChange = "msvisibilitychange";
		} 
		else if (typeof document.webkitHidden !== "undefined") {
			hidden = "webkitHidden";
			visibilityChange = "webkitvisibilitychange";
		}
		
		// If the page is hidden, send nonInteraction event and if desired, stop the time counter of the "timeOnPage" plugin;
		// if the page is shown, send pageview, event and if desired, stop the time counter of the "timeOnPage" plugin
		var hasPageviewFired = false;
		var isPageHidden;
		function handleVisibilityChange() {
			if (document[hidden]) {
				isPageHidden = true;
				if(opt_config.changeTimeOnPage){
					ga("venom:exec", "timeOnPage", {origin: 'truePageviewHidden'});
				}
				ga("send", "event", "Pageview_Status", "Hidden", location.pathname + location.search, {"nonInteraction": 1});
			}
			else {
				if (opt_config.changeTimeOnPage && isPageHidden){
					ga("venom:exec", "timeOnPage", {origin: 'truePageviewShown'});
				}
				ga("send", "event", "Pageview_Status", "Shown", location.pathname + location.search);
				if (!hasPageviewFired) {
					ga('send', 'pageview');
					hasPageviewFired = true;
				}
			}
		}
		handleVisibilityChange();
		util.addListener(document, visibilityChange, handleVisibilityChange);
	}
	window[gaName]('venom:setPlugin', 'truePageview', truePageview);
}(window, window.GoogleAnalyticsObject || 'ga'));
