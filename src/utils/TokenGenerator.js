import jwt from 'jsonwebtoken';

class TokenGenerator {
  constructor(options = {}) {
    const { privateKey, publicKey, ...otherOptions } = options;
    this.secretOrPrivateKey = privateKey;
    this.secretOrPublicKey = publicKey || privateKey;
    this.options = otherOptions; // algorithm + keyid + noTimestamp + expiresIn + notBefore
  }
  sign(payload, signOptions = {}) {
    const jwtSignOptions = { ...signOptions, ...this.options };
    return jwt.sign(payload, this.secretOrPrivateKey, jwtSignOptions);
  }
  // refreshOptions.verify = 与验证功能一起使用的选项
  // refreshOptions.sign = 签名令牌函数第二个参数
  refresh(token, refreshOptions = {}) {
    let payload = token;
    if (typeof token === 'string') {
      payload = this.verify(token, refreshOptions.verify);
    }
    delete payload.sub;
    delete payload.iss;
    delete payload.aud;
    delete payload.iat;
    delete payload.exp;
    delete payload.nbf;
    delete payload.jti; // 生成一个新的令牌，如果您在签名期间使用jwtid，请在refreshOptions中传递它
    // 第一次签名将所有需要的选项转换为声明，它们已经在有效载荷中
    return this.sign(payload, refreshOptions.sign);
  }
  /**
   * iss(Issuser)：签发时值是“a.com”，验证时值不是“a.com”就属于验证失败
   * sub(Subject)：签发时值是“liuyunzhuge”，验证时值不是“liuyunzhuge”就属于验证失败
   * aud(Audience)：签发时值是“['b.com','c.com']”，验证时值至少要包含b.com，c.com的其中一个才能验证通过
   * exp(Expiration time)：验证时超过了指定的时间，就属于验证失败；
   * nbf(Not Before)：验证时小于指定的时间，就属于验证失败
   * iat(Issued at)：它可以用来做一些maxAge之类的验证，验证时间与指定的时间相差的时间大于通过maxAge指定的一个值，就属于验证失败
   * jti(JWT ID)：签发时值是“1”，验证时值不是“1”就属于验证失败
   */
  verify(token, verify) {
    const payload = jwt.verify(token, this.secretOrPublicKey, verify);
    return payload;
  }
  decode(token, option) {
    return jwt.decode(token, option);
  }
}

export default TokenGenerator;
