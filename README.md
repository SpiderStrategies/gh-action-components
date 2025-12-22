# gh-action-components

NPM module with shared components for custom Spider GitHub Actions

## Why This Repository Is Public

This repository is public to allow GitHub Actions workflows in other Spider Strategies repositories to install it without requiring authentication. When workflows run `npm ci`, they can access this package using the standard `GITHUB_TOKEN` without needing additional credentials or Personal Access Tokens.

This repository contains only generic GitHub Actions utility code with no sensitive information, proprietary business logic, or credentials.

## Components

- **BaseAction** - Base class for GitHub Actions with common operations (git commands, GitHub API calls, error handling)
- **configReader** - Reads and structures configuration files for branch/milestone management
- **findIssueNumber** - Extracts issue numbers from commit messages, PR titles, or branch names
- **mockCore** - Test utilities for mocking @actions/core
