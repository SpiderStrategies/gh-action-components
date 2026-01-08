const tap = require('tap')
const mockCore = require('../mock-core')
const Git = require('../git')
const Shell = require('../shell')

tap.test('commit', async t => {

	t.test('commits with message and author', async t => {
		const execCalls = []
		const core = mockCore({})
		const shell = new Shell(core)
		shell.exec = async (cmd) => {
			execCalls.push(cmd)
			return ''
		}

		const git = new Git(shell)
		await git.commit('Test commit message', {
			name: 'Test User',
			email: 'test@example.com'
		})

		t.ok(execCalls.find(c => c.includes('git commit --file=.commitmsg')), 'should commit')
		t.ok(execCalls.find(c => c.includes('--author "Test User <test@example.com>"')), 'should use author')
		t.ok(execCalls.find(c => c === 'git push'), 'should push')
	})

	t.test('commits without author', async t => {
		const execCalls = []
		const core = mockCore({})
		const shell = new Shell(core)
		shell.exec = async (cmd) => {
			execCalls.push(cmd)
			return ''
		}

		const git = new Git(shell)
		await git.commit('Test commit message')

		t.ok(execCalls.find(c => c.includes('git commit --file=.commitmsg')), 'should commit')
		t.notOk(execCalls.find(c => c.includes('--author')), 'should not include author')
		t.ok(execCalls.find(c => c === 'git push'), 'should push')
	})
})

tap.test('createBranch', async t => {
	const execCalls = []
	const core = mockCore({})
	const shell = new Shell(core)
	shell.exec = async (cmd) => {
		execCalls.push(cmd)
		return ''
	}

	const git = new Git(shell)
	await git.createBranch('feature-branch', 'abc123')

	t.ok(execCalls.find(c => c === 'git checkout -b feature-branch abc123'), 'should create branch')
	t.ok(execCalls.find(c => c === 'git push --set-upstream origin feature-branch'), 'should push with upstream')
})

tap.test('deleteBranch', async t => {
	const execCalls = []
	const core = mockCore({})
	const shell = new Shell(core)
	shell.execQuietly = async (cmd) => {
		execCalls.push(cmd)
		return ''
	}

	const git = new Git(shell)
	await git.deleteBranch('old-branch')

	t.ok(execCalls.find(c => c === 'git push origin --delete old-branch'), 'should delete branch')
})

tap.test('checkout', async t => {
	const execCalls = []
	const core = mockCore({})
	const shell = new Shell(core)
	shell.exec = async (cmd) => {
		execCalls.push(cmd)
		return ''
	}

	const git = new Git(shell)
	await git.checkout('main')

	t.ok(execCalls.find(c => c === 'git checkout main'), 'should checkout branch')
})

tap.test('pull', async t => {
	const execCalls = []
	const core = mockCore({})
	const shell = new Shell(core)
	shell.exec = async (cmd) => {
		execCalls.push(cmd)
		return ''
	}

	const git = new Git(shell)
	await git.pull()

	t.ok(execCalls.find(c => c === 'git pull'), 'should pull')
})

tap.test('merge', async t => {

	t.test('merges with options', async t => {
		const execCalls = []
		const core = mockCore({})
		const shell = new Shell(core)
		shell.exec = async (cmd) => {
			execCalls.push(cmd)
			return ''
		}

		const git = new Git(shell)
		await git.merge('abc123', '--no-ff --no-commit')

		t.ok(execCalls.find(c => c === 'git merge abc123 --no-ff --no-commit'), 'should merge with options')
	})

	t.test('merges without options', async t => {
		const execCalls = []
		const core = mockCore({})
		const shell = new Shell(core)
		shell.exec = async (cmd) => {
			execCalls.push(cmd)
			return ''
		}

		const git = new Git(shell)
		await git.merge('def456')

		t.ok(execCalls.find(c => c === 'git merge def456'), 'should merge without options')
	})
})

tap.test('reset', async t => {

	t.test('resets with default mode', async t => {
		const execCalls = []
		const core = mockCore({})
		const shell = new Shell(core)
		shell.exec = async (cmd) => {
			execCalls.push(cmd)
			return ''
		}

		const git = new Git(shell)
		await git.reset('HEAD~1')

		t.ok(execCalls.find(c => c === 'git reset --hard HEAD~1'), 'should reset hard by default')
	})

	t.test('resets with custom mode', async t => {
		const execCalls = []
		const core = mockCore({})
		const shell = new Shell(core)
		shell.exec = async (cmd) => {
			execCalls.push(cmd)
			return ''
		}

		const git = new Git(shell)
		await git.reset('HEAD~1', '--soft')

		t.ok(execCalls.find(c => c === 'git reset --soft HEAD~1'), 'should reset with custom mode')
	})
})

tap.test('configureIdentity', async t => {
	const execCalls = []
	const core = mockCore({})
	const shell = new Shell(core)
	shell.exec = async (cmd) => {
		execCalls.push(cmd)
		return ''
	}

	const git = new Git(shell)
	await git.configureIdentity('Test User', 'test@example.com')

	t.ok(execCalls.find(c => c === 'git config user.email "test@example.com"'), 'should set email')
	t.ok(execCalls.find(c => c === 'git config user.name "Test User"'), 'should set name')
})

tap.test('push', async t => {

	t.test('pushes with arguments', async t => {
		const execCalls = []
		const core = mockCore({})
		const shell = new Shell(core)
		shell.exec = async (cmd) => {
			execCalls.push(cmd)
			return ''
		}

		const git = new Git(shell)
		await git.push('--force origin my-branch')

		t.ok(execCalls.find(c => c === 'git push --force origin my-branch'), 'should push with arguments')
	})

	t.test('pushes without arguments', async t => {
		const execCalls = []
		const core = mockCore({})
		const shell = new Shell(core)
		shell.exec = async (cmd) => {
			execCalls.push(cmd)
			return ''
		}

		const git = new Git(shell)
		await git.push()

		t.ok(execCalls.find(c => c === 'git push'), 'should push without arguments')
	})
})
