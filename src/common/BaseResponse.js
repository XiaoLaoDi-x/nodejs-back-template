import url from 'url';
import { tokenAuth, refreshTokenAuth  } from '@/utils/auth';
const { RESPONSE } = $CONSTANT;
const { AllowOrigin, AllowHeaders, AllowMethods } = $config;

class BaseResponse {
  constructor(res, req) {
    this.res = res;
    this.req = req;
    this.method = req.method;
    this.path = url.parse(req.url).pathname;
    this.token = tokenAuth.getToken(req);
    this.refreshToken = refreshTokenAuth.getToken(req);
    this.headers = {
      'Content-Type': 'application/json;charset=UTF-8',
      'Access-Control-Allow-Origin': AllowOrigin.join(','),
      'Access-Control-Allow-Headers': AllowHeaders.join(','),
      'Access-Control-Allow-Methods': AllowMethods.join(',')
    };
  }
  _writeHead({ code = 200, headers = {}}) {
    this.res.writeHead(code, { ...this.headers, ...headers });
  }
  sendData(data, head) {
    this._writeHead(head);
    return this.res.end(JSON.stringify(data));
  }
  sendFile(fileName, file) {
    this._writeHead({
      headers: {
        'Content-Type': 'application/octet-stream',
        'Access-Control-Expose-Headers': 'Content-Disposition',
        'Content-Disposition': `attachment;filename=${encodeURIComponent(fileName)}`
      }
    });
    return this.res.end(file);
  }
  success(data, message, headers) {
    return this.sendData(
      {
        code: RESPONSE.SUCCESS_CODE,
        data,
        message: message || '成功'
      },
      { headers }
    );
  }
  error(message, err, headers) {
    return this.sendData(
      {
        code: RESPONSE.ERROR_CODE,
        err,
        message: message || '系统错误'
      },
      { headers }
    );
  }
  permissionDenied(headers) {
    return this.sendData(
      {
        code: RESPONSE.PERMISSION_DENIED,
        message: '无权限访问'
      },
      { headers }
    );
  }
  tokenExpired(headers) {
    return this.sendData(
      {
        code: RESPONSE.TOKEN_EXPIRED,
        message: '令牌已过期'
      },
      { headers }
    );
  }
  notFound() {
    return this.sendData(
      {
        code: RESPONSE.NOT_FOUND,
        path: this.path,
        method: this.method,
        message: '找不到路径'
      },
      { code: 404 }
    );
  }
}

export default BaseResponse;
