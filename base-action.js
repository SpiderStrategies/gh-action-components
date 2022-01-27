const util = require('util')
const exec = util.promisify(require('child_process').exec)


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
				core.warning(stderr)
			}
			return stdout.toString().trim()
		}
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


}

module.exports = BaseAction