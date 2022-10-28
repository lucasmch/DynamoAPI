const express = require("express");
const router = express.Router();
const { validateAdminJWT, validateJWT } = require("../utils/jwt");
const { createBussines, deleteBussines, updateBussines, searchForID, searchAll } = require("../database/EmpresaDB");


// CRIAR UM EMPRESA (COM AUTH)
router.post("/", validateAdminJWT, async (req, res) => {
  if (req.body && req.body.id && req.body.nome && req.body.email && req.body.telefone && req.body.endereco && req.body.descricao) {
    const retorno = await createBussines(req.body);

    if(!retorno['retcode']) {
      return res.send({ status: true, mensagem: "Empresa cadastrada com sucesso." });
    }
    return res.status(retorno["retcode"]).json({ status: false, mensagem: retorno["message"] });
  }

  return res.status(400).json({ status: false, mensagem: "Empresa não cadastrada. [Falta argumentos na solicitação: 001]" });
});

// DELETAR UMA EMPRESA ESPECIFICA (COM AUTH)
router.delete("/", validateAdminJWT, async (req, res) => {
  if (req.body && req.body.id) {
    const retorno = await deleteBussines(req.body.id);

    if(!retorno['retcode']) {
      return res.send({ status: true, mensagem: "Empresa removida com sucesso." });
    }
    return res.status(retorno["retcode"]).json({ status: false, mensagem: retorno["message"] });
  }

  return res.status(400).json({ status: false, mensagem: "Empresa não encontrada. [Falta argumentos na solicitação: 003]" });
});

// EDITAR UMA EMPRESA ESPECIFICO (COM AUTH)
router.put("/", validateJWT, async (req, res) => {
  if (req.body && req.body.id && req.body.nome && req.body.email && req.body.telefone && req.body.endereco && req.body.descricao) {
    const retorno = await updateBussines(req.body, req.headers["x-access-token"]);

    if(!retorno['retcode']) {
      return res.send({ status: true, mensagem: "Produto atualizado com sucesso." });
    }
    return res.status(retorno["retcode"]).json({ status: false, mensagem: retorno["message"] });
  }

  return res.status(400).json({ status: false, mensagem: "Produto não encontrado. [Falta argumentos na solicitação: 005]" });
});

// BUSCAR UMA EMPRESA ESPEFICICA (SEM AUTH)
router.post("/search", async (req, res) => {
  if (req.body && req.body.opper) {
    const retorno = await searchForID(req.body.opper);

    if(!retorno['retcode']) {
      return res.send(retorno);
    }
    return res.status(retorno["retcode"]).json({ status: false, mensagem: retorno["message"] });
  }

  return res.status(400).json({ status: false, mensagem: "Produto não encontrado. [Falta argumentos na solicitação: 007]" });
});

// BUSCAR TODAS AS EMPRESAS (COM AUTH)
router.post("/searchAll", validateAdminJWT, async (req, res) => {
  const retorno = await searchAll();

  if(!retorno['retcode']) {
    return res.send(retorno);
  }
  return res.status(retorno["retcode"]).json({ status: false, mensagem: retorno["message"] });
});

module.exports = router;