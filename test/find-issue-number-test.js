const tap = require('tap')

const extractFromCommits = require('../find-issue-number').extractFromCommits

const buildCommits = messages => {
	return {
		data: messages.map(m => ({commit: { message: m }}))
	}
}

tap.test(`extractFromCommits`, async t => {

	t.test(`5 digit issue in prefix position`, async t => {
		const commits = buildCommits(['Fixes #12345 test of prefix'])
		const actual = extractFromCommits(commits)
		t.equal(`12345`, actual)
	})

	t.test(`issue is suffixed after conflict pr conflict branch`, async t => {
		const commits = buildCommits(['Merge commit 278fd79 into issue-48058-pr-48085-conflicts-2022 Fixes #48086'])
		const actual = extractFromCommits(commits)
		t.equal(`48086`, actual)
	})

	t.test(`regex state does not pollute between calls`, async t => {
		// First call - finds issue in title
		const commits1 = buildCommits(['Merge conflicts #68875'])
		const result1 = extractFromCommits(commits1)
		t.equal(result1, '68875', 'first call should find issue')

		// Second call - should also find issue (but fails due to regex state pollution)
		const commits2 = buildCommits(['Merge conflicts #68895'])
		const result2 = extractFromCommits(commits2)
		t.equal(result2, '68895', 'second call should find issue without pollution')
	})

})
