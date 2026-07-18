#!/usr/bin/env node

/**
 * Bumps the patch component of expo.version in app.json (e.g. 1.0.0 -> 1.0.1).
 * Run before `eas build` so the marketing version shown in Android's app info
 * screen changes on every build, the same way EAS already auto-increments
 * android.versionCode. Not run automatically by EAS Build itself: with
 * appVersionSource "local", the version is resolved locally at `eas build`
 * time, before the project is uploaded, so this has to run on this machine.
 */

const fs = require('fs');
const path = require('path');

const appJsonPath = path.join(__dirname, '..', 'app.json');
const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

const current = appJson.expo.version;
const parts = current.split('.').map(Number);
parts[2] = (parts[2] || 0) + 1;
const next = parts.join('.');

appJson.expo.version = next;
fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n');

console.log(`Version bumped: ${current} -> ${next}`);
