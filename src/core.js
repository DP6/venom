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
	typeof opt_config === 'object' || (opt_config = {});
	this.plugins = {};
	this.tempPlugins = {};
	this.events = {};
	this.pluginSampleRate = opt_config.pluginSampleRate || false;
	this.defaultBehavior = opt_config.defaultBehavior || false;
	this.errorHandler = typeof opt_config.errorHandler === 'function' ? opt_config.errorHandler : false;
	this.debug = opt_config.debug || false;
}

// ====================
// Name: Plugin Management System
// Description: Provides an interface for the creation (provide) and use (require) of plugins
// ====================

function provide(pluginName, plugin, opt_override) {
	if (!pluginName)
		throw util.ErrorBuilder('venom:provide', '"pluginName" was not supplied');
	if (!plugin)
		throw util.ErrorBuilder('venom:provide', '"plugin" was not supplied');
	if (typeof pluginName !== 'string')
		throw util.ErrorBuilder('venom:provide', '"pluginName" is not a string');
	if (typeof plugin !== 'function')
		throw util.ErrorBuilder('venom:provide', '"plugin" is not a function');
	if (typeof this.plugins[pluginName] !== 'undefined' && opt_override !== true)
		throw ErrorBuilder('venom:provide', 'Plugin is already defined');

	this.plugins[pluginName] = plugin;

	if (this.tempPlugins.hasOwnProperty(pluginName)) {
		util.forEach(this.tempPlugins[pluginName], function (el) {
			try {
				plugin(ga, util, el);
			} catch (e) {
				throw util.ErrorBuilder('venom:provide', '"plugin[' + pluginName + ']": ' + e);
			}
		});
		this.tempPlugins[pluginName] = [];
	}
}

function require(pluginName, opt_config) {
	if (!pluginName)
		throw util.ErrorBuilder('venom:require', '"pluginName" was not supplied');
	if (typeof pluginName !== 'string')
		throw util.ErrorBuilder('venom:require', '"pluginName" is not a string');

	if (typeof this.plugins[pluginName] === 'function') {
		this.plugins[pluginName](ga, util, opt_config);
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
		throw util.ErrorBuilder('venom:on', '"eventName" was not supplied');
	if (!listener)
		throw util.ErrorBuilder('venom:on', '"listener" was not supplied');
	if (typeof eventName !== 'string')
		throw util.ErrorBuilder('venom:on', '"eventName" is not a string');
	if (typeof listener !== 'function')
		throw util.ErrorBuilder('venom:on', '"listener" is not a function');

	if (opt_scope) {
		if (typeof opt_score !== 'string') {
			throw util.ErrorBuilder('venom:on', '"opt_scope" is not a string');
		} else {
			eventName = opt_scope + '.' + eventName;
		}
	}

	this.events.hasOwnProperty(eventName) || (this.events[eventName] = []);
	this.events[eventName].push(listener);
}

function off(eventName, removeAll) {
	if (!eventName)
		throw util.ErrorBuilder('venom:off', '"eventName" was not supplied');
	if (typeof eventName !== 'string')
		throw util.ErrorBuilder('venom:off', '"eventName" is not a string');

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
		throw util.ErrorBuilder('venom:trigger', '"eventName" was not supplied');
	if (typeof eventName !== 'string')
		throw util.ErrorBuilder('venom:trigger', '"eventName" is not a string');

	if (eventName.indexOf('.') > 0) {
		util.forEach(self.events[eventName], function (listener, key) {
			try {
				listener.call(self, util, opt_data);
			} catch (e) {
				throw util.ErrorBuilder('venom:util.triggerScoped', '"callback[' + key + ']": ' + e);
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
						throw util.ErrorBuilder('venom:util.triggerUnescoped', '"callback[' + key + ']": ' + e);
					}
				});
			}
		});
	}
}

// ====================
// Name: Util
// Description: Useful methods
// ====================
function ErrorBuilder(errorName, errorMessage) {
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
		throw util.ErrorBuilder('venom:util.forEach', '"obj" was not supplied');
	if (!callback)
		throw util.ErrorBuilder('venom:util.forEach', '"callback" was not supplied');
	if (typeof callback !== 'function')
		throw util.ErrorBuilder('venom:util.forEach', '"callback" is not a function');

	if (util.toString(obj) === 'Array') {
		for (i = 0, length = obj.length; i < length; i++) {
			try {
				callback(obj[i], i);
			} catch (e) {
				throw util.ErrorBuilder('venom:util.forEach', '"callback[' + i + ']": ' + e);
			}
		}
	} else {
		for (key in obj) {
			if (obj.hasOwnProperty(key)) {
				try {
					callback(obj[key], key);
				} catch (e) {
					throw util.ErrorBuilder('venom:util.forEach', '"callback[' + key + ']": ' + e);
				}
			}
		}
	}
}

function typeOf(object) {
	return Object.prototype.toString.call(object).slice(8, -1);
}

var util = {
	ErrorBuilder: ErrorBuilder,
	forEach: forEach,
	typeOf: typeOf
};

// ====================
// Name: Provide
// Description: Provide as an Universal Analytics plugin
// ====================
function providePlugin(pluginName, pluginConstructor) {
	if (ga) ga('provide', pluginName, pluginConstructor);
}

function log() {
	console.log(this);
	console.log(util);
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