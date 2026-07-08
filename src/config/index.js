import { createRequire } from 'node:module';
const nodeRequire = createRequire(import.meta.url);

const globalConfig = nodeRequire('./config.js');
const config = nodeRequire('./config.' + process.env.NODE_ENV + '.js');

export default { ...globalConfig, ...config };