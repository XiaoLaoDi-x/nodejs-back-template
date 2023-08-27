class Router {
  constructor(contextRoot) {
    this.contextRoot = contextRoot || '';
    this.pathMap = new Map([]);
  }
  /**
   * 添加路由
   * @param {string} method 请求类型
   * @param {string} path 请求路径
   * @param {Function} callback 访问该路由时调用的函数
   * @param {'json' | 'form'} type 请求类型
   */
  setRoute(method, path, callback, type = 'json') {
    const fullPath = `${this.contextRoot}${path}`;
    if (!this.pathMap.has(method)) {
      this.pathMap.set(method, {
        [fullPath]: [callback, type]
      });
    } else {
      this.pathMap.get(method)[fullPath] = [callback, type];
    }
  }
  /**
   * 获取路径对应函数
   * @param {string} method 请求类型
   * @param {string} path 请求路径
   * @returns {Array} 之前添加的函数
   */
  use(method, path) {
    const fn = this.pathMap.has(method) ? this.pathMap.get(method)[decodeURI(path)] : [];
    return fn;
  }
}

module.exports = Router;
