'use strict';

const { inspect } = require('util');
const U = require('../utils');


class Maybe {
	static isMaybe(x) {
		if (!x) return false;
		if (x instanceof Maybe) return true;

		return (x.isJust || x.isNothing || false)
			&& typeof x.map === 'function'
			&& typeof x.bimap === 'function'
			&& typeof x.chain === 'function';
	}

	static isJust(x) {
		return Maybe.isMaybe(x) && x.isJust;
	}

	static isNothing(x) {
		return Maybe.isMaybe(x) && x.isNothing;
	}

	static of(x) {
		return new Just(x);
	}
}


class Just extends Maybe {
	constructor(value) {
		super();

		Object.defineProperties(this, {
			value: { value },
			isJust: {
				enumerable: true,
				value: true
			},
			isNothing: {
				enumerable: true,
				value: false
			}
		});
	}

	inspect() {
		return `Just(${inspect(this.value)})`;
	}

	map(fn) {
		return new Just(fn(this.value));
	}

	bimap(sad, happy) {
		return new Just(happy(this.value));
	}

	chain(fn) {
		return fn(this.value);
	}

	static of(x) {
		return new Just(x);
	}
}

Just.prototype.toString = Just.prototype.inspect;


class Nothing extends Maybe {
	constructor() {
		super();

		Object.defineProperties(this, {
			isNothing: {
				enumerable: true,
				value: true
			},
			isJust: {
				enumerable: true,
				value: false
			}
		});
	}

	inspect() {
		return 'Nothing';
	}

	map() {
		return this;
	}

	bimap(sad, happy) {
		sad();
		return this;
	}

	chain() {
		return this;
	}
}

Nothing.prototype.toString = Nothing.prototype.inspect;


const maybe = U.curry(function maybe(sad, happy, a) {
	if (Maybe.isNothing(a)) {
		return sad();
	}
	if (Maybe.isJust(a)) {
		return happy(a.value);
	}

	throw new TypeError(
		`Invalid type '${U.getName(a)}' given to maybe()`
	);
});


Object.defineProperties(Maybe, {
	Just: {
		enumerable: true,
		value: Just
	},
	Nothing: {
		enumerable: true,
		value: Nothing
	},
	just: {
		enumerable: true,
		value(x) { return new Maybe.Just(x); }
	},
	nothing: {
		enumerable: true,
		value() { return new Maybe.Nothing(); }
	},
	maybe: {
		enumerable: true,
		value: maybe
	}
});

module.exports = Maybe;
