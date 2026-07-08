import { fileURLToPath } from 'node:url';
import path from 'path';
import Router from '@/utils/router';
import { requireAll  } from '@/utils/file';
const fileMap = requireAll(path.resolve(fileURLToPath(new URL('.', import.meta.url)), 'modules'));


// 路由注册
const router = new Router();
// websocket setRouter方法
function setRouter(path, callback) {
  router.setRoute('WS', path, callback);
}

Object.keys(fileMap).forEach((name) => {
  const register = fileMap[name];
  if (typeof register === 'function') {
    register(setRouter);
  }
});

// 对接收到的信息根据自定义的路径进行分发
function distribute(path) {
  const [fn, , params] = router.use('WS', path);
  return [fn, params];
}

export default distribute;
