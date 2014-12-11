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
	if (typeof opt_config !== 'object')
		opt_config = {};
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
			if (window.console && typeof console.error === 'function')
				console.error(error);
			ga('send', 'event', 'Venom Exceptions', error.name, error.message);
		};
	}

	var util = self.util = {
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
				util.errorHandler(e);
			}
		};
	}
}

// ====================
// Name: Plugin Management System
// Description: Provides an interface for the creation (provide) and use (require) of plugins
// ====================

function provide(pluginName, plugin, opt_override) {
	if (!pluginName)
		throw this.util.errorBuilder('venom:provide', '"pluginName" was not supplied');
	if (!plugin)
		throw this.util.errorBuilder('venom:provide', '"plugin" was not supplied');
	if (typeof pluginName !== 'string')
		throw this.util.errorBuilder('venom:provide', '"pluginName" is not a string');
	if (typeof plugin !== 'function')
		throw this.util.errorBuilder('venom:provide', '"plugin" is not a function');
	if (typeof this.plugins[pluginName] !== 'undefined' && opt_override !== true)
		throw this.util.errorBuilder('venom:provide', 'Plugin "' + pluginName + '" is already defined');

	this.plugins[pluginName] = plugin;

	if (this.tempPlugins.hasOwnProperty(pluginName)) {
		this.util.forEach(this.tempPlugins[pluginName], function (config) {
			try {
				plugin.call(this, this.util, config);
			} catch (e) {
				throw this.util.errorBuilder('venom:provide', '"plugin[' + pluginName + ']": ' + e);
			}
		});
		this.tempPlugins[pluginName] = [];
	}
}

function require(pluginName, opt_config) {
	if (!pluginName)
		throw this.util.errorBuilder('venom:require', '"pluginName" was not supplied');
	if (typeof pluginName !== 'string')
		throw this.util.errorBuilder('venom:require', '"pluginName" is not a string');

	if (typeof this.plugins[pluginName] === 'function') {
		this.plugins[pluginName](this.util, opt_config);
	} else {
		if (this.tempPlugins.hasOwnProperty(pluginName) === false)
			this.tempPlugins[pluginName] = [];
		this.tempPlugins[pluginName].push(opt_config || {});
	}
}

// ====================
// Name: Event Management System
// Description: Provides an interface for the creation, removal and firing of listeners
// ====================
function on(eventName, listener, opt_scope) {
	if (!eventName)
		throw this.util.errorBuilder('venom:on', '"eventName" was not supplied');
	if (!listener)
		throw this.util.errorBuilder('venom:on', '"listener" was not supplied');
	if (typeof eventName !== 'string')
		throw this.util.errorBuilder('venom:on', '"eventName" is not a string');
	if (typeof listener !== 'function')
		throw this.util.errorBuilder('venom:on', '"listener" is not a function');

	if (opt_scope) {
		if (typeof opt_scope !== 'string') {
			throw this.util.errorBuilder('venom:on', '"opt_scope" is not a string');
		} else {
			eventName = opt_scope + '.' + eventName;
		}
	}

	if (this.events.hasOwnProperty(eventName) === false)
		this.events[eventName] = [];
	this.events[eventName].push(listener);
}

function off(eventName, removeAll) {
	if (!eventName)
		throw this.util.errorBuilder('venom:off', '"eventName" was not supplied');
	if (typeof eventName !== 'string')
		throw this.util.errorBuilder('venom:off', '"eventName" is not a string');

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
		throw this.util.errorBuilder('venom:trigger', '"eventName" was not supplied');
	if (typeof eventName !== 'string')
		throw this.util.errorBuilder('venom:trigger', '"eventName" is not a string');

	if (eventName.indexOf('.') > 0) {
		this.util.forEach(self.events[eventName], function (listener, key) {
			try {
				listener.call(self, this.util, opt_data);
			} catch (e) {
				throw this.util.errorBuilder('venom:util.triggerScoped', '"callback[' + key + ']": ' + e);
			}
		});
	} else {
		this.util.forEach(self.events, function (listeners, evName) {
			var unescopedName = evName.indexOf('.') >= 0 ? evName.split('.').reverse()[0] : evName;
			if (unescopedName === eventName) {
				this.util.forEach(listeners, function (listener, key) {
					try {
						listener.call(self, this.util, opt_data);
					} catch (e) {
						throw this.util.errorBuilder('venom:util.triggerUnescoped', '"callback[' + key + ']": ' + e);
					}
				});
			}
		});
	}


	// ====================
	// Name: GA Hit Hooks
	// Description: Triggers events for GA's Pageview, Event and Timing Hits
	// ====================

	ga(this.util.safeFunction(function (tracker) {
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
function log() {
	console.log(this);
}

function get(attr, callback) {
	callback.call(this, this[attr]);
}

function safeFunction(fn) {
	var self = this;
	return function () {
		try {
			fn.apply(this, arguments);
		} catch (e) {
			self.util.errorHandler(e);
		}
	};
}

Venom.prototype = {
	provide: safeFunction(provide),
	require: safeFunction(require),
	trigger: safeFunction(trigger),
	off: safeFunction(off),
	on: safeFunction(on),
	log: safeFunction(log),
	get: safeFunction(get)
};

if (ga) ga('provide', 'venom', Venom);