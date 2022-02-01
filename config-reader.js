const { readFileSync } = require('fs')

/**
 * @typedef Configuration
 *
 * @property {Object} config The config object as it was provided
 * @property {Object} config.branches
 * "branches": {
 *     "release-2020-commercial": {
 *       "alias": "2020",
 *       "milestoneNumber": 1
 *     },
 *     ...
 * }
 *
 * @property {Array<String>} mergeTargets An ordered array of branches that a
 * change should be merged forward into. (e.g. releases in chronological order)
 *
 * @property {Object} branchNameByMilestoneNumber
 * A mapping of milestoneNumber to the release branch the milestone is assigned to.
 * e.g. { 1: 'release-2022' }
 *
 * @property {Object} branchByAlias
 * A mapping of the branch alias to the branch object
 * e.g. { '2021-sp': {branchAttributes...} }
 */

/**
 * Reads the config file and (re)structures data in useful ways.
 *
 * @param configFileLocation
 * @param {String} options.baseBranch
 *
 * @returns {Configuration}
 */
function configReader(configFileLocation, options = {}) {
	const config = JSON.parse(readFileSync(configFileLocation))

	const branchNameByMilestoneNumber = {}
	const branchByAlias = {}

	Object.entries(config.branches).forEach(entry => {
		const [branchName, props] = entry;
		const { alias, milestoneNumber } = props
		branchNameByMilestoneNumber[milestoneNumber] = branchName
		branchByAlias[alias] = { name: branchName, ...props }
	})

	const data = {
		mergeTargets: buildMergeTargets(config, options),
		branchByAlias,
		branchNameByMilestoneNumber
	}

	return {
		config,
		...data
	}
}

function buildMergeTargets(config, options) {
	const mergeTargets = []
	const {mergeOperations} = config
	let branchTarget = mergeOperations[options.baseBranch || 0]
	while (branchTarget) {
		mergeTargets.push(branchTarget)
		branchTarget = mergeOperations[branchTarget]
	}

	return mergeTargets
}

module.exports = configReader