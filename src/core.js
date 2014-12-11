// ========================================
// == @author Paulo Brumatti
// == @version 0.1
// == digital inc / dp6 - 2014
// ========================================

// ====================
// Name: Constructor
// Description: Initiates the base for the plugin
// ====================
var ga = window[window.GoogleAnalyticsObject || 'ga'];

function Venom(tracker, opt_config) {
	var self = this;
	typeof opt_config === 'object' || (opt_config = {});
	self.plugins = {};
	self.tempPlugins = {};
	self.events = {};
	// self.pluginSampleRate = opt_config.pluginSampleRate || false;
	// self.defaultBehavior = opt_config.defaultBehavior || false;
	// self.debug = opt_config.debug || false;
	if (opt_config.errorHandler === 'function') {
		self.errorHandler = opt_config.errorHandler;
	} else {
		self.errorHandler = function (error) {
			if (window.console && typeof console.error = 'function')
				console.error(error);
			ga('send', 'event', 'Venom Exceptions', error.name, error.message);
		};
	}

	self.util = {
		errorBuilder: safeFunction(errorBuilder),
		safeFunction: safeFunction,
		getParamURL: safeFunction(getParamURL),
		addListener: safeFunction(addListener),
		domReady: safeFunction(domReady),
		forEach: safeFunction(forEach),
		typeOf: safeFunction(typeOf)
	};

	// ====================
	// Name: Util
	// Description: Useful methods
	// ====================
	function errorBuilder(errorName, errorMessage) {
		return {
			name: errorName,
			message: errorMessage
		};
	}

	function forEach(obj, callback) {
		var length;
		var key;
		var i;

		if (!obj)
			throw util.errorBuilder('venom:util.forEach', '"obj" was not supplied');
		if (!callback)
			throw util.errorBuilder('venom:util.forEach', '"callback" was not supplied');
		if (typeof callback !== 'function')
			throw util.errorBuilder('venom:util.forEach', '"callback" is not a function');

		if (obj.length) {
			for (i = 0, length = obj.length; i < length; i++) {
				try {
					callback.call(this, obj[i], i);
				} catch (e) {
					throw util.errorBuilder('venom:util.forEach', '"callback[' + i + ']": ' + e);
				}
			}
		} else {
			for (key in obj) {
				if (obj.hasOwnProperty(key)) {
					try {
						callback.call(this, obj[key], key);
					} catch (e) {
						throw util.errorBuilder('venom:util.forEach', '"callback[' + key + ']": ' + e);
					}
				}
			}
		}
	}

	function typeOf(object) {
		return Object.prototype.toString.call(object).slice(8, -1);
	}

	// Event listener with polify
	function addListener(obj, evt, ofnc) {
		var fnc = function (event) {
			if (!event || !event.target) {
				event = window.event;
				event.target = event.srcElement;
			}
			return ofnc.call(obj, event);
		};
		// W3C model
		if (obj.addEventListener) {
			obj.addEventListener(evt, fnc);
			return true;
		}
		// M$ft model
		else if (obj.attachEvent) {
			return obj.attachEvent('on' + evt, fnc);
		}
		// Browser doesn't support W3C or M$ft model. Time to go old school
		else {
			evt = 'on' + evt;
			if (typeof obj[evt] === 'function') {
				// Object already has a function on traditional
				// Let's wrap it with our own function inside another function
				fnc = (function (f1, f2) {
					return function () {
						f1.apply(this, arguments);
						f2.apply(this, arguments);
					};
				}(obj[evt], fnc));
			}
			obj[evt] = fnc;
			return true;
		}
	}

	function getParamURL() {
		// this fn return params from URL
		var query_string = {};
		var query = window.location.search.substring(1);
		var vars = query.split("&");
		for (var i = 0; i < vars.length; i++) {
			var pair = vars[i].split("=");
			if (typeof query_string[pair[0]] === "undefined") {
				query_string[pair[0]] = pair[1];
			} else if (typeof query_string[pair[0]] === "string") {
				var arr = [query_string[pair[0]], pair[1]];
				query_string[pair[0]] = arr;
			} else {
				query_string[pair[0]].push(pair[1]);
			}
		}

		return query_string;
	}

	function domReady(callback) {
		function cb() {
			if (cb.done) return;
			cb.done = true;
			try {
				callback.apply(self, arguments);
			} catch (e) {
				throw util.errorBuilder('util:domReady', '"callback": ' + e);
			}
		}

		if (/^(interactive|complete)/.test(document.readyState)) return cb();
		util.addListener(document, 'DOMContentLoaded', cb);
		util.addListener(window, 'load', cb);
	}

	function safeFunction(fn) {
		return function () {
			try {
				fn.apply(this, arguments);
			} catch (e) {
				self.errorHandler(e);
			}
		}
	}
}

// ====================
// Name: Plugin Management System
// Description: Provides an interface for the creation (provide) and use (require) of plugins
// ====================

