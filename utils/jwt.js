const jwt = require("jsonwebtoken");
const { JwtConfig } = require('../config/Credenciais');
const SECRET = JwtConfig.SECRET;
const SECRETADMIN = JwtConfig.SECRETADMIN;
const TEMPO_EXPIRACAO = 600; // 10 minutos
const { updateUserToken } = require("../database/UsuarioDB");

// DECIDE SE O TOKEN GERADO SERÁ DE ADM OU DE USER
function generateTokenJwt(id, email, opper) {
  const TOKEN_KEY = opper == "ADMIN" ? SECRETADMIN : SECRET;
  const token = jwt.sign({ id }, TOKEN_KEY, { expiresIn: TEMPO_EXPIRACAO });

  if(token && updateUserToken(id, email, opper, token)) {
    return token;
  }

  return false;
}

// VALIDA SE O TOKEN É DE UM USUARIO E SE FOR PERMITE
function validateJWT(req, res, next) {
  const token = req.headers["x-access-token"];

  if (!token) {
    return res.status(401).json({ auth: false, status: false, mensagem: "O token não foi fornecido. [001]" });
  }

  jwt.verify(token, SECRET, function(err, decoded) {
    if(err) {
      return res.status(401).json({ auth: false, status: false, mensagem: "Falha para autenticar com o token. [002]" });
    }
    
    req.userId = decoded.id;
    next();
  });
}

// VALIDA SE O TOKEN É DE ADM E SE FOR PERMITE
function validateAdminJWT(req, res, next) {
  const token = req.headers["x-access-token"];

  if (!token) {
    return res.status(401).json({ auth: false, status: false, mensagem: "O token não foi fornecido. [003]" });
  }

  jwt.verify(token, SECRETADMIN, function(err, decoded) {
    if(err) {
      return res.status(401).json({ auth: false, status: false, mensagem: "Falha para autenticar com o token. [004]" });
    }

    req.userId = decoded.id;
    next();
  });
}

module.exports = {
  validateJWT,
  validateAdminJWT,
  generateTokenJwt,
}