/**
 * 带捕获异常的函数执行
 * @param {Function} fn 要执行的函数
 * @param  {...any} args 参数
 * @returns {[Error|null, any]}
 */
async function handleTryCatch(fn, ...args) {
  try {
    return [null, await fn(...args)];
  } catch (e) {
    return [e];
  }
}

export default handleTryCatch;