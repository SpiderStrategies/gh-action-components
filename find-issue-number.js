const ISSUE_REGEX = /#(\d{3,})/
const BRANCH_ISSUE_REGEX = /(\d{3,})/

/**
 * Common algorithm for finding an issue number:
 * 1. From the commit messages
 * 2. From the PR title
 * 3. From the branch name
 *
 * @param {BaseAction} action
 * @param {Object} pullRequest from the event
 *
 * @returns {Promise<string>} The issue number
 */
async function findIssueNumber({action, pullRequest}) {

	const { number: pull_number, title, head } = pullRequest
	const prBranch = head.ref

	// First, Look at the commits
	let issueNumber = extractFromCommits(await action.fetchCommits(pull_number))

	// Second, the PR title
	if (!issueNumber) { search(title, 'PR title') }

	// Finally, branch name
	if (!issueNumber) { issueNumber = search(prBranch, 'branch name', BRANCH_ISSUE_REGEX) }

	return issueNumber
}

/**
 * @param {Object} commits GH API response
 */
function extractFromCommits(commits) {
	const commitMessages = commits.data.map(c => c.commit.message).reverse()
	console.log('commit messages:', commitMessages)

	let issueNumber
	for (let i = 0; i < commitMessages.length && !issueNumber; i++) {
		issueNumber = search(commitMessages[i], 'commits')
	}
	return issueNumber
}

function search(term, source, regex = ISSUE_REGEX) {
	const result = regex.exec(term)
	if (result) {
		let issueNumber = result.length > 1 ? result[1] : undefined
		if (issueNumber) {
			console.log(`issue number:`, issueNumber, `found in`, source)
		}
		return issueNumber
	}
}

module.exports = findIssueNumber
module.exports.extractFromCommits = extractFromCommits
