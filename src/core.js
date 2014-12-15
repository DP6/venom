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
	self.util = util;
	// self.pluginSampleRate = opt_config.pluginSampleRate || false;
	// self.defaultBehavior = opt_config.defaultBehavior || false;
	// self.debug = opt_config.debug || false;
	if (opt_config.errorHandler === 'function') {
		self.errorHandler = opt_config.errorHandler;
	} else {
		self.errorHandler = function (error) {
			if (window.console && typeof console.error === 'function')
				console.error(error.name + '\n' + error.message);
			ga('send', 'event', 'Venom Exceptions', error.name, error.message);
		};
	}
	self.util.errorHandler = self.errorHandler;
}

// ====================
// Name: Util
// Description: Useful methods
// ====================
var util = {};

util.errorBuilder = function (errorName, errorMessage) {
	return {
		name: errorName,
		message: errorMessage
	};
};

util.bind = function (fn, context) {
	var args, proxy, tmp, guid = 1;

	if (typeof context === "string") {
		tmp = fn[context];
		context = fn;
		fn = tmp;
	}

	// Quick check to determine if target is callable, in the spec
	// this throws a TypeError, but we will just return undefined.
	if (typeof fn !== 'function') {
		return undefined;
	}

	// Simulated bind
	args = Array.prototype.slice.call(arguments, 2);
	proxy = function () {
		return fn.apply(context || this, args.concat(Array.prototype.slice.call(arguments)));
	};

	// Set the guid of unique handler to the same of original handler, so it can be removed
	proxy.guid = fn.guid = fn.guid || guid++;

	return proxy;
};

util.forEach = function (obj, callback) {
	var self = this;
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
			self.safeFunction(callback).call(self, obj[i], i);
		}
	} else {
		for (key in obj) {
			if (obj.hasOwnProperty(key)) {
				self.safeFunction(callback).call(self, obj[key], key);
			}
		}
	}
};

util.typeOf = function (object) {
	return Object.prototype.toString.call(object).slice(8, -1);
};

// Event listener with polify
util.addListener = function (obj, evt, ofnc) {
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
			// Object already has a util.on = function traditional
			// Let's wrap it with our own util.inside = function another function
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
};

util.getParamURL = function () {
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
};

util.domReady = function (callback) {
	function cb() {
		if (cb.done) return;
		cb.done = true;
		try {
			callback.apply(null, arguments);
		} catch (e) {
			throw util.errorBuilder('util:domReady', '"callback": ' + e);
		}
	}

	if (/^(interactive|complete)/.test(document.readyState)) return cb();
	util.addListener(document, 'DOMContentLoaded', cb);
	util.addListener(window, 'load', cb);
};

util.safeFunction = function (fn) {
	return function () {
		try {
			fn.apply(this, arguments);
		} catch (e) {
			if (window.venomErrorHandler)
				window.venomErrorHandler(e);
		}
	};
};

Venom.prototype.safeFunction = util.safeFunction;

// ====================
// Name: Plugin Management System
// Description: Provides an interface for the creation (provide) and use (require) of plugins
// ====================
Venom.prototype.provide = util.safeFunction(function (pluginName, plugin, opt_override) {
	var self = this;
	if (!pluginName)
		throw self.util.errorBuilder('venom:provide', '"pluginName" was not supplied');
	if (!plugin)
		throw self.util.errorBuilder('venom:provide', '"plugin" was not supplied');
	if (typeof pluginName !== 'string')
		throw self.util.errorBuilder('venom:provide', '"pluginName" is not a string');
	if (typeof plugin !== 'function')
		throw self.util.errorBuilder('venom:provide', '"plugin" is not a function');
	if (typeof self.plugins[pluginName] !== 'undefined' && opt_override !== true)
		throw self.util.errorBuilder('venom:provide', 'Plugin "' + pluginName + '" is already defined');

	self.plugins[pluginName] = self.safeFunction(plugin);

	if (self.tempPlugins.hasOwnProperty(pluginName)) {
		self.util.forEach(self.tempPlugins[pluginName], function (config) {
			try {
				plugin.call(self, self.util, config);
			} catch (e) {
				throw self.util.errorBuilder('venom:provide', '"plugin[' + pluginName + ']": ' + e);
			}
		});
		self.tempPlugins[pluginName] = [];
	}
});

