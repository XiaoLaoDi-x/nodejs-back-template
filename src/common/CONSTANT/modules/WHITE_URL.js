const { serverBaseUrl } = $config;
// WHITE_URL: 接口白名单，无需token的接口列表
const WHITE_URL = ['/user/login'];
export default WHITE_URL;.map(url => `${serverBaseUrl}${url}`);
