const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const PORT = 4000;
const usuarioRoute = require("./routes/UsuarioRoute");
const produtoRoute = require("./routes/ProdutoRoute");
const empresaRoute = require("./routes/EmpresaRoute");

app.use(bodyParser.json());
app.use("/images", express.static("images"));
app.use("/usuario", usuarioRoute);
app.use("/produto", produtoRoute);
app.use("/empresa", empresaRoute);

app.listen(PORT, () => console.log("Servidor rodando na porta "+ PORT));