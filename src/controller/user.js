import user from '../service/user';
import { tokenAuth, refreshTokenAuth  } from '@/utils/auth';

module.exports = (router) => {
  const userRouter = router.addMoudel('/user');

  userRouter.post('/login', async ({ baseResponse, bodyData }) => {
    const data = await user.login(bodyData);
    const { id, userAccount, updateTime } = data;
    const tokenData = { id, userAccount, updateTime };
    const token = tokenAuth.createToken(tokenData);
    const refreshToken = refreshTokenAuth.createToken(tokenData);
    return baseResponse.success(data, '登录成功', {
      [tokenAuth.headerKey]: token,
      [refreshTokenAuth.headerKey]: refreshToken
    });
  });

  userRouter.get('/current', async ({ baseResponse, tokenInfo }) => {
    return baseResponse.success(await user.getUserInfo(tokenInfo));
  });

  userRouter.get('/logout', async ({ baseResponse, tokenInfo, ws }) => {
    const deviceType = baseResponse.req.headers[$config.deviceType];
    return baseResponse.success(await user.logout(deviceType, tokenInfo, ws), '退出登录成功');
  });
};
