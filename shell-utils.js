const util = require('util')
const execAsync = util.promisify(require('child_process').exec)

/**
 * Executes a shell command with logging.
 *
 * @param {Object} core - The @actions/core module (for logging and getInput)
 * @param {string} cmd - The command to execute
 * @returns {Promise<string>} The trimmed stdout output
 */
async function exec(core, cmd) {
	const dryRun = core.getInput('dry-run')
	if (dryRun) {
		core.info(`dry run: ${cmd}`)
		return
	}
	core.info(`Running: ${cmd}`)
	const { stdout, stderr } = await execAsync(cmd)
	if (stderr) {
		core.info(stderr)
	}
	return stdout.toString().trim()
}

/**
 * Executes a shell command, suppressing any errors.
 *
 * @param {Object} core - The @actions/core module (for logging and getInput)
 * @param {string} cmd - The command to execute
 * @returns {Promise<string|undefined>} The trimmed stdout output, or undefined if error
 */
async function execQuietly(core, cmd) {
	try {
		return await exec(core, cmd)
	} catch (e) {
		// Intentionally swallow errors
	}
}

module.exports = { exec, execQuietly }

