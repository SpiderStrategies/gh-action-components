const util = require('util')
const execAsync = util.promisify(require('child_process').exec)

/**
 * Shell provides a clean interface for executing shell commands with logging.
 *
 * Core is bound at construction time, eliminating the need to pass it on every call.
 */
class Shell {

	/**
	 * @param {Object} core - The @actions/core module (for logging and getInput)
	 */
	constructor(core) {
		this.core = core
	}

	/**
	 * Executes a shell command with logging.
	 *
	 * @param {string} cmd - The command to execute
	 * @returns {Promise<string>} The trimmed stdout output
	 */
	async exec(cmd) {
		const dryRun = this.core.getInput('dry-run')
		if (dryRun) {
			this.core.info(`dry run: ${cmd}`)
			return
		}
		this.core.info(`Running: ${cmd}`)
		const { stdout, stderr } = await execAsync(cmd)
		if (stderr) {
			this.core.info(stderr)
		}
		return stdout.toString().trim()
	}

	/**
	 * Executes a shell command, suppressing any errors.
	 *
	 * @param {string} cmd - The command to execute
	 * @returns {Promise<string|undefined>} The trimmed stdout output, or undefined if error
	 */
	async execQuietly(cmd) {
		try {
			return await this.exec(cmd)
		} catch (e) {
			// Intentionally swallow errors
		}
	}
}

module.exports = Shell

