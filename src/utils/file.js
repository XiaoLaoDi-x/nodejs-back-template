import path from 'path';
import fs from 'fs';
import { createRequire } from 'node:module';
const nodeRequire = createRequire(import.meta.url);

/**
 * 遍历文件夹
 * @param {string} pathStr 要遍历的路径
 * @param {Function} callback 回调函数，每次取到文件/目录就回调
 * @param {string} type 获取类型 f 文件 d 目录, 默认文件
 */
function readDirSync(pathStr, callback, type = 'f') {
  const dir = fs.readdirSync(pathStr);
  dir.forEach((name) => {
    const realPath = pathStr + '/' + name;
    const info = fs.statSync(realPath);
    if (info.isDirectory()) {
      readDirSync(realPath, callback, type);
      type === 'd' && callback && callback(name, pathStr + '/');
    } else {
      type === 'f' && callback && callback(name, pathStr + '/');
    }
  });
}

const recursionAdd = (item, fileList, value) => {
  const fileArr = JSON.parse(JSON.stringify(fileList));
  if (fileArr.length > 1) {
    if (!item[fileArr[0]]) {
      item[fileArr[0]] = {};
    }
    const map = item[fileArr[0]];
    fileArr.shift();
    recursionAdd(map, fileArr, value);
  } else {
    item[fileArr[0]] = value;
  }
};
const importAll = (context) => {
  const map = {};
  context.keys().forEach((key) => {
    const keyFile = key.replace(/\.js$/g, '').replace(/\.\//g, '');
    const fileArr = keyFile.split('/');
    recursionAdd(map, fileArr, context(key));
  });
  return map;
};

/**
 * 使用原生 fs 读取目录下所有 .js 文件并返回嵌套 map，替代 webpack 的 require.context
 * @param {string} dirPath 要扫描的目录绝对路径
 * @returns {object} 嵌套的模块 map
 */
function requireAll(dirPath) {
  const map = {};
  readDirSync(dirPath, (name, dir) => {
    const fullPath = path.join(dir, name);
    if (name === 'index.js' && dir === dirPath.replace(/\\/g, '/') + '/') return;
    const keyFile = path.relative(dirPath, fullPath).replace(/\.js$/g, '').replace(/\\/g, '/');
    const fileArr = keyFile.split('/');
    recursionAdd(map, fileArr, nodeRequire(fullPath));
  });
  return map;
}

/**
 * 遍历查找路径的存在性，不存在则创建
 * @param {string} pathStr 路径
 * @returns {string} 全路径
 */
function mkdirPath(pathStr) {
  let projectPath = path.join(process.cwd());
  const tempDirArray = pathStr.split(/\\|\//);
  if (pathStr.indexOf(':') === 1) {
    projectPath = tempDirArray[0];
    tempDirArray.splice(0, 1);
  } else if (pathStr.includes(':')) {
    throw new Error('文件路径有误');
  }
  for (let i = 0; i < tempDirArray.length; i++) {
    projectPath = projectPath + '/' + tempDirArray[i];
    if (fs.existsSync(projectPath)) {
      const tempStat = fs.statSync(projectPath);
      if (!tempStat.isDirectory()) {
        fs.unlinkSync(projectPath);
        fs.mkdirSync(projectPath);
      }
    } else {
      fs.mkdirSync(projectPath);
    }
  }
  return projectPath;
}

/**
 * 保存axios返回文件到指定目录
 * @param {string} fileName 文件名称非必传
 * @param {object} headers Axios返回值请求头
 * @param {ArrayBuffer} fileData 文件内容
 * @param {string} outPutPath 文件输出路径
 * @returns {string[]} [文件全路径, 文件全名称]
 */
function saveAxiosFile(fileName, headers, fileData, outPutPath = $config.fileSavePath) {
  const disposition = decodeURIComponent(headers['content-disposition'])?.replace(/\"|\'/g, '');
  let fileFullName = disposition.split('filename=')[1];
  if (fileName) {
    const suffix = disposition.split('.');
    fileFullName = `${fileName}.${suffix[suffix.length - 1]}`;
  }
  if (!fileFullName) {
    throw new Error('文件名称错误');
  }
  fileFullName = fileFullName.replace(/\s*/g, '');
  const outPutFilePath = path.join(outPutPath, fileFullName);
  fs.writeFileSync(outPutFilePath, fileData);
  return [outPutFilePath, fileFullName];
}

/**
 * 复制文件到路径没有则创建
 * @param {string} oldPath 文件路径(包含文件名称)
 * @param {string} newPath 目标路径(不包含文件名称)
 * @param {string} fileFullName 文件名称
 * @returns {string} 新文件路径
 */
function copyFileToPath(oldPath, newPath, fileFullName) {
  const file = fs.readFileSync(oldPath);
  const dirPath = mkdirPath(newPath);
  const filePath = path.join(dirPath, fileFullName);
  fs.writeFileSync(filePath, file);
  return filePath;
}

/**
 * 批量删除文件
 * @param {string[]} paths
 */
function deleteFiles(paths) {
  paths.forEach((pathStr) => {
    pathStr && fs.access(pathStr, fs.constants.F_OK, (err) => {
      if (err) {
        // 代表文件不存在无需删除
        return;
      }
      fs.unlinkSync(pathStr);
    });
  });
}

export {
  readDirSync,
  requireAll,
  importAll,
  mkdirPath,
  saveAxiosFile,
  copyFileToPath,
  deleteFiles
};
