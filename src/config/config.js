// 接收token的请求头key值
const tokenKey = 'access_token';
// 双token配置：刷新token key
const refreshTokenKey = 'refresh_token';
// 登录设备类型
const deviceType = 'device_type';

export {
  // 服务前缀路径
  serverBaseUrl: '/serve',
  // 文件保存路径
  fileSavePath: './files',
  // 服务端口
  serverPort: 8080,
  log: {
    warn: ['warnLogs', 'console'],
    error: ['errorLogs', 'console']
  },
  tokenConf: {
    key: tokenKey,
    headerKey: 'Authentication',
    // token私钥
    privateKey: 'nodejs-back-template-private-key',
    // token生效时长，{string | number} 数字单位秒
    expiresIn: '30m'
  },
  refreshTokenConf: {
    key: refreshTokenKey,
    headerKey: 'RefreshAuth',
    // refreshToken私钥
    privateKey: 'nodejs-back-template-refresh-private-key',
    // refreshToken生效时长，{string | number} 数字单位秒
    expiresIn: '7d'
  },
  deviceType,
  // 该配置键值与前端对其即可，值最小为1
  deviceTypeMaxMap: {
    web: 1,
    pc: 1,
    phone: 1
  },
  // mysql配置: 详见npm mysql介绍
  mysql: {
    host: 'localhost',
    port: '3306',
    user: 'root',
    password: '123456',
    database: 'dbName'
  },
  // redis配置: 详见npm redis介绍
  redis: {
    // 按照github上的issues，如果用户名是默认值redis, 那么需要省略
    // redis[s]://[[username][:password]@][host][:port][/db-number]
    url: 'redis://:123456@localhost:6379'
  },
  // 跨域请求允许的请求头字段
  AllowHeaders: [
    'Content-Type',
    'Content-Length',
    'Authorization',
    'Accept',
    'X-Requested-With',
    tokenKey,
    refreshTokenKey,
    deviceType
  ],
  // 跨域请求允许的请求方法
  AllowMethods: [
    'PUT',
    'POST',
    'GET',
    'DELETE',
    'OPTIONS'
  ],
  // 跨域请求允许的ip * 为允许所有
  AllowOrigin: ['*'],
  dbPlusConfig: {
    logicDeleteField: 'is_delete', // 全局逻辑删除的实体字段名(since 3.3.0,配置后可以忽略不配置步骤2)
    logicDeleteValue: 1, // 逻辑已删除值(默认为 1)
    logicNotDeleteValue: 0 // 逻辑未删除值(默认为 0)
  }
};
