const util = require('util')
const exec = util.promisify(require('child_process').exec)
const {writeFile} = require('fs/promises')

const core = require('@actions/core')
const github = require('@actions/github')

const dryRun = core.getInput('dry-run');
const context = github.context;
const { repository } = context.payload

// Setup Octokit
let octokit
const repoToken = core.getInput('repo-token')
if (repoToken) {
	octokit = github.getOctokit(repoToken)
}
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

	/**
	 * Runs the action
	 * @returns {Promise<void>}
	 */
	async run() {
		return this.runAction().catch(err => {
			core.error(err)
			core.setFailed(err)
		})
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
		if (dryRun) {
			core.info(`dry run: ${cmd}`)
		} else {
			core.info(`Running: ${cmd}`)
			const { stdout, stderr } = await exec(cmd);
			if (stderr) {
				core.info(stderr)
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
	 * @returns {Promise<void>}
	 */
	async execRest(apiFn, opts, label = '') {
		if (octokit && repoOwnerParams) {
			const allOptions = {...repoOwnerParams, ...opts}
			core.debug(`Invoking octokit rest api ${label}: ${JSON.stringify(opts)}`)
			return await apiFn(octokit.rest, allOptions)
		} else {
			throw new Error(`octokit is not initialized! Did the action specify the required 'repo-token'?`)
		}
	}

	async commit(message) {
		// Write to a file to avoid escaping nightmares
		await writeFile('.commitmsg', message)
		await this.exec(`git commit --file=.commitmsg`)
		await this.exec(`git push`)
	}

	async createBranch(name, message, sha) {
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
		core.warning(`${prefix}:\n`,
			`status: ${status}\n`,
			`stack: ${stack}\n`,
			`stdout: ${stdout.toString()}`
		)
	}

}

module.exports = BaseAction