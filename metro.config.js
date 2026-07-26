const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Exclude the app's own backend (this project's own top-level server/
// folder) from the client bundle. Anchored to the project root specifically
// - an earlier, unanchored /server[/\\].*/ pattern also matched any
// "server" path segment anywhere, including inside node_modules (e.g.
// @expo/router-server/build/server/renderStreamingContent.js), which broke
// Expo's own web static-rendering with a spurious "Unable to resolve
// module" error.
const projectServerDir = path.join(__dirname, 'server');
config.resolver.blockList = [new RegExp(`^${escapeRegExp(projectServerDir)}(\\\\|/|$)`)];

module.exports = config;
