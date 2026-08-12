const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
const androidPath = path.resolve(__dirname, 'android').replace(/[/\\]/g, '[/\\\\]');

config.maxWorkers = 1;
config.resolver.blockList = new RegExp(`${androidPath}[/\\\\].*`);

module.exports = config;
