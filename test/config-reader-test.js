const tap = require('tap')
const configReader = require('../config-reader')

tap.test(`returns correct data`, async t => {
	const config = configReader(`test/test-config.json`, {})
	const { mergeTargets, branchByAlias, branchNameByMilestoneNumber } = config

	t.equal(branchByAlias['2021-sp'].name, 'release-2021-commercial-sp')

	t.same(mergeTargets, [])

	t.same(branchNameByMilestoneNumber, {
		"266": "release-2020-commercial",
		"327": "release-2022",
		"332": "release-2021-commercial-sp",
		"364": "release-2021-commercial-emergency",
	})
})

tap.test(`merge targets are correct`, async t => {
	let config = configReader(`test/test-config.json`, {
		baseBranch: "release-2020-commercial"
	})
	t.same(config.mergeTargets, [
		"release-2021-commercial-emergency",
		"release-2021-commercial-sp",
		"release-2022",
	])

	config = configReader(`test/test-config.json`, {
		baseBranch: "release-2021-commercial-sp"
	})
	t.same(config.mergeTargets, ["release-2022",])
})