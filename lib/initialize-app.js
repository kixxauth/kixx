'use strict';

const Promise = require(`bluebird`);
const App = require(`./classes/app`);
const UserError = require(`./classes/user-error`);

const {isFunction} = require(`./library`);

// Helper to run the initializers.
module.exports = function initializeApp({appdir, packageJSON, config, environment}) {
	const app = App.create({appdir, packageJSON, config, environment});
	const initializers = app.config.initializers || [];

	// Serially load initializers, passing the app object into each one.
	return initializers.reduce((promise, initializerName) => {
		const file = app.appdir.append(`initializers`, initializerName);
		const initializer = require(file.path);

		if (!isFunction(initializer)) {
			throw new UserError(
				`Intializer at ${file} is not a Function.`
			);
		}

		return promise.then((app) => {
			return Promise.resolve(initializer(app)).then((app) => {
				if (!App.isApp(app)) {
					return Promise.reject(new UserError(
						`Intializer "${initializerName}" did not return an instance of App.`
					));
				}
				return app;
			});
		});
	}, Promise.resolve(app));
};
