'use strict';

const { inspect } = require('util');
const { assert, helpers } = require('kixx-assert');
const sinon = require('sinon');

const Maybe = require('../../../lib/atypes/maybe');

// Create an assertion to check for a Maybe instance.
const isMaybe = helpers.assertion1(
	(x) => x instanceof Maybe,
	(actual) => `expected ${actual} to be an instance of Maybe`
);

// Create an assertion to confirm a function (sinon spy) has not been called.
const isNotCalled = helpers.assertion1(
	(x) => x.notCalled,
	(actual) => `expected not to be called, but called ${actual.callCount} times`
);

// Create an assertion to confirm a function (sinon spy) has only been called
// once, and was called with single argument a.
const isCalledOnceWith = helpers.assertion2(
	(a, x) => x.calledOnceWith(a),
	(expected, actual) => {
		const { callCount, firstCall } = actual;
		const expectedString = inspect(expected);
		const args = (firstCall || {}).args || [];
		return `expected to be called once with ${expectedString}, but called ${callCount} times with ${args}`;
	}
);


module.exports = (test) => {
	test.describe('Maybe Just properties', (t) => {
		const VALUE = Object.freeze({ VALUE: true });
		let subject;

		t.before((done) => {
			subject = Maybe.just(VALUE);
			done();
		});

		t.it('passes the type check', () => {
			assert.isOk(Maybe.isMaybe(subject));
			assert.isOk(subject instanceof Maybe.Just);
		});

		t.it('has a "private" value property', () => {
			assert.isOk(Object.prototype.hasOwnProperty.call(subject, 'value'));
			assert.isNotOk(Object.prototype.propertyIsEnumerable.call(subject, 'value'));
			assert.isEqual(VALUE, subject.value);

			try {
				subject.value = 'foo';
				assert.isOk(false, 'assigning to value throws an error');
			} catch (err) {
				assert.isOk(true, 'assigning to value throws an error');
			}
		});

		t.it('has a read-only isNothing property', () => {
			assert.isOk(Object.prototype.hasOwnProperty.call(subject, 'isNothing'));
			assert.isOk(Object.prototype.propertyIsEnumerable.call(subject, 'isNothing'));
			assert.isEqual(false, subject.isNothing);

			try {
				subject.isNothing = 'foo';
				assert.isOk(false, 'assigning to isNothing throws an error');
			} catch (err) {
				assert.isOk(true, 'assigning to isNothing throws an error');
			}
		});

		t.it('has a read-only isJust property', () => {
			assert.isOk(Object.prototype.hasOwnProperty.call(subject, 'isJust'));
			assert.isOk(Object.prototype.propertyIsEnumerable.call(subject, 'isJust'));
			assert.isEqual(true, subject.isJust);

			try {
				subject.isJust = 'foo';
				assert.isOk(false, 'assigning to isJust throws an error');
			} catch (err) {
				assert.isOk(true, 'assigning to isJust throws an error');
			}
		});
	});

	test.describe('Maybe Nothing properties', (t) => {
		let subject;

		t.before((done) => {
			subject = Maybe.nothing();
			done();
		});

		t.it('passes the type check', () => {
			assert.isOk(Maybe.isMaybe(subject));
			assert.isOk(subject instanceof Maybe.Nothing);
		});

		t.it('has a read-only isNothing property', () => {
			assert.isOk(Object.prototype.hasOwnProperty.call(subject, 'isNothing'));
			assert.isOk(Object.prototype.propertyIsEnumerable.call(subject, 'isNothing'));
			assert.isEqual(true, subject.isNothing);

			try {
				subject.isNothing = 'foo';
				assert.isOk(false, 'assigning to isNothing throws an error');
			} catch (err) {
				assert.isOk(true, 'assigning to isNothing throws an error');
			}
		});

		t.it('has a read-only isJust property', () => {
			assert.isOk(Object.prototype.hasOwnProperty.call(subject, 'isJust'));
			assert.isOk(Object.prototype.propertyIsEnumerable.call(subject, 'isJust'));
			assert.isEqual(false, subject.isJust);

			try {
				subject.isJust = 'foo';
				assert.isOk(false, 'assigning to isJust throws an error');
			} catch (err) {
				assert.isOk(true, 'assigning to isJust throws an error');
			}
		});
	});

	// Testing the map() instance method when Just.
	test.describe('Maybe as Functor on Just side', (t) => {
		// A value which has a Functor must provide a `map` method. The `map`
		// method takes one argument:
		//
		//     u.map(f)
		//
		// 1. `f` must be a function,
		//
		//     1. If `f` is not a function, the behaviour of `map` is
		//        unspecified.
		//     2. `f` can return any value.
		//     3. No parts of `f`'s return value should be checked.
		//
		// 2. `map` must return a value of the same Functor

		const VALUE = Object.freeze({ VALUE: true });

		const m = Maybe.just(VALUE);

		t.it('will take any value from f and return a Maybe', () => {
			const a = m.map((x) => x);
			isMaybe(a);
			assert.isEqual(VALUE, a.value);

			const b = m.map((x) => Object.isFrozen(x));
			isMaybe(b);
			assert.isEqual(true, b.value);

			const c = m.map(() => null);
			isMaybe(c);
			assert.isEqual(null, c.value);

			const fn = function () {};
			const d = m.map(() => fn);
			isMaybe(d);
			assert.isEqual(fn, d.value);

			const m1 = Maybe.of(1);
			const e = m.map(() => m1);
			isMaybe(e);
			assert.isEqual(m1, e.value);
		});

		t.it('follows the identity law', () => {
			const m1 = m.map((x) => x);

			assert.isDefined(m1);
			isMaybe(m1);
			assert.isEqual(m.constructor, m1.constructor);
			assert.isEqual(VALUE, m.value);
			assert.isEqual(m.value, m1.value);
		});

		t.it('follows the composition law', () => {
			function g(x) {
				return Object.keys(x).length;
			}

			function f(x) {
				return x * 10;
			}

			const m1 = m.map((x) => f(g(x)));
			const m2 = m.map(g).map(f);

			assert.isDefined(m1);
			isMaybe(m1);
			assert.isEqual(m.constructor, m1.constructor);

			assert.isDefined(m2);
			isMaybe(m2);
			assert.isEqual(m.constructor, m2.constructor);

			assert.isEqual(10, m1.value);
			assert.isEqual(m1.value, m2.value);
		});
	});

	// Testing the map() instance method when Nothing.
	test.describe('Maybe as Functor on Nothing side', (t) => {
		// A value which has a Functor must provide a `map` method. The `map`
		// method takes one argument:
		//
		//     u.map(f)
		//
		// 1. `f` must be a function,
		//
		//     1. If `f` is not a function, the behaviour of `map` is
		//        unspecified.
		//     2. `f` can return any value.
		//     3. No parts of `f`'s return value should be checked.
		//
		// 2. `map` must return a value of the same Functor

		const VAL = [];
		const m = Maybe.nothing(VAL);

		t.it('always returns a Maybe, but never calls f', () => {
			const fa = sinon.fake((x) => x);
			const a = m.map(fa);
			isMaybe(a);
			assert.isUndefined(a.value);
			isNotCalled(fa);

			const fb = sinon.fake((x) => Object.isFrozen(x));
			const b = m.map(fb);
			isMaybe(b);
			assert.isUndefined(b.value);
			isNotCalled(fb);

			const fc = sinon.fake.returns(null);
			const c = m.map(fc);
			isMaybe(c);
			assert.isUndefined(c.value);
			isNotCalled(fc);

			const fn = function () {};
			const fd = sinon.fake.returns(fn);
			const d = m.map(fd);
			isMaybe(d);
			assert.isUndefined(d.value);
			isNotCalled(fd);

			const m1 = Maybe.nothing(1);
			const fe = sinon.fake.returns(m1);
			const e = m.map(fe);
			isMaybe(e);
			assert.isUndefined(e.value);
			isNotCalled(fe);
		});

		t.it('follows the identity law', () => {
			const m1 = m.map((x) => x);

			assert.isDefined(m1);
			isMaybe(m1);
			assert.isEqual(m.constructor, m1.constructor);
			assert.isEqual(m, m1);
		});

		t.it('follows the composition law', () => {
			const g = sinon.fake(function (x) {
				return x.message;
			});

			const f = sinon.fake(function (x) {
				x.length;
			});

			const m1 = m.map((x) => f(g(x)));
			const m2 = m.map(g).map(f);

			assert.isDefined(m1);
			isMaybe(m1);
			assert.isEqual(m.constructor, m1.constructor);

			assert.isDefined(m2);
			isMaybe(m2);
			assert.isEqual(m.constructor, m2.constructor);

			assert.isUndefined(m1.value);
			assert.isEqual(m1, m2);

			// Mapping functions are never called on the Left path.
			isNotCalled(g);
			isNotCalled(f);
		});
	});

	// Test the bimap() instance method when Just
	test.describe('Maybe as Bifunctor when Just', (t) => {
		/*
		A value which has a Bifunctor must provide a `bimap` method. The `bimap`
		method takes two arguments:

		    c.bimap(f, g)

		1. `f` must be a function which returns a value

		    1. If `f` is not a function, the behaviour of `bimap` is unspecified.
		    2. `f` can return any value.
		    3. No parts of `f`'s return value should be checked.

		2. `g` must be a function which returns a value

		    1. If `g` is not a function, the behaviour of `bimap` is unspecified.
		    2. `g` can return any value.
		    3. No parts of `g`'s return value should be checked.

		3. `bimap` must return a value of the same Bifunctor.
		*/

		const VALUE = Object.freeze({ VALUE: true });
		let c;

		t.before((done) => {
			c = Maybe.just(VALUE);
			done();
		});

		t.it('will take any value from g and return a value of the same Bifunctor', () => {
			const returnValues = [
				[ 'returns null', null ],
				[ 'returns bool false', false ],
				[ 'returns bool true', true ],
				[ 'returns number', 9 ],
				[ 'returns object', VALUE ],
				[ 'returns Functor', Maybe.just(1) ]
			];

			const count = returnValues.reduce((i, [ label, val ]) => {
				const f = sinon.fake();
				const g = sinon.fake.returns(val);

				const c1 = c.bimap(f, g);

				isNotCalled(f, label);
				isCalledOnceWith(VALUE, g, label);

				isMaybe(c1, label);
				assert.isEqual(c.constructor, c1.constructor, label);
				assert.isEqual(val, c1.value, label);

				return i + 1;
			}, 0);

			assert.isEqual(returnValues.length, count);
		});

		t.it('follows the identity law', () => {
			const f = sinon.fake((x) => x);
			const g = sinon.fake((x) => x);

			const c1 = c.bimap(f, g);
			isMaybe(c1);
			assert.isEqual(c.constructor, c1.constructor);
			assert.isEqual(VALUE, c1.value);
		});

		t.it('follows the composition law', () => {
			const f = sinon.fake.returns(0);
			const g = sinon.fake.returns(1);
			const h = sinon.fake.returns(2);
			const i = sinon.fake.returns(3);

			const sad = sinon.fake((x) => {
				return f(g(x));
			});

			const happy = sinon.fake((x) => {
				return h(i(x));
			});

			const c1 = c.bimap(sad, happy);
			const c2 = c.bimap(g, i).bimap(f, h);

			isMaybe(c1);
			assert.isEqual(c.constructor, c1.constructor);
			assert.isEqual(c1.constructor, c2.constructor);
			assert.isEqual(2, c1.value);
			assert.isEqual(c1.value, c2.value);

			isNotCalled(f);
			isNotCalled(g);
			assert.isEqual(2, h.callCount);
			assert.isEqual(2, i.callCount);
		});
	});

	// Test the bimap() instance method when Nothing
	test.describe('Maybe as Bifunctor when Nothing', (t) => {
		/*
		A value which has a Bifunctor must provide a `bimap` method. The `bimap`
		method takes two arguments:

		    c.bimap(f, g)

		1. `f` must be a function which returns a value

		    1. If `f` is not a function, the behaviour of `bimap` is unspecified.
		    2. `f` can return any value.
		    3. No parts of `f`'s return value should be checked.

		2. `g` must be a function which returns a value

		    1. If `g` is not a function, the behaviour of `bimap` is unspecified.
		    2. `g` can return any value.
		    3. No parts of `g`'s return value should be checked.

		3. `bimap` must return a value of the same Bifunctor.
		*/

		let c;

		t.before((done) => {
			c = Maybe.nothing();
			done();
		});

		t.it('will take any value from f and return a value of the same Bifunctor', () => {
			const returnValues = [
				[ 'returns null', null ],
				[ 'returns bool false', false ],
				[ 'returns bool true', true ],
				[ 'returns number', 9 ],
				[ 'returns object', {} ],
				[ 'returns Functor', Maybe.just(1) ]
			];

			const count = returnValues.reduce((i, [ label, val ]) => {
				const f = sinon.fake.returns(val);
				const g = sinon.fake();

				const c1 = c.bimap(f, g);

				isNotCalled(g, label);
				assert.isEqual(1, f.callCount);

				isMaybe(c1, label);
				assert.isEqual(c.constructor, c1.constructor, label);
				assert.isUndefined(c1.value, label);

				return i + 1;
			}, 0);

			assert.isEqual(returnValues.length, count);
		});

		t.it('follows the identity law', () => {
			const f = sinon.fake((x) => x);
			const g = sinon.fake((x) => x);

			const c1 = c.bimap(f, g);
			isMaybe(c1);
			assert.isEqual(c.constructor, c1.constructor);
			assert.isUndefined(c1.value);
		});

		t.it('follows the composition law', () => {
			const f = sinon.fake.returns(0);
			const g = sinon.fake.returns(1);
			const h = sinon.fake.returns(2);
			const i = sinon.fake.returns(3);

			const sad = sinon.fake((x) => {
				return f(g(x));
			});

			const happy = sinon.fake((x) => {
				return h(i(x));
			});

			const c1 = c.bimap(sad, happy);
			const c2 = c.bimap(g, i).bimap(f, h);

			isMaybe(c1);
			assert.isEqual(c.constructor, c1.constructor);
			assert.isEqual(c1.constructor, c2.constructor);
			assert.isUndefined(c1.value);
			assert.isEqual(c1.value, c2.value);

			assert.isEqual(2, f.callCount);
			assert.isEqual(2, g.callCount);
			isNotCalled(h);
			isNotCalled(i);
		});
	});

	// Testing the chain() instance method when Just.
	test.describe('Maybe as Chain on Just side', (t) => {
		// A value which has a Chain must provide a `chain` method. The `chain`
		// method takes one argument:
		//
		//     m.chain(f)
		//
		// 1. `f` must be a function which returns a value
		//
		//     1. If `f` is not a function, the behaviour of `chain` is
		//        unspecified.
		//     2. `f` must return a value of the same Chain
		//
		// 2. `chain` must return a value of the same Chain

		const VALUE = Object.freeze({ VALUE: true });

		const m = Maybe.just(VALUE);

		t.it('accepts an Maybe from f and returns an Maybe', () => {
			const m1 = Maybe.of(9);
			isMaybe(m1);

			const m2 = m.chain(() => m1);
			isMaybe(m2);

			assert.isEqual(9, m2.value);
		});

		t.it('follows the associativity law', () => {
			function f(x) {
				return Maybe.of(Object.keys(x).length);
			}

			function g(x) {
				return Maybe.of(x * 10);
			}

			const m1 = m.chain(f).chain(g);
			const m2 = m.chain((x) => f(x).chain(g));

			assert.isDefined(m1);
			isMaybe(m1);
			assert.isEqual(m.constructor, m1.constructor);

			assert.isDefined(m2);
			isMaybe(m2);
			assert.isEqual(m.constructor, m2.constructor);

			assert.isEqual(10, m1.value);
			assert.isEqual(m1.value, m2.value);
		});
	});

	// Testing the chain() instance method when Nothing.
	test.describe('Maybe as Chain on Nothing side', (t) => {
		// A value which has a Chain must provide a `chain` method. The `chain`
		// method takes one argument:
		//
		//     m.chain(f)
		//
		// 1. `f` must be a function which returns a value
		//
		//     1. If `f` is not a function, the behaviour of `chain` is
		//        unspecified.
		//     2. `f` must return a value of the same Chain
		//
		// 2. `chain` must return a value of the same Chain

		const VAL = [];

		const m = Maybe.nothing(VAL);

		t.it('accepts an Maybe from f and returns an Maybe', () => {
			const m1 = Maybe.nothing(9);
			isMaybe(m1);

			const fn = sinon.fake.returns(m1);

			const m2 = m.chain(fn);
			isMaybe(m2);

			assert.isUndefined(m2.value);
			assert.isEqual(m, m2);
		});

		t.it('follows the associativity law', () => {
			const f = sinon.fake.returns(null);
			const g = sinon.fake.returns(null);

			const m1 = m.chain(f).chain(g);
			const m2 = m.chain((x) => f(x).chain(g));

			assert.isDefined(m1);
			isMaybe(m1);
			assert.isEqual(m.constructor, m1.constructor);

			assert.isDefined(m2);
			isMaybe(m2);
			assert.isEqual(m.constructor, m2.constructor);

			assert.isUndefined(m1.value);
			assert.isEqual(m1, m2);

			// Mapping functions are never called in the Left path.
			isNotCalled(f);
			isNotCalled(g);
		});
	});

	test.describe('Maybe.isMaybe() as expected', (t) => {
		t.it('returns true', () => {
			assert.isEqual(true, Maybe.isMaybe(Maybe.of(false)));
			assert.isEqual(true, Maybe.isMaybe(Maybe.just(null)));
			assert.isEqual(true, Maybe.isMaybe(Maybe.nothing(true)));
		});
	});

	test.describe('Maybe.isMaybe(a) when a is falsy', (t) => {
		t.it('returns false', () => {
			assert.isEqual(false, Maybe.isMaybe(null));
			assert.isEqual(false, Maybe.isMaybe(false));
			assert.isEqual(false, Maybe.isMaybe(0));
			assert.isEqual(false, Maybe.isMaybe(NaN));
			assert.isEqual(false, Maybe.isMaybe());
		});
	});

	test.describe('Maybe.isMaybe(a) when a.map is falsy', (t) => {
		t.it('returns false', () => {
			assert.isEqual(false, Maybe.isMaybe({
				isJust: true,
				bimap() {},
				chain() {}
			}));
		});
	});

	test.describe('Maybe.isMaybe(a) when a.bimap is falsy', (t) => {
		t.it('returns false', () => {
			assert.isEqual(false, Maybe.isMaybe({
				isJust: true,
				map() {},
				chain() {}
			}));
		});
	});

	test.describe('Maybe.isMaybe(a) when a.chain is falsy', (t) => {
		t.it('returns false', () => {
			assert.isEqual(false, Maybe.isMaybe({
				isJust: true,
				map() {},
				bimap() {}
			}));
		});
	});

	test.describe('Maybe.isMaybe(a) when a without isJust or isNothing prop', (t) => {
		t.it('returns false', () => {
			assert.isEqual(false, Maybe.isMaybe({
				isNothing: false,
				isJust: false,
				map() {},
				bimap() {},
				chain() {}
			}));
		});
	});

	test.describe('Maybe.isMaybe(a) when a.isJust only prop', (t) => {
		t.it('returns false', () => {
			assert.isEqual(true, Maybe.isMaybe({
				isJust: true,
				map() {},
				bimap() {},
				chain() {}
			}));
		});
	});

	test.describe('Maybe.isMaybe(a) when a.isNothing only prop', (t) => {
		t.it('returns false', () => {
			assert.isEqual(true, Maybe.isMaybe({
				isNothing: true,
				map() {},
				bimap() {},
				chain() {}
			}));
		});
	});

	test.describe('Maybe.isNothing(a) when a is Nothing', (t) => {
		t.it('returns true', () => {
			assert.isEqual(true, Maybe.isNothing(Maybe.nothing({})));
		});
	});

	test.describe('Maybe.isNothing(a) when a is Just', (t) => {
		t.it('returns false', () => {
			assert.isEqual(false, Maybe.isNothing(Maybe.just({})));
		});
	});

	test.describe('Maybe.isNothing(a) when a not Maybe', (t) => {
		t.it('returns false', () => {
			assert.isEqual(false, Maybe.isNothing({}));
		});
	});

	test.describe('Maybe.isJust(a) when a is Just', (t) => {
		t.it('returns true', () => {
			assert.isEqual(true, Maybe.isJust(Maybe.just({})));
		});
	});

	test.describe('Maybe.isJust(a) when a is Nothing', (t) => {
		t.it('returns false', () => {
			assert.isEqual(false, Maybe.isJust(Maybe.nothing({})));
		});
	});

	test.describe('Maybe.isJust(a) when a not Maybe', (t) => {
		t.it('returns false', () => {
			assert.isEqual(false, Maybe.isJust({}));
		});
	});

	test.describe('Maybe.maybe(), with nothing value,', (t) => {
		t.it('calls the left callback and returns the result', () => {
			const VAL1 = {};
			const VAL2 = {};

			const sad = sinon.fake.returns(VAL2);
			const happy = sinon.fake();

			const res = Maybe.maybe(sad, happy, Maybe.nothing(VAL1));

			assert.isEqual(1, sad.callCount);
			assert.isEqual(0, happy.callCount);

			assert.isUndefined(sad.firstCall.args[0]);
			assert.isEqual(VAL2, res);
		});
	});

	test.describe('Maybe.maybe(), with just value,', (t) => {
		t.it('calls the right callback and returns the result', () => {
			const VAL1 = {};
			const VAL2 = {};

			const happy = sinon.fake.returns(VAL2);
			const sad = sinon.fake();

			const res = Maybe.maybe(sad, happy, Maybe.just(VAL1));

			assert.isEqual(1, happy.callCount);
			assert.isEqual(0, sad.callCount);

			assert.isEqual(VAL1, happy.firstCall.args[0]);
			assert.isEqual(VAL2, res);
		});
	});

	test.describe('Maybe.maybe(), with invalid value,', (t) => {
		t.it('throws', () => {
			const happy = sinon.fake();
			const sad = sinon.fake();

			try {
				Maybe.maybe(sad, happy, {});
				assert.isOk(false, 'should throw');
			} catch (err) {
				assert.isEqual("Invalid type 'Object' given to maybe()", err.message);
			}

			assert.isEqual(0, happy.callCount);
			assert.isEqual(0, sad.callCount);
		});
	});
};
