const defaultGithub = require('@actions/github')
const defaultCore = require('@actions/core')

/**
 * GitHubClient provides a clean interface for GitHub API operations.
 *
 * Dependencies are bound at construction time for clean usage and testability.
 */
class GitHubClient {

	/**
	 * @param {Object} options
	 * @param {Object} [options.core] - The @actions/core module (for getInput)
	 * @param {Object} [options.github] - The @actions/github module
	 */
	constructor({ core, github } = {}) {
		this.core = core ?? defaultCore
		this.github = github ?? defaultGithub
		this._octokit = null
	}

	/**
	 * Gets the authenticated Octokit instance, creating it lazily.
	 *
	 * @returns {Object} The Octokit instance
	 */
	get octokit() {
		if (!this._octokit) {
			const repoToken = this.core.getInput('repo-token')
			if (!repoToken) {
				throw new Error('repo-token input is required')
			}
			this._octokit = this.github.getOctokit(repoToken)
		}
		return this._octokit
	}

	/**
	 * Gets the repository info from the GitHub context.
	 *
	 * @returns {Object} Object with owner and repo properties
	 */
	get repo() {
		const { repository } = this.github.context.payload
		return {
			owner: repository.owner.login,
			repo: repository.name
		}
	}

	/**
	 * Fetches the commits for a pull request.
	 *
	 * @param {number} prNumber - The pull request number
	 * @returns {Promise<Object>} The commits response from GitHub API
	 */
	async fetchCommits(prNumber) {
		return this.octokit.rest.pulls.listCommits({
			...this.repo,
			pull_number: prNumber
		})
	}

	/**
	 * Creates a GitHub issue.
	 *
	 * @param {Object} options
	 * @param {string} options.title - Issue title
	 * @param {number} [options.milestone] - Milestone number
	 * @param {string[]} [options.labels] - Array of label names
	 * @returns {Promise<Object>} The created issue response
	 */
	async createIssue({ title, milestone, labels }) {
		return this.octokit.rest.issues.create({
			...this.repo,
			title,
			milestone,
			labels
		})
	}
}

module.exports = GitHubClient

