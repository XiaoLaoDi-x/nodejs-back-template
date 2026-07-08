import _ from 'lodash';
import sqlCreate from '@/utils/sql';
const dbPlusConfig = $config.dbPlusConfig || {};

class DBPlus {
  constructor(db, table) {
    const { name, columns, mainKey, isLogicDelete, orderKey } = table;
    this.db = db;
    this.tableName = name;
    this.tableColumns = columns;
    this.mainKey = mainKey;
    this.order = orderKey;
    const hasDelField = !!dbPlusConfig.logicDeleteField;
    this.isLogicDelete = _.isNil(isLogicDelete) ? hasDelField : (isLogicDelete && hasDelField);
    this.logicField = { id: dbPlusConfig.logicDeleteField, logicDeleteValue: dbPlusConfig.logicDeleteValue };
  }
  async page(obj, order) {
    const { pageNum = 1, pageSize = 10, ...selectData } = obj || {};
    const list = await this.select(obj, order);
    const total = await this.count(selectData);
    return { list, total, pageSize, pageNum };
  }
  async select(obj, order) {
    const { sql, arr } = sqlCreate.select(obj || {}, this.tableName, this.tableColumns, order || this.order);
    return await this.db.executeSql(sql, arr);
  }
  async count(obj) {
    const { sql, arr } = sqlCreate.selectCount(obj || {}, this.tableName, this.tableColumns, this.mainKey);
    const [{ total }] = await this.db.executeSql(sql, arr);
    return total;
  }
  /**
   * 新增/批量新增
   * @param {Object | Array<Object>} data
   * @returns
   */
  async insert(data) {
    const { sql, arr } = sqlCreate.insert(data || {}, this.tableName, this.tableColumns);
    return await this.db.executeSql(sql, arr);
  }
  /**
   * 更新
   * @param {Object} obj
   * @returns
   */
  async updateById(obj) {
    const { sql, arr } = sqlCreate.updateById(obj || {}, this.tableName, this.tableColumns, this.mainKey);
    return await this.db.executeSql(sql, arr);
  }
  /**
   * 批量更新
   * @param {Array<Object>} data
   * @returns
   */
  async beatchUpdateById(data) {
    const { sql, arr } = sqlCreate.beatchUpdateById(data || [], this.tableName, this.tableColumns, this.mainKey);
    return await this.db.executeSql(sql, arr);
  }
  async removeById(id) {
    return await this.removeByIds([id]);
  }
  async removeByIds(ids) {
    const removeFunc = sqlCreate[this.isLogicDelete ? 'logicRemoveByIds' : 'removeByIds'];
    const { sql, arr } = removeFunc(ids || [], this.tableName, this.mainKey, this.logicField);
    return await this.db.executeSql(sql, arr);
  }
}

export default DBPlus;
