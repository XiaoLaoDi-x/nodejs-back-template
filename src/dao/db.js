import mysql from 'mysql';
import Lock from '../utils/lock';

class DB {
  constructor(conf) {
    this.pool = mysql.createPool(conf);
    this.errNum = 0;
    this.lock = new Lock();
    this.connect();
  }
  connect(callback) {
    if (this.connection) {
      return Promise.resolve(this.connection);
    }
    const lockStatus = this.lock.lock();
    return new Promise((resolve, reject) => {
      if (!lockStatus) {
        this.lock.status.then(() => {
          resolve(this.connection);
        });
      } else {
        this.pool.getConnection((err, connection) => {
          this.lock.unlock();
          if (err) {
            typeof callback === 'function' && callback(err);
            $log.fatal('数据库异常', err);
            reject(err);
          } else {
            this.connection = connection;
            resolve(connection);
          }
        });
      }
    });
  }
  executeSql(sql, arr) {
    return new Promise((resolve, reject) => {
      this.lock.status.then(() => {
        this.connection.query(sql, arr, async (err, result) => {
          if (err) {
            this.connection.release();
            this.connection.destroy();
            this.connection = null;
            this.connect();
            if (this.errNum > 0) {
              $log.fatal('数据库异常', err);
              reject(err);
              return;
            }
            this.errNum++;
            resolve(await this.executeSql(sql, arr));
          } else {
            this.errNum = 0;
            resolve(result);
          }
        });
      });
    });
  }
}

export default new DB($config.mysql);
