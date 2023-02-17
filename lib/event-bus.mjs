import { EventEmitter } from 'node:events';
import { ProgrammerError } from 'kixx-server-errors';
import { helpers } from 'kixx-assert';

export default class EventBus extends EventEmitter {
	emit(event) {
		const name = event && event.name;

		if (helpers.isNonEmptyString(name)) {
			super.emit(name, event);
		} else {
			throw new ProgrammerError(
				'Cannot emit event object without a String `name` property',
				{ info: { event } },
				this.emit
			);
		}
	}
}
