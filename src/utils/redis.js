import { createClient  } from 'redis';
import Lock from './lock';

class Redis {
  constructor(option) {
    this.client = createClient(option);
    this.lock = new Lock();
    this.client.on('error', (err) => this.error(err));
    this.connect();
  }
  async connect() {
    if (!this.lock.lock()) {
      await this.lock.status;
    }
    return await this.client.connect().finally(() => {
      this.lock.unlock();
    });
  }
  error(err) {
    $log.fatal('Redis Client Error', err);
  }
  async set(key, value) {
    await this.lock.status;
    if (typeof value === 'object') {
      value = JSON.stringify(value);
    }
    return await this.client.set(key, String(value));
  }
  async get(key) {
    await this.lock.status;
    const value = await this.client.get(key);
    try {
      const obj = JSON.parse(value);
      if (typeof obj === 'number') {
        throw new Error('');
      }
      return obj;
    } catch (error) {
      return value;
    }
  }
  async disconnect() {
    await this.lock.status;
    return await this.client.disconnect();
  }
}

export default new Redis($config.redis);
