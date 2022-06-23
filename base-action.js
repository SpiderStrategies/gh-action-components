const util = require('util')
const exec = util.promisify(require('child_process').exec)
const {writeFile} = require('fs/promises')

const github = require('@actions/github')
const context = github.context;
const { repository } = context.payload

// If the event has a repository extract the attributes
let repoOwnerParams = {}
if (repository) {
	repoOwnerParams = {
		owner: repository.owner.login,
		repo: repository.name
	}
}

/**
 * Common operations actions will invoke upon an instance of an action
 */
class BaseAction {

	constructor() {
		// https://github.com/actions/toolkit/tree/main/packages/core#annotations
		this.core = require('@actions/core')

		// Setup Octokit
		const repoToken = this.core.getInput('repo-token')
		if (repoToken) {
			this.octokit = github.getOctokit(repoToken)
		}
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
	 * Executes a command using FS.exec and performs logging and dry run logic.
	 *
	 * @param cmd
	 *
	 * @returns {Promise<string>}
	 */
	async exec(cmd) {
		if (this.core.getInput('dry-run')) {
			this.core.info(`dry run: ${cmd}`)
		} else {
			this.core.info(`Running: ${cmd}`)
			const { stdout, stderr } = await exec(cmd);
			if (stderr) {
				this.core.info(stderr)
			}
			return stdout.toString().trim()
		}
	}

	async execQuietly(cmd) {
		try {
			return await this.exec(cmd)
		} catch(e) {}
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
		if (this.octokit && repoOwnerParams) {
			const allOptions = {...repoOwnerParams, ...opts}
			this.core.debug(`Invoking octokit rest api ${label}: ${JSON.stringify(opts)}`)
			return await apiFn(this.octokit.rest, allOptions)
		} else {
			throw new Error(`octokit is not initialized! Did the action specify the required 'repo-token'?`)
		}
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
		// Write to a file to avoid escaping nightmares
		await writeFile('.commitmsg', message)
		let options = `--file=.commitmsg`
		if (author) {
			options += ` --author "${author.name} <${author.email}>"`
		}
		await this.exec(`git commit ${options}`)
		await this.exec(`git push`)
	}

	async createBranch(name, sha) {
		await this.exec(`git checkout -b ${name} ${sha}`)
		await this.exec(`git push --set-upstream origin ${name}`)
	}

	async deleteBranch(name) {
		return this.execQuietly(`git push origin --delete ${name}`)
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