import db from '../db';
import DBPlus from '../DBPlus';
import table from '../table/user';

class User extends DBPlus {
  constructor() {
    super(db, table);
  }
}

export default User;