function provide(pluginName, plugin, opt_override) {
	if (!pluginName)
		throw util.errorBuilder('venom:provide', '"pluginName" was not supplied');
	if (!plugin)
		throw util.errorBuilder('venom:provide', '"plugin" was not supplied');
	if (typeof pluginName !== 'string')
		throw util.errorBuilder('venom:provide', '"pluginName" is not a string');
	if (typeof plugin !== 'function')
		throw util.errorBuilder('venom:provide', '"plugin" is not a function');
	if (typeof this.plugins[pluginName] !== 'undefined' && opt_override !== true)
		throw errorBuilder('venom:provide', 'Plugin "' + pluginName + '" is already defined');

	this.plugins[pluginName] = plugin;

	if (this.tempPlugins.hasOwnProperty(pluginName)) {
		util.forEach(this.tempPlugins[pluginName], function (el) {
			try {
				plugin(util, config);
			} catch (e) {
				throw util.errorBuilder('venom:provide', '"plugin[' + pluginName + ']": ' + e);
			}
		});
		this.tempPlugins[pluginName] = [];
	}
}

function require(pluginName, opt_config) {
	if (!pluginName)
		throw util.errorBuilder('venom:require', '"pluginName" was not supplied');
	if (typeof pluginName !== 'string')
		throw util.errorBuilder('venom:require', '"pluginName" is not a string');

	if (typeof this.plugins[pluginName] === 'function') {
		this.plugins[pluginName](util, config);
	} else {
		this.tempPlugins.hasOwnProperty(pluginName) || (this.tempPlugins[pluginName] = []);
		this.tempPlugins[pluginName].push(opt_config || {});
	}
}

// ====================
// Name: Event Management System
// Description: Provides an interface for the creation, removal and firing of listeners
// ====================
function on(eventName, listener, opt_scope) {
	if (!eventName)
		throw util.errorBuilder('venom:on', '"eventName" was not supplied');
	if (!listener)
		throw util.errorBuilder('venom:on', '"listener" was not supplied');
	if (typeof eventName !== 'string')
		throw util.errorBuilder('venom:on', '"eventName" is not a string');
	if (typeof listener !== 'function')
		throw util.errorBuilder('venom:on', '"listener" is not a function');

	if (opt_scope) {
		if (typeof opt_score !== 'string') {
			throw util.errorBuilder('venom:on', '"opt_scope" is not a string');
		} else {
			eventName = opt_scope + '.' + eventName;
		}
	}

	this.events.hasOwnProperty(eventName) || (this.events[eventName] = []);
	this.events[eventName].push(listener);
}

function off(eventName, removeAll) {
	if (!eventName)
		throw util.errorBuilder('venom:off', '"eventName" was not supplied');
	if (typeof eventName !== 'string')
		throw util.errorBuilder('venom:off', '"eventName" is not a string');

	if (this.events[eventName]) {
		if (removeAll)
			this.events[eventName] = [];
		else
			this.events[eventName].pop();
	}
}

function trigger(eventName, opt_data) {
	var self = this;
	if (!eventName)
		throw util.errorBuilder('venom:trigger', '"eventName" was not supplied');
	if (typeof eventName !== 'string')
		throw util.errorBuilder('venom:trigger', '"eventName" is not a string');

	if (eventName.indexOf('.') > 0) {
		util.forEach(self.events[eventName], function (listener, key) {
			try {
				listener.call(self, util, opt_data);
			} catch (e) {
				throw util.errorBuilder('venom:util.triggerScoped', '"callback[' + key + ']": ' + e);
			}
		});
	} else {
		util.forEach(self.events, function (listeners, evName) {
			var unescopedName = evName.indexOf('.') >= 0 ? evName.split('.').reverse()[0] : evName;
			if (unescopedName === eventName) {
				util.forEach(listeners, function (listener, key) {
					try {
						listener.call(self, util, opt_data);
					} catch (e) {
						throw util.errorBuilder('venom:util.triggerUnescoped', '"callback[' + key + ']": ' + e);
					}
				});
			}
		});
	}


	// ====================
	// Name: 
	// Description: 
	// ====================

	ga(safeFunction(function (tracker) {
		var task = tracker.get('sendHitTask');

		tracker.set('sendHitTask', function (data) {
			var hitType = data.get('hitType');

			if (hitType === 'pageview') {
				ga('venom:trigger', 'gaPageview', {
					page: data.get('page') || document.location.pathname,
					title: data.get('title') || document.title
				});
			} else if (hitType === 'event') {
				ga('venom:trigger', 'gaEvent', {
					eventCategory: data.get('eventCategory'),
					eventAction: data.get('eventAction'),
					eventLabel: data.get('eventLabel'),
					eventValue: data.get('eventValue'),
					page: data.get('page') || document.location.pathname
				});
			} else if (hitType === 'timing') {
				ga('venom:trigger', 'gaPageview', {
					timingCategory: data.get('timingCategory'),
					timingVar: data.get('timingVar'),
					timingValue: data.get('timingValue'),
					timingLabel: data.get('timingLabel'),
					page: data.get('page') || document.location.pathname
				});
			}

			task(data);
		});
	}));
}

// ====================
// Name: Provide
// Description: Provide as an Universal Analytics plugin
// ====================
function providePlugin(pluginName, pluginConstructor) {
	if (ga) ga('provide', pluginName, pluginConstructor);
}

function log() {
	console.log(this);
}

function get(attr, callback) {
	callback.call(this, this[attr]);
}

Venom.prototype = {
	provide: provide,
	require: require,
	trigger: trigger,
	off: off,
	on: on,
	log: log,
	get: get
};

providePlugin('venom', Venom);