Venom.prototype.require = util.safeFunction(function (pluginName, opt_config) {
	var self = this;
	if (!pluginName)
		throw self.util.errorBuilder('venom:require', '"pluginName" was not supplied');
	if (typeof pluginName !== 'string')
		throw self.util.errorBuilder('venom:require', '"pluginName" is not a string');

	if (typeof self.plugins[pluginName] === 'function') {
		self.plugins[pluginName].call(self, self.util, opt_config);
	} else {
		if (self.tempPlugins.hasOwnProperty(pluginName) === false)
			self.tempPlugins[pluginName] = [];
		self.tempPlugins[pluginName].push(opt_config || {});
	}
});

// ====================
// Name: Event Management System
// Description: Provides an interface for the creation, removal and firing of listeners
// ====================
Venom.prototype.on = util.safeFunction(function (eventName, listener, opt_scope) {
	var self = this;
	if (!eventName)
		throw self.util.errorBuilder('venom:on', '"eventName" was not supplied');
	if (!listener)
		throw self.util.errorBuilder('venom:on', '"listener" was not supplied');
	if (typeof eventName !== 'string')
		throw self.util.errorBuilder('venom:on', '"eventName" is not a string');
	if (typeof listener !== 'function')
		throw self.util.errorBuilder('venom:on', '"listener" is not a function');

	if (opt_scope) {
		if (typeof opt_scope !== 'string') {
			throw self.util.errorBuilder('venom:on', '"opt_scope" is not a string');
		} else {
			eventName = opt_scope + '.' + eventName;
		}
	}

	if (self.events.hasOwnProperty(eventName) === false)
		self.events[eventName] = [];
	self.events[eventName].push(listener);
});

Venom.prototype.off = util.safeFunction(function (eventName, removeAll) {
	var self = this;
	if (!eventName)
		throw self.util.errorBuilder('venom:off', '"eventName" was not supplied');
	if (typeof eventName !== 'string')
		throw self.util.errorBuilder('venom:off', '"eventName" is not a string');

	if (self.events[eventName]) {
		if (removeAll)
			self.events[eventName] = [];
		else
			self.events[eventName].pop();
	}
});

Venom.prototype.trigger = util.safeFunction(function (eventName, opt_data) {
	var self = this;
	if (!eventName)
		throw self.util.errorBuilder('venom:trigger', '"eventName" was not supplied');
	if (typeof eventName !== 'string')
		throw self.util.errorBuilder('venom:trigger', '"eventName" is not a string');

	if (eventName.indexOf('.') > 0) {
		self.util.forEach(self.events[eventName], function (listener, key) {
			try {
				listener.call(self, self.util, opt_data);
			} catch (e) {
				throw self.errorBuilder('venom:util.triggerScoped', '"callback[' + key + ']": ' + e);
			}
		});
	} else {
		self.util.forEach(self.events, function (listeners, evName) {
			var unescopedName = evName.indexOf('.') >= 0 ? evName.split('.').reverse()[0] : evName;
			if (unescopedName === eventName && listeners) {
				self.util.forEach(listeners, function (listener, key) {
					try {
						listener.call(self, self.util, opt_data);
					} catch (e) {
						throw self.util.errorBuilder('venom:util.triggerUnescoped', '"callback[' + key + ']": ' + e);
					}
				});
			}
		});
	}
});

// ====================
// Name: Provide
// Description: Provide as an Universal Analytics plugin
// ====================
Venom.prototype.log = function () {
	console.log(this);
};

Venom.prototype.get = util.safeFunction(function (attr, callback) {
	if (!attr)
		throw util.errorBuilder('venom:get', '"attr" was not supplied');
	if (!callback)
		throw util.errorBuilder('venom:get', '"callback" was not supplied');
	if (typeof attr !== 'string')
		throw util.errorBuilder('venom:get', '"attr" is not a string');
	if (typeof callback !== 'function')
		throw util.errorBuilder('venom:get', '"callback" is not a function');

	this.safeFunction(callback).call(this, this[attr]);
});

if (!ga) {
	window.ga = function () {
		window.ga.q.push(arguments);
	};
	window.ga.q = [];
	window.ga.l = new Date().getTime();
}


ga('provide', 'venom', Venom);