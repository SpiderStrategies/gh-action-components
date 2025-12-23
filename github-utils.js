const github = require('@actions/github')
const core = require('@actions/core')

/**
 * Creates an authenticated Octokit instance using the repo-token input.
 *
 * @returns {Object} The Octokit instance
 */
function getOctokit() {
	const repoToken = core.getInput('repo-token')
	if (!repoToken) {
		throw new Error('repo-token input is required')
	}
	return github.getOctokit(repoToken)
}

/**
 * Fetches the commits for a pull request.
 *
 * @param {number} prNumber - The pull request number
 * @returns {Promise<Object>} The commits response from GitHub API
 */
async function fetchCommits(prNumber) {
	const octokit = getOctokit()
	const { repository } = github.context.payload
	return octokit.rest.pulls.listCommits({
		owner: repository.owner.login,
		repo: repository.name,
		pull_number: prNumber
	})
}

module.exports = {
	getOctokit,
	fetchCommits
}

