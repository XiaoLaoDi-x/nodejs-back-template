const { RESPONSE } = $CONSTANT;

class WsResponse {
  success(socket, type, data, message) {
    const params = {
      code: RESPONSE.SUCCESS_CODE,
      type,
      data,
      message: message || '成功'
    };
    socket.send(JSON.stringify(params));
  }
  error(socket, err, message) {
    const params = {
      code: RESPONSE.ERROR_CODE,
      err,
      message: message || '系统错误'
    };
    socket.send(JSON.stringify(params));
  }
  exceedMaximum(socket) {
    const params = {
      code: RESPONSE.EXCEED_MAXIMUM,
      message: '连接超出上限'
    };
    socket.send(JSON.stringify(params));
  }
  permissionDenied(socket) {
    const params = {
      code: RESPONSE.PERMISSION_DENIED,
      message: '无权限访问'
    };
    socket.send(JSON.stringify(params));
  }
  tokenExpired(socket) {
    const params = {
      code: RESPONSE.LOSE_EFFICACY,
      message: '令牌已过期'
    };
    socket.send(JSON.stringify(params));
  }
  updateToken(socket, data) {
    const params = {
      code: RESPONSE.SUCCESS_CODE,
      type: '/update/auth',
      data,
      message: ''
    };
    socket.send(JSON.stringify(params));
  }
}

export default new WsResponse();
