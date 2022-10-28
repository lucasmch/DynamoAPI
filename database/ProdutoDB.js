const crypto = require('crypto');
const AWS = require('aws-sdk');
const { AwsConfig } = require('../config/Credenciais');
const fs = require('fs');

const tableName = "Produto";
const tableNameUsers = "Usuario";
AWS.config.update(AwsConfig);
const dynamodb = new AWS.DynamoDB.DocumentClient();

// CRIAR UM PRODUTO
async function createProduct(bodyRequest, token) {
  var opper = await getOpper(token);
  if(opper["retcode"]) {
    return {retcode: opper["retcode"], message: opper["message"]};
  }

  const product = {
    id: crypto.randomBytes(32).toString("hex"),
    nome: bodyRequest.nome,
    imagem: bodyRequest.image,
    descricao: bodyRequest.descricao,
    categoria: bodyRequest.categoria,
    preco: bodyRequest.preco,
    opper: opper,
    estoque: bodyRequest.estoque,
    dataCadastro: new Date().toString(),
  }

  var params = {
    TableName: tableName,
    Item: product
  };

  try {
    await dynamodb.put(params).promise();
    return true;
  } catch (error) {
    console.log("Error: ", error);
    return {retcode: 500, message: "Não foi possivel cadastrar esse produto. [002]"};
  }
}

// DELETAR UM PRODUTO ESPECIFICO
async function deleteProduct(id, token) {
  var opper = await getOpper(token);
  if(opper["retcode"]) {
    return {retcode: opper["retcode"], message: opper["message"]};
  }

  var productExists = await searchProductForId(id, opper);
  if(productExists["retcode"]) {
    return {retcode: productExists["retcode"], message: productExists["message"]};
  }
  
  var params = {
    TableName: tableName,
    Key: {
      id: id
    }
  };

  try {
    await dynamodb.delete(params).promise();

    deleteFile(`images/${productExists.imagem}`)
    .catch(
      err=>console.log(err.message)
    );

    return true;
  } catch (error) {
    console.log("Error: ", error);
    return {retcode: 500, message: "Não foi possivel remover esse produto. [004]"};
  }

}

// EDITAR UM PRODUTO ESPECIFICO
async function updateProduct(produto, token) {
  var opper = await getOpper(token);
  if(opper["retcode"]) {
    return {retcode: opper["retcode"], message: opper["message"]};
  }

  var productExists = await searchProductForId(produto.id, opper);
  if(productExists["retcode"]) {
    return {retcode: productExists["retcode"], message: productExists["message"]};
  }

  let newImage = false;
  if(produto.image) {
    newImage = true;
  } else {
    produto.image = productExists.imagem;
  }

  var params = {
    TableName: tableName,
    Key: {
      id: produto.id
    },
    UpdateExpression: "set nome = :nome, descricao = :descricao, preco = :preco, categoria = :categoria, estoque = :estoque, imagem = :imagem",
    ExpressionAttributeValues: {
      ":nome": produto.nome,
      ":descricao": produto.descricao,
      ":preco": produto.preco,
      ":categoria": produto.categoria,
      ":estoque": produto.estoque,
      ":imagem": produto.image,
    },
    ReturnValues: "UPDATED_NEW"
  };

  try {
    await dynamodb.update(params).promise();
    if(newImage) {
      deleteFile(`images/${productExists.imagem}`)
      .catch(
        err=>console.log(err.message)
      );
    }
    return true;
  } catch (error) {
    console.log("Error: ", error);
    return {retcode: 500, message: "Não foi possivel atualizar esse produto. [006]"};
  }
}

// BUSCAR PRODUTOS DE UMA CATEGORIA ESPEFICICA
async function searchForCategory(opper, categoria) {
  var params = {
    TableName: tableName,
    FilterExpression: "categoria = :categoria AND opper = :opper",
    ExpressionAttributeValues: {
      ":categoria": categoria,
      ":opper": opper,
    },
  };

  try {
    const dados = await dynamodb.scan(params).promise();

    if(dados && dados.Count > 0) {
      return dados.Items;
    }

    return {retcode: 200, message: "Não foi encontrado nenhum produto nessa categoria."};
  } catch (error) {
    console.log("Error: ", error);
    return {retcode: 500, message: "Não foi possivel procurar produtos nessa categoria. [008]"};
  }
}

// BUSCAR TODOS OS PRODUTOS
async function searchAll(opper) {
  var params = {
    TableName: tableName,
    FilterExpression: "opper = :opper",
    ExpressionAttributeValues: {
      ":opper": opper
    },
  };

  try {
    const dados = await dynamodb.scan(params).promise();

    if(dados && dados.Count > 0) {
      return dados.Items;
    }

    return {retcode: 200, message: "Não foi encontrado nenhum produto."};
  } catch (error) {
    console.log("Error: ", error);
    return {retcode: 500, message: "Não foi possivel procurar esses produtos. [010]"};
  }
}

// BUSCA UM PRODUTO ESPECIFICO (FUNÇÃO INTERNA)
async function searchProductForId(id, opper) {
  var errorVariable = {
    retcode: 403,
    message: "Nenhum produto encontrado com esse ID."
  }

  var params = {
    TableName: tableName,
    FilterExpression: "id = :id AND opper = :opper",
    ExpressionAttributeValues: {
      ":id": id,
      ":opper": opper,
    },
  };

  try {
    const dados = await dynamodb.scan(params).promise();

    if(dados && dados.Count > 0) {
      return dados.Items[0];
    }

    return errorVariable;
  } catch (error) {
    console.log("Error: ", error);
    return {retcode: 500, message: "Não foi possivel localizar esse produto. [000]"};
  }
}

// BUSCA QUAL OPERADORA USAR (FUNÇÃO INTERNA)
async function getOpper(token) {
  var errorVariable = {
    retcode: 403,
    message: "Nenhuma empresa encontrada para esse usuário."
  }

  var params = {
    TableName: tableNameUsers,
    FilterExpression: "#ts = :ts",
    ExpressionAttributeValues: {
      ":ts": token,
    },
    ExpressionAttributeNames: {
      "#ts": "token"
    },
  };

  try {
    const dados = await dynamodb.scan(params).promise();

    if(dados && dados.Count > 0) {
      const usuario = dados.Items[0];
      return usuario["opper"] && usuario["opper"] != "" ? usuario["opper"] : errorVariable;
    }

    return errorVariable;
  } catch (error) {
    console.log("Error: ", error);
    return errorVariable;
  }
}

function deleteFile(file) {
  return new Promise((resolve, reject) => {
      fs.unlink(file, (err) => {
          if (err) reject(err);
          resolve(`Deleted ${file}`)
      })
  })
}

module.exports = {
  createProduct,
  deleteProduct,
  updateProduct,
  searchAll,
  searchForCategory,
}