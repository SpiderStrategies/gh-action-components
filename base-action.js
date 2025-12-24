const Shell = require('./shell')
const GitHubClient = require('./github-client')
const Git = require('./git')

/**
 * Common operations actions will invoke upon an instance of an action.
 *
 * This class provides a template method pattern (run/runAction/onError)
 * and convenience methods for git operations.
 *
 * New code should prefer using Shell, GitHubClient, and Git directly for
 * cleaner dependency injection. BaseAction is maintained for backward
 * compatibility with existing actions.
 */
class BaseAction {

	constructor() {
		// Any contextual state can be added here (e.g. list of commits for a PR)
		this.context = {}

		// Core is the foundation - logging and inputs
		this.core = require('@actions/core')

		// Create component instances
		this.shell = new Shell(this.core)
		this.gh = new GitHubClient()
		this.git = new Git(this.shell)

		// Expose octokit for backward compatibility (lazy - accessed via gh)
		Object.defineProperty(this, 'octokit', {
			get: () => this.gh.octokit
		})
	}

	/**
	 * Runs the action
	 * @returns {Promise<void>}
	 */
	async run() {
		return this.runAction().catch(async err => await this.onError(err))
	}

	/**
	 * Subclasses can override this function to do additional actions when an
	 * (uncaught) error occurs.
	 *
	 * @param err
	 * @returns {Promise<void>}
	 */
	async onError(err) {
		this.core.error(err)
		this.core.setFailed(err)
	}

	/**
	 * Performs the action's work
	 * @returns {Promise<void>}
	 */
	async runAction() {
		throw new Error('Subclasses must implement runAction')
	}

	/**
	 * Executes a command using shell and performs logging and dry run logic.
	 *
	 * @param cmd
	 * @returns {Promise<string>}
	 */
	async exec(cmd) {
		return this.shell.exec(cmd)
	}

	/**
	 * Executes a command, suppressing any errors.
	 *
	 * @param cmd
	 * @returns {Promise<string|undefined>}
	 */
	async execQuietly(cmd) {
		return this.shell.execQuietly(cmd)
	}

	/**
	 * Make a GitHub API request using the octokit instance.
	 * If the action did not specify a 'repo-token' input this will fail.
	 *
	 * @param {Function} apiFn (octokit.rest, opts) => {}
	 * @param {Object} opts The options to apply to the api call in addition to the base options
	 * @param {String} [label=''] Optionally label the operation in the log output
	 * @returns {Promise}
	 */
	async execRest(apiFn, opts, label = '') {
		if (!this.octokit) {
			throw new Error('octokit is not initialized! Did the action specify the required \'repo-token\'?')
		}
		const allOptions = { ...this.gh.repo, ...opts }
		this.core.debug(`Invoking octokit rest api ${label}: ${JSON.stringify(opts)}`)
		return await apiFn(this.octokit.rest, allOptions)
	}

	/**
	 * Fetches the commits for a prNumber and stores them in the action context
	 *
	 * @param prNumber
	 * @returns {Promise<*>}
	 */
	async fetchCommits(prNumber) {
		if (this.context.commits) {
			return this.context.commits
		}
		this.context.commits = await this.gh.fetchCommits(prNumber)
		return this.context.commits
	}

	/**
	 *
	 * @param {String} message
	 * @param {Object} [author]
	 * @param {String} [author.name]
	 * @param {String} [author.email]
	 * @returns {Promise<void>}
	 */
	async commit(message, author) {
		return this.git.commit(message, author)
	}

	async createBranch(name, sha) {
		return this.git.createBranch(name, sha)
	}

	async deleteBranch(name) {
		return this.git.deleteBranch(name)
	}

	async logError(e, prefix = 'Error Detected') {
		// the stack has the stderr output in it, so we don't want to log the full
		// error object or we get buffers and redundant information
		const { stack, status, stdout = {} } = e
		this.core.warning(`${prefix}:\n`,
			`status: ${status}\n`,
			`stack: ${stack}\n`,
			`stdout: ${stdout.toString()}`
		)
	}

	// Doesn't look like the core groups work in conjunction with the private
	// action (nick-invision/private-action-loader@v3)
	startGroup(label) {
		// this.core.startGroup(label);
		this.core.info(`\n${label}\n===============================================\n`)
	}

	endGroup() {  /*this.core.endGroup()*/ }
}

module.exports = BaseAction
