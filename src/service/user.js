import User from '@/dao/modules/user';
import { setRedis  } from '@/utils/auth';

const user = new User();

function getSafeUserData(userInfo) {
  const params = { ...userInfo };
  delete params.userPassword;
  return params;
}

async function login({ userAccount, password }) {
  if (!password || !userAccount) {
    throw new Error('用户名或者密码错误');
  }
  const [infoData] = await user.select({
    userAccount, userPassword: password
  });
  if (!infoData) {
    throw new Error('用户名或者密码错误');
  }
  const safeData = getSafeUserData(infoData);
  return safeData;
}

async function getUserInfo({ id }) {
  if (!id) {
    throw new Error('参数错误');
  }
  const [infoData] = await user.select({ id });
  return getSafeUserData(infoData);
}

async function logout(deviceType, tokenInfo) {
  await setRedis(tokenInfo.id, deviceType, []);
  return '';
}

export {
  login,
  getUserInfo,
  logout
};
