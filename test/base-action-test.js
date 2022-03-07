const tap = require('tap')

const BaseAction = require('../base-action')
const mockCore = require('../mock-core')

let errorMessage

class TestAction extends BaseAction {

	async runAction() {
		if (errorMessage) {
			this.error = new Error(errorMessage)
			throw this.error
		}
	}

	async onError(err) {
		await super.onError(err);
		this.status = 'error'
	}
}

tap.test(`error handling`, async t => {
	const action = new TestAction()
	action.core = mockCore()
	errorMessage = 'simulated error'

	await action.run()

	t.equal(action.core.errorArg, action.error)
	t.equal(action.core.failedArg, action.error)
	t.equal(action.status, 'error')
})

