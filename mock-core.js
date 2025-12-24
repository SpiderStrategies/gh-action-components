/**
 * Mocks the GitHub Action core API so we can inspect it during tests.
 *
 * @param {Object} [options.inputs] Key/Value pairs
 */
function mockCore(options = {}) {
	const mockCore = {
		infoMsgs: [],
		debugMsgs: [],
		warningMsgs: [],
		outputs: {},
		error: err => mockCore.errorArg = err,
		setFailed: err => mockCore.failedArg = err,
		info: msg => mockCore.infoMsgs.push(msg),
		debug: msg => mockCore.debugMsgs.push(msg),
		warning: msg => mockCore.warningMsgs.push(msg),
		getInput: name => options.inputs && options.inputs[name],
		setOutput: (name, value) => mockCore.outputs[name] = value,
		startGroup: label => mockCore.infoMsgs.push(`\n${label}\n===============================================\n`),
		endGroup: () => {}
	}
	return mockCore
}

module.exports = mockCore