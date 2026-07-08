import ws from 'ws';
import WsResponse from './WsResponse';
import distribute from './distribute';
import { authVerify, getTokenHeader  } from '@/utils/auth';

class WebSocket {
  constructor(server, deviceTypeMaxMap) {
    // 允许连接设备类型
    this.allowDeviceType = Object.keys(deviceTypeMaxMap);
    // 单用户每种类型设备允许连接映射
    this.deviceTypeMaxMap = deviceTypeMaxMap || { web: 1 };
    // 用户 -> 连接 映射
    this.userSocketMap = new Map();
    // 连接 -> 用户 映射
    this.socketToUserMap = new WeakMap();
    this.ws = new ws.WebSocketServer({ server });
    const eventList = ['message', 'error', 'close'];
    this.ws.on('connection', (socket) => {
      eventList.forEach(type => this.event(socket, type));
    });
  }
  /**
   * 存储userSocketItem
   * @param {Socket} socket
   * @param {string} uid 用户主键
   * @param {string} deviceType 用户设备类型，考虑到多设备登录区分socket
   */
  setSocket(socket, uid, deviceType = 'web') {
    if (_.isEqual(this.socketToUserMap.get(socket), uid)) {
      return;
    }
    if (!this.allowDeviceType.includes(deviceType)) {
      WsResponse.error(socket, '', '错误的设备类型');
      socket.close();
      return;
    }
    this.removeSocket(socket);
    const max = this.deviceTypeMaxMap[deviceType] || 1;
    this.socketToUserMap.set(socket, uid);
    const socketDeviceMap = this.userSocketMap.get(uid);
    if (_.isEmpty(socketDeviceMap)) {
      return this.userSocketMap.set(uid, { [deviceType]: [socket] });
    }
    const deviceSocket = socketDeviceMap[deviceType];
    if (_.isEmpty(deviceSocket)) {
      socketDeviceMap[deviceType] = [socket];
      return;
    }
    deviceSocket.push(socket);
    if (deviceSocket.length > max) {
      const [abandonSocket] = deviceSocket.splice(0, 1);
      WsResponse.exceedMaximum(abandonSocket);
      abandonSocket.close();
    }
  }
  /**
   * 删除socket对象
   * @param {socket} socket
   */
  removeSocket(socket) {
    const uid = this.socketToUserMap.get(socket);
    if (!uid) {
      return;
    }
    this.socketToUserMap.delete(socket);
    const socketDeviceMap = this.userSocketMap.get(uid);
    const socketDeviceList = Object.values(socketDeviceMap);
    for (let i = 0; i < socketDeviceList.length; i++) {
      const sockets = socketDeviceList[i];
      if (_.isEmpty(sockets)) {
        continue;
      }
      const index = sockets.findIndex(socketItem => Object.is(socket, socketItem));
      if (index !== -1) {
        return sockets.splice(index, 1);
      }
    }
    WsResponse.error(socket, '', '连接丢失');
  }
  /**
   * 获取对应uid的Set对象
   * @param {string} uid 用户id
   * @returns {socket[]}
   */
  async getSockets(uid) {
    const socketDeviceMap = this.userSocketMap.get(uid);
    const socketList = [];
    Object.values(socketDeviceMap).forEach(sockets => {
      if (_.isEmpty(sockets)) {
        return;
      }
      socketList.push(...sockets);
    });
    return socketList;
  }
  /**
   * 获取多用户socket组成的数组
   * @param {string[]} uidList
   */
  getMoreUserSockets(uidList) {
    const socketList = [];
    for (const uid of uidList) {
      socketList.push([...this.getSockets(uid)]);
    }
    return socketList;
  }
  // 事件分发
  event(socket, type) {
    socket.on(type, (...arg) => this[type](socket, ...arg));
  }
  close(socket, code) {
    this.removeSocket(socket);
    $log.info('连接关闭', 'code', code);
  }
  error(socket) {
    this.removeSocket(socket);
    $log.info('连接异常', socket);
  }
  // message需包含 socketType token
  async message(socket, str, isBinary) {
    if (isBinary) {
      return;
    }
    try {
      const data = JSON.parse(str);
      const { token, path, data: wsData } = data;
      const tokenInfo = await authVerify(token);
      if (!tokenInfo) {
        return;
      }
      if (tokenInfo.expired) {
        // 令牌过期，前端需要带刷新token重发消息
        return WsResponse.tokenExpired(socket);
      }
      if (tokenInfo.refresh) {
        // 刷新token验证通过，向前端输送新的令牌，正常执行业务
        WsResponse.updateToken(socket, getTokenHeader(tokenInfo));
      }
      const [fn, routerParams] = distribute(path);
      if (!fn) {
        return WsResponse.error(socket, error.message); ;
      }
      await fn({ socket, routerParams, wsData, tokenInfo, res: WsResponse, ws: this });
    } catch (error) {
      WsResponse.error(socket, error.message);
    }
  }
  /**
   * 回复前端JSON数据
   * @param {string[]} keys 发送人的主键数组
   * @param {string} type 消息类型，方便前端去分发处理
   * @param {object} data 要返回的数据
   */
  sendJson(keys, type, data) {
    const sendSocketList = this.getMoreUserSockets(keys);
    sendSocketList.forEach((socket) => {
      WsResponse.success(socket, type, data);
    });
  }
}

export default WebSocket;
