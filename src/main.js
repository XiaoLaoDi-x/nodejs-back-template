global.$config = require('@/config');
global.$CONSTANT = require('@/common/CONSTANT');
global.$log = require('@/utils/log');
global.$redis = require('@/utils/redis');
import HttpServer from './server';
const { WHITE_URL } = $CONSTANT;

$log.info('当前环境:', process.env.NODE_ENV);

// 全局异常捕获
process.on('uncaughtException', function (err) {
  $log.fatal('uncaughtException', err);
});

new HttpServer({ WHITE_URL, ...$config });
