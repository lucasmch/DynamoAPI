const express = require("express");
const router = express.Router();
const { validateAdminJWT, generateTokenJwt } = require("../utils/jwt");
const { createUser, deleteUser, updateUser, searchEmailPassword } = require("../database/UsuarioDB");

// CRIAR UM USUARIO (COM AUTH)
router.post("/", validateAdminJWT, async (req, res) => {
  if (req.body && req.body.nome && req.body.senha && req.body.email && req.body.opper) {
    const retorno = await createUser(req.body);

    if(!retorno['retcode']) {
      return res.send({ status: true, mensagem: "Usuário cadastrado com sucesso." });
    }
    return res.status(retorno["retcode"]).json({ status: false, mensagem: retorno["message"] });
  }

  return res.status(400).json({ status: false, mensagem: "Usuário não cadastrado. [Falta argumentos na solicitação: 001]" });
});

// DELETE UM USUARIO (COM AUTH)
router.delete("/", validateAdminJWT, async (req, res) => {
  if (req.body && req.body.id && req.body.email && req.body.opper) {
    const retorno = await deleteUser(req.body.opper, req.body.id, req.body.email);

    if(!retorno['retcode']) {
      return res.send({ status: true, mensagem: "Usuário removido com sucesso." });
    }
    return res.status(retorno["retcode"]).json({ status: false, mensagem: retorno["message"] });
  }

  return res.status(400).json({ status: false, mensagem: "Usuário não encontrado. [Falta argumentos na solicitação: 003]" });
});

// EDITA UM USUARIO (COM AUTH)
router.put("/", validateAdminJWT, async (req, res) => {
  if (req.body && req.body.id && req.body.email && req.body.nome && req.body.opper) {
    const retorno = await updateUser(req.body.opper, req.body);

    if(!retorno['retcode']) {
      return res.send({ status: true, mensagem: "Usuário atualizado com sucesso." });
    }
    return res.status(retorno["retcode"]).json({ status: false, mensagem: retorno["message"] });
  }

  return res.status(400).json({ status: false, mensagem: "Usuário não encontrado. [Falta argumentos na solicitação: 005]" });
});

// FAZ O LOGIN DO USER (SEM AUTH)
router.post("/login", async (req, res) => {
  if (req.body && req.body.email && req.body.senha && req.body.opper) {
    const dados = await searchEmailPassword(req.body.opper, req.body.email, req.body.senha);

    if(!dados['retcode']) {
      const token = generateTokenJwt(dados.id, dados.email, dados.opper);
      const user = {
        nome: dados.nome,
        email: dados.email,
        opper: dados.opper,
        ativo: dados.ativo,
        auth: true,
        token: token,
      }
      return res.send(user);
    }
    return res.status(dados["retcode"]).json({ status: false, mensagem: dados["message"] });
  }

  return res.status(400).json({ status: false, mensagem: "Usuário não encontrado. [Falta argumentos na solicitação: 007]" });
});

module.exports = router;