const multer = require("multer");
const express = require("express");
const router = express.Router();
const { validateJWT } = require("../utils/jwt");
const { createProduct, deleteProduct, updateProduct, searchForCategory, searchAll } = require("../database/ProdutoDB");


const storage = multer.diskStorage({
  destination: function(req, file, cb ) {
    cb(null, "images/")
  },
  filename: function(req, file, cb ) {
    let originalName = file.originalname.split(".")
    let fileName = originalName[(originalName.length - 1)];
    cb(null, `${new Date().getTime()}.${fileName}`)
  },
});

const filter = function(req, file, cb ) {
  if(file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: filter
});

// CRIAR UM PRODUTO (COM AUTH)
router.post("/", validateJWT, upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ status: false, mensagem: "Produto não cadastrado. [Imagem não permitida: 012]" });
  }

  if (req.body && req.file.filename && req.body.nome && req.body.descricao && req.body.preco && req.body.categoria && req.body.estoque) {
    req.body.image = req.file.filename;
    const retorno = await createProduct(req.body, req.headers["x-access-token"]);

    if(!retorno['retcode']) {
      return res.send({ status: true, mensagem: "Produto cadastrado com sucesso." });
    }
    return res.status(retorno["retcode"]).json({ status: false, mensagem: retorno["message"] });
  }

  return res.status(400).json({ status: false, mensagem: "Produto não cadastrado. [Falta argumentos na solicitação: 001]" });
});

// DELETAR UM PRODUTO ESPECIFICO (COM AUTH)
router.delete("/", validateJWT, async (req, res) => {
  if (req.body && req.body.id) {
    const retorno = await deleteProduct(req.body.id, req.headers["x-access-token"]);

    if(!retorno['retcode']) {
      return res.send({ status: true, mensagem: "Produto removido com sucesso." });
    }
    return res.status(retorno["retcode"]).json({ status: false, mensagem: retorno["message"] });
  }

  return res.status(400).json({ status: false, mensagem: "Produto não encontrado. [Falta argumentos na solicitação: 003]" });
});

// EDITAR UM PRODUTO ESPECIFICO (COM AUTH)
router.put("/", validateJWT, upload.single("image"), async (req, res) => {
  
  if (req.file) {
    req.body.image = req.file.filename;
  }

  if (req.body && req.body.id && req.body.nome && req.body.descricao && req.body.preco && req.body.categoria && req.body.estoque) {
    const retorno = await updateProduct(req.body, req.headers["x-access-token"]);

    if(!retorno['retcode']) {
      return res.send({ status: true, mensagem: "Produto atualizado com sucesso." });
    }
    return res.status(retorno["retcode"]).json({ status: false, mensagem: retorno["message"] });
  }

  return res.status(400).json({ status: false, mensagem: "Produto não encontrado. [Falta argumentos na solicitação: 005]" });
});

// BUSCAR PRODUTOS DE UMA CATEGORIA ESPEFICICA (SEM AUTH)
router.post("/searchForCategory", async (req, res) => {
  if (req.body && req.body.categoria && req.body.opper) {
    const retorno = await searchForCategory(req.body.opper, req.body.categoria);

    if(!retorno['retcode']) {
      return res.send(retorno);
    }
    return res.status(retorno["retcode"]).json({ status: false, mensagem: retorno["message"] });
  }

  return res.status(400).json({ status: false, mensagem: "Produto não encontrado. [Falta argumentos na solicitação: 007]" });
});

// BUSCAR TODOS OS PRODUTOS (SEM AUTH)
router.post("/searchAll", async (req, res) => {
  if (req.body && req.body.opper) {
    const retorno = await searchAll(req.body.opper);

    if(!retorno['retcode']) {
      return res.send(retorno);
    }
    return res.status(retorno["retcode"]).json({ status: false, mensagem: retorno["message"] });
  }
  return res.status(400).json({ status: false, mensagem: "Nenhum produto encontrado. [Falta argumentos na solicitação: 009]" });
});

module.exports = router;