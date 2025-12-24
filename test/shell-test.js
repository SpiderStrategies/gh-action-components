const tap = require('tap')
const mockCore = require('../mock-core')
const Shell = require('../shell')

tap.test('exec', async t => {

	t.test('dry-run mode logs but does not execute', async t => {
		const core = mockCore({ inputs: { 'dry-run': 'true' } })
		const shell = new Shell(core)

		const result = await shell.exec('echo hello')

		t.equal(result, undefined, 'should return undefined in dry-run')
		t.equal(core.infoMsgs.length, 1)
		t.ok(core.infoMsgs[0].includes('dry run:'))
		t.ok(core.infoMsgs[0].includes('echo hello'))
	})

	t.test('executes command and returns trimmed stdout', async t => {
		const core = mockCore({})
		const shell = new Shell(core)

		const result = await shell.exec('echo hello')

		t.equal(result, 'hello')
		t.ok(core.infoMsgs.some(msg => msg.includes('Running:')))
	})

	t.test('throws on command failure', async t => {
		const core = mockCore({})
		const shell = new Shell(core)

		await t.rejects(
			shell.exec('exit 1'),
			'should throw on non-zero exit'
		)
	})
})

tap.test('execQuietly', async t => {

	t.test('returns result on success', async t => {
		const core = mockCore({})
		const shell = new Shell(core)

		const result = await shell.execQuietly('echo hello')

		t.equal(result, 'hello')
	})

	t.test('swallows errors and returns undefined', async t => {
		const core = mockCore({})
		const shell = new Shell(core)

		const result = await shell.execQuietly('exit 1')

		t.equal(result, undefined, 'should return undefined on error')
	})
})

