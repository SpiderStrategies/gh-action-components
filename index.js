const configReader = require('./config-reader')
const findIssueNumber = require('./find-issue-number')
const BaseAction = require('./base-action')
const Shell = require('./shell')
const GitHubClient = require('./github-client')
const Git = require('./git')

const mockCore = require('./mock-core')

module.exports = {
	// ES6 classes
	Shell,
	GitHubClient,
	Git,
	// Existing exports
	BaseAction,
	configReader,
	findIssueNumber,
	// Test Utils
	mockCore
}