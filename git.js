const { writeFile } = require('fs/promises')

/**
 * Git provides a clean interface for common git operations.
 *
 * Depends on Shell for executing git commands.
 */
class Git {

	/**
	 * @param {Object} shell - A Shell instance for executing commands
	 */
	constructor(shell) {
		this.shell = shell
	}

	/**
	 * Creates a git commit with optional author override.
	 *
	 * @param {string} message - The commit message
	 * @param {Object} [author] - Optional author information
	 * @param {string} [author.name] - Author name
	 * @param {string} [author.email] - Author email
	 * @returns {Promise<void>}
	 */
	async commit(message, author) {
		// Write to a file to avoid escaping nightmares
		await writeFile('.commitmsg', message)
		let options = '--file=.commitmsg'
		if (author) {
			options += ` --author "${author.name} <${author.email}>"`
		}
		await this.shell.exec(`git commit ${options}`)
		await this.shell.exec('git push')
	}

	/**
	 * Creates a new branch and pushes it to origin.
	 *
	 * @param {string} name - The branch name
	 * @param {string} sha - The commit SHA to branch from
	 * @returns {Promise<void>}
	 */
	async createBranch(name, sha) {
		await this.shell.exec(`git checkout -b ${name} ${sha}`)
		await this.shell.exec(`git push --set-upstream origin ${name}`)
	}

	/**
	 * Deletes a remote branch.
	 *
	 * @param {string} name - The branch name to delete
	 * @returns {Promise<void>}
	 */
	async deleteBranch(name) {
		return this.shell.execQuietly(`git push origin --delete ${name}`)
	}

	/**
	 * Checks out a branch.
	 *
	 * @param {string} branch - The branch name
	 * @returns {Promise<string>}
	 */
	async checkout(branch) {
		return this.shell.exec(`git checkout ${branch}`)
	}

	/**
	 * Pulls the latest changes.
	 *
	 * @returns {Promise<string>}
	 */
	async pull() {
		return this.shell.exec('git pull')
	}

	/**
	 * Merges a ref with the given options.
	 *
	 * @param {string} ref - The ref to merge (branch, sha, etc.)
	 * @param {string} [options=''] - Git merge options
	 * @returns {Promise<string>}
	 */
	async merge(ref, options = '') {
		return this.shell.exec(`git merge ${ref} ${options}`.trim())
	}

	/**
	 * Resets the working directory to match a ref.
	 *
	 * @param {string} ref - The ref to reset to
	 * @param {string} [mode='--hard'] - Reset mode
	 * @returns {Promise<string>}
	 */
	async reset(ref, mode = '--hard') {
		return this.shell.exec(`git reset ${mode} ${ref}`)
	}

	/**
	 * Configures git user identity.
	 *
	 * @param {string} name - User name
	 * @param {string} email - User email
	 * @returns {Promise<void>}
	 */
	async configureIdentity(name, email) {
		await this.shell.exec(`git config user.email "${email}"`)
		await this.shell.exec(`git config user.name "${name}"`)
	}
}

module.exports = Git

