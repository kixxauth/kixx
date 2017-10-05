const EventEmitter = require(`events`);
const R = require(`ramda`);

class App {
	// ### Params:
	// - spec.name *String* Usually the name attribute from package.json
	// - spec.version *String* Usually the version attribute from package.json
	// - spec.appdir *Filepath* A Filepath instance representing the application directory.
	// - spec.environment *String* Usually something like "development" or "production".
	// - spec.config *Object* Frozen Object Hash of configuration variables.
	// - spec.logger *Object*
	constructor(spec) {
		const {name, version, appdir, environment, logger, config, api, emitter} = spec;

		Object.defineProperties(this, {
			name: {
				enumerable: true,
				value: name
			},
			version: {
				enumerable: true,
				value: version
			},
			appdir: {
				enumerable: true,
				value: appdir
			},
			environment: {
				enumerable: true,
				value: environment
			},
			logger: {
				enumerable: true,
				value: logger
			},
			config: {
				enumerable: true,
				value: config
			},
			api: {
				enumerable: true,
				value: api
			},
			emitter: {
				enumerable: true,
				value: emitter || new EventEmitter()
			}
		});
	}

	// Shallowly merge in a new API property and shallowly freeze the result.
	//
	// Returns a new App instance.
	setApiKey(key, val) {
		// Make a shallow copy of .api so we can mutate.
		const api = Object.assign(Object.create(null), this.api || Object.create(null));
		api[key] = val;

		return new App(R.assoc(
			`api`,
			// Lock it down so it can't be mutated again.
			Object.freeze(api),
			this
		));
	}

	isDevMode() {
		return this.environment === `development`;
	}

	isTestMode() {
		return this.environment === `test`;
	}

	isProdMode() {
		return this.environment === `production`;
	}

	static isApp(x) {
		return x instanceof App;
	}
}

module.exports = App;
