const tap = require('tap')
const mockCore = require('../mock-core')
const GitHubClient = require('../github-client')

tap.test('octokit lazy initialization', async t => {

	t.test('throws error when repo-token not provided', async t => {
		const core = mockCore({})
		const gh = new GitHubClient({ core })

		t.throws(() => gh.octokit, /repo-token input is required/, 'should throw when token missing')
	})

	t.test('initializes octokit when repo-token provided', async t => {
		const core = mockCore({ inputs: { 'repo-token': 'test-token' } })
		const mockGithub = {
			getOctokit: (token) => {
				t.equal(token, 'test-token', 'should use provided token')
				return { rest: { pulls: {}, issues: {} } }
			}
		}

		const gh = new GitHubClient({ core, github: mockGithub })
		const octokit = gh.octokit

		t.ok(octokit, 'should return octokit instance')
		t.ok(octokit.rest, 'should have rest API')
	})

	t.test('caches octokit instance', async t => {
		let callCount = 0
		const core = mockCore({ inputs: { 'repo-token': 'test-token' } })
		const mockGithub = {
			getOctokit: () => {
				callCount++
				return { rest: { pulls: {}, issues: {} } }
			}
		}

		const gh = new GitHubClient({ core, github: mockGithub })
		const first = gh.octokit
		const second = gh.octokit

		t.equal(callCount, 1, 'should only create octokit once')
		t.equal(first, second, 'should return same instance')
	})
})

tap.test('repo property', async t => {
	const mockGithub = {
		context: {
			payload: {
				repository: {
					owner: { login: 'test-owner' },
					name: 'test-repo'
				}
			}
		}
	}

	const gh = new GitHubClient({ github: mockGithub })
	const repo = gh.repo

	t.equal(repo.owner, 'test-owner', 'should extract owner')
	t.equal(repo.repo, 'test-repo', 'should extract repo name')
})

tap.test('fetchCommits', async t => {
	const core = mockCore({ inputs: { 'repo-token': 'test-token' } })
	const mockGithub = {
		context: {
			payload: {
				repository: {
					owner: { login: 'test-owner' },
					name: 'test-repo'
				}
			}
		},
		getOctokit: () => ({
			rest: {
				pulls: {
					listCommits: async (opts) => {
						t.equal(opts.owner, 'test-owner', 'should use correct owner')
						t.equal(opts.repo, 'test-repo', 'should use correct repo')
						t.equal(opts.pull_number, 123, 'should use correct PR number')
						return { data: [{ sha: 'abc123' }] }
					}
				}
			}
		})
	}

	const gh = new GitHubClient({ core, github: mockGithub })
	const result = await gh.fetchCommits(123)

	t.ok(result.data, 'should return commits data')
	t.equal(result.data.length, 1, 'should have commits')
})

tap.test('createIssue', async t => {
	const core = mockCore({ inputs: { 'repo-token': 'test-token' } })
	const mockGithub = {
		context: {
			payload: {
				repository: {
					owner: { login: 'test-owner' },
					name: 'test-repo'
				}
			}
		},
		getOctokit: () => ({
			rest: {
				issues: {
					create: async (opts) => {
						t.equal(opts.owner, 'test-owner', 'should use correct owner')
						t.equal(opts.repo, 'test-repo', 'should use correct repo')
						t.equal(opts.title, 'Test Issue', 'should use provided title')
						t.equal(opts.milestone, 5, 'should use provided milestone')
						t.same(opts.labels, ['bug', 'urgent'], 'should use provided labels')
						return { data: { number: 456, html_url: 'https://github.com/test/issue/456' } }
					}
				}
			}
		})
	}

	const gh = new GitHubClient({ core, github: mockGithub })
	const result = await gh.createIssue({
		title: 'Test Issue',
		milestone: 5,
		labels: ['bug', 'urgent']
	})

	t.equal(result.data.number, 456, 'should return issue number')
	t.ok(result.data.html_url, 'should return issue URL')
})

