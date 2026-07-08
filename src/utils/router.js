class Router {
  /**
   * @param {string} contextRoot 文根
   */
  constructor(contextRoot) {
    this.contextRoot = contextRoot || '/';
    this.pathMap = new Map([]);
  }
  joinPath(path = '') {
    if (!path) {
      return this.contextRoot;
    }
    if (path[0] !== '/') {
      path = `/${path}`;
    }
    return `${this.contextRoot}${path}`.replace(/\/\//g, '/');
  }
  /**
   * 获取路径
   * @param {string} path
   * @returns {['all' | 'match', string]}
   */
  _getPath(path) {
    const fullPath = this.joinPath(path);
    if (fullPath.includes('/:')) {
      return ['match', fullPath];
    }
    return ['all', fullPath];
  }
  /**
   * 添加路由
   * @param {string} method 请求类型
   * @param {string} path 请求路径
   * @param {Function} callback 访问该路由时调用的函数
   * @param {'json' | 'form'} type 请求类型
   */
  setRoute(method, path, callback, type = 'json') {
    method = method.toUpperCase();
    const [pathType, fullPath] = this._getPath(path);
    if (!this.pathMap.has(method)) {
      const methodMap = {
        all: new Map([]),
        match: new Map([])
      };
      methodMap[pathType].set(fullPath, [callback, type]);
      this.pathMap.set(method, methodMap);
    } else {
      this.pathMap.get(method)[pathType].set(fullPath, [callback, type]);
    }
  }
  addMoudel(rootPath) {
    return new RouterMoudel(this.joinPath(rootPath), this.pathMap);
  }
  get(...arg) {
    this.setRoute('GET', ...arg);
  }
  post(...arg) {
    this.setRoute('POST', ...arg);
  }
  put(...arg) {
    this.setRoute('PUT', ...arg);
  }
  delete(...arg) {
    this.setRoute('DELETE', ...arg);
  }
  patch(...arg) {
    this.setRoute('PATCH', ...arg);
  }
  matchPath(matchPath = '', path = '') {
    const matchPathList = matchPath.split('/');
    const pathList = path.split('/').reverse();
    const len = matchPathList.length;
    if (len !== pathList.length) {
      return null;
    }
    const params = {};
    for (let index = 0; index < len; index++) {
      const item = matchPathList[index];
      const pathItem = pathList.pop();
      if (item[0] === ':') {
        const key = item.slice(1);
        params[key] = decodeURIComponent(pathItem);
        continue;
      }
      if (item !== pathItem) {
        return null;
      }
    }
    return params;
  }
  /**
   * 匹配路由
   * @param {Map} matchMap
   * @param {string} path
   */
  matchRouter(matchMap, path) {
    const matchArr = [...matchMap.keys()];
    matchArr.sort((a, b) => {
      return a.split('/:').length - b.split('/:').length;
    });
    const len = matchArr.length;
    for (let i = 0; i < len; i++) {
      const matchPath = matchArr[i];
      const params = this.matchPath(matchPath, path);
      if (params) {
        const value = matchMap.get(matchPath);
        return [...value, params, matchPath];
      }
    }
    return [];
  }
  /**
   * 获取路径对应函数
   * @param {string} method 请求类型
   * @param {string} path 请求路径
   * @returns {Array} 之前添加的函数
   */
  use(method, path) {
    method = method.toUpperCase();
    if (!this.pathMap.has(method)) {
      return [];
    }
    const methodMap = this.pathMap.get(method);
    const { all, match } = methodMap;
    const realPath = decodeURI(path);
    if (all.has(realPath)) {
      return [...all.get(realPath), realPath];
    }
    return this.matchRouter(match, realPath);
  }
}

class RouterMoudel extends Router {
  /**
   * @param {string} moudleRoot 模块文根
   * @param {Map} pathMap router路由对象
   */
  constructor(moudleRoot, pathMap) {
    super(moudleRoot);
    this.pathMap = pathMap;
  }
}

export default Router;
