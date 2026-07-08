import _ from 'lodash';
const { QUERY_TYPE } = $CONSTANT;

/**
 * 查询条件
 * @param {string | number} value 数据
 * @param {string} queryType 查询方式
 * @returns {string | number}
 */
function selectDataCreated(value, queryType) {
  const searchValue = String(value).replace(/[%_\\]/g, (v) => `\\${v}`);
  const map = new Map([
    [QUERY_TYPE.head, `${searchValue}%`],
    [QUERY_TYPE.last, `%${searchValue}`],
    [QUERY_TYPE.includes, value !== '' ? `%${searchValue}%` : '%'],
    [QUERY_TYPE.exact, value]
  ]);
  return map.get(queryType) || value;
}

/**
 *
 * @param {Object} data 数据
 * @param {WhereTableColumn[]} tableColumns 要生成的列表
 * @returns {SqlCreateResult}
 */
function whereCreated(data, tableColumns) {
  let sql = 'where 1=1';
  const arr = [];
  tableColumns.forEach(({ id, dataKey, table, queryType }) => {
    const value = data[_.isNil(dataKey) ? id : dataKey];
    if (_.isEmpty(value) && !_.isNumber(value)) {
      return;
    }
    if (queryType === QUERY_TYPE.exact) {
      sql = `${sql} and ??.??=?`;
    } else {
      sql = `${sql} and ??.?? like ? escape '\\\\'`;
    }
    arr.push(table, id, selectDataCreated(value, queryType));
  });
  return { sql, arr };
}

/**
 * 查询
 * @param {Object} data 数据
 * @param {string} table 表名称
 * @param {TableColumn[]} tableColumns 表字段数组
 * @param {string} order 排序字段名称
 * @returns {SqlCreateResult}
 */
function select(data, table, tableColumns, order) {
  const { pageNum, pageSize, ...selectData } = data || {};
  const where = whereCreated(selectData, tableColumns.map(item => ({ ...item, table })));
  let sql = `select ?? from ?? ${where.sql}`;
  const arr = [tableColumns.map(({ id }) => id), table, ...where.arr];
  const { field, type } = order || {};
  if (field) {
    sql = `${sql} order by ??`;
    arr.push(field);
    if (type?.toLowerCase() === 'desc') {
      sql = `${sql} DESC`;
    }
  }
  if (pageNum && pageSize) {
    const start = (Number(pageNum) - 1) * Number(pageSize);
    sql = `${sql} limit ?,?`;
    arr.push(start, pageSize);
  }
  return { sql, arr };
}

/**
 * 查询总数
 * @param {Object} data 数据
 * @param {string} table 表名称
 * @param {TableColumn[]} tableColumns 表字段数组
 * @param {string} tableMainKey 主键名称
 * @returns {SqlCreateResult}
 */
function selectCount(data, table, tableColumns, tableMainKey) {
  const { sql, arr } = whereCreated(data, tableColumns.map(item => ({ ...item, table })));
  return { sql: `select count(??) as total from ?? ${sql}`, arr: [tableMainKey, table, ...arr] };
}

/**
 * 获取插入的行数据
 * @param {Object | Array} data 数据
 * @param {TableColumn[]} tableColumns 表字段数组
 * @returns {{column: string[]; arr: Array<string | number>}}
 */
function getInsertColumnWithVal(data, tableColumns) {
  const column = tableColumns.filter(({ unInsert }) => !unInsert).map(({ id }) => id);
  const arr = [];
  if (Array.isArray(data)) {
    data.forEach(item => {
      const valArr = [];
      column.forEach(id => {
        valArr.push(item[id]);
      });
      arr.push(valArr);
    });
    return { column, arr };
  }
  const keys = [];
  column.forEach((id) => {
    const value = data[id];
    if (!_.isNil(value)) {
      keys.push(id);
      arr.push(value);
    }
  });
  return { column: keys, arr: [arr] };
}

/**
 * 插入
 * @param {Object | Array} data 数据
 * @param {string} table 表名称
 * @param {TableColumn[]} tableColumns 表字段数组
 * @returns {SqlCreateResult}
 */
function insert(data, table, tableColumns) {
  const { column, arr } = getInsertColumnWithVal(data, tableColumns);
  return {
    sql: `insert into ?? (??) values ?`,
    arr: [table, column, arr]
  };
}

/**
 * 更新
 * @param {Object} data 数据
 * @param {string} table 表名称
 * @param {TableColumn[]} tableColumns 表字段数组
 * @param {string} tableMainKey 主键名称
 * @returns {SqlCreateResult}
 */
function updateById(data, table, tableColumns, tableMainKey) {
  const sets = {};
  tableColumns.forEach(({ id }) => {
    const value = data[id];
    if (!_.isUndefined(value) && id !== tableMainKey) {
      sets[id] = value;
    }
  });
  return {
    sql: `update ?? set ? where ??=?`,
    arr: [table, sets, tableMainKey, data[tableMainKey]]
  };
}

/**
 * 批量更新
 * @param {Object[]} data 数据
 * @param {string} table 表名称
 * @param {TableColumn[]} tableColumns 表字段数组
 * @param {string} tableMainKey 主键名称
 * @returns {SqlCreateResult}
 */
function beatchUpdateById(data, table, tableColumns, tableMainKey) {
  let sql = `update ?? set`;
  const arr = [table];
  let count = 0;
  const ids = [];
  tableColumns.forEach(({ id }) => {
    let updateField = '';
    const columnArr = [];
    data.forEach((item) => {
      const value = item[id];
      const idValue = item[tableMainKey];
      if (_.isUndefined(value)) {
        return;
      }
      if (id === tableMainKey) {
        idValue && ids.push(idValue);
        return;
      }
      updateField = `${updateField} when ? then ?`;
      columnArr.push(idValue, value);
    });
    if (updateField) {
      if (count > 0) {
        sql += ',';
      }
      sql = `${sql} ?? = case ?? ${updateField} else ?? end`;
      count++;
      arr.push(id, tableMainKey, ...columnArr, id);
    }
  });
  sql = `${sql} where ?? in (?)`;
  arr.push(tableMainKey, ids);
  return { sql, arr };
}

/**
 * 批量删除
 * @param {Array<string | number>} ids 数据
 * @param {string} table 表名称
 * @param {string} tableMainKey 主键名称
 * @returns {SqlCreateResult}
 */
function removeByIds(ids, table, tableMainKey) {
  const arr = ids.filter(id => !_.isNil(id));
  return {
    sql: `delete from ?? where ?? in (?)`,
    arr: [table, tableMainKey, arr]
  };
}

/**
 * 批量逻辑删除
 * @param {Array<string | number>} ids 数据
 * @param {string} table 表名称
 * @param {string} tableMainKey 主键名称
 * @param {LogicField} logicField 逻辑删除字段对象
 * @returns {SqlCreateResult}
 */
function logicRemoveByIds(ids, table, tableMainKey, logicField) {
  const arr = ids.filter(id => !_.isNil(id));
  return {
    sql: `update ?? set ??=? where ?? in (?)`,
    arr: [table, logicField.id, logicField.logicDeleteValue, tableMainKey, arr]
  };
}

export {
  select,
  selectCount,
  insert,
  updateById,
  beatchUpdateById,
  removeByIds,
  logicRemoveByIds
};
