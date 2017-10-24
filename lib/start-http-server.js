'use strict';

// TODO: Peer dependency on bluebird.
const Promise = require(`bluebird`);
const {createServer} = require(`http`);

exports.start = function start(handler, port, hostname) {
	return new Promise((resolve, reject) => {
		const server = createServer(handler);
		let listening = false;

		server.on(`error`, (err) => {
			// Handle specific listen errors with friendly messages
			if (err.code === `EACCES`) {
				err = new Error(`port ${port} requires elevated privileges`);
			} else if (err.code === `EADDRINUSE`) {
				err = new Error(`port ${port} is already in use`);
			}

			if (listening) {
				throw err;
			} else {
				reject(err);
			}
		});

		server.on(`listening`, () => {
			listening = true;
			resolve(server);
		});

		server.listen(port, hostname);
	});
};
