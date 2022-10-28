const crypto = require("crypto");
const { JwtConfig } = require('../config/Credenciais');

const algoritimo = JwtConfig.algoritimo;
const chaveSecreta = JwtConfig.chaveSecreta;

function encrypt(texto) {
  const iv = crypto.randomBytes(16);
  const cifra = crypto.createCipheriv(algoritimo, chaveSecreta, iv);
  const encriptar = Buffer.concat([cifra.update(texto), cifra.final()]);

  return iv.toString('hex') + "_" + encriptar.toString("hex");
}

function decrypt(hash) {
  const decifrar = crypto.createDecipheriv(algoritimo, chaveSecreta, Buffer.from(hash.iv, 'hex'));
  const decriptar = Buffer.concat([decifrar.update(Buffer.from(hash.content, 'hex')), decifrar.final()]);

  return decriptar.toString();
}

function getSenhaDecrypt(senhaEncrypt) {
  const senhaSplit = senhaEncrypt.split('_');
  return decrypt({iv: senhaSplit[0], content: senhaSplit[1]});
}

module.exports = {
  encrypt,
  decrypt,
  getSenhaDecrypt
};