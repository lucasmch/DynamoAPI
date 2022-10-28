const crypto = require('crypto');
const AWS = require('aws-sdk');
const { AwsConfig } = require('../config/Credenciais');

const tableName = "Empresa";
const tableNameUsers = "Usuario";
AWS.config.update(AwsConfig);
const dynamodb = new AWS.DynamoDB.DocumentClient();

// CRIAR UMA EMPRESA
async function createBussines(bodyRequest) {
  var bussinesExits = await searchBussines(bodyRequest.id)
  if( bussinesExits == true) {
    return {retcode: 403, message: "Já existe uma empresa com esse ID cadastrado."};
  }

  const bussines = {
    id: bodyRequest.id,
    nome: bodyRequest.nome,
    email: bodyRequest.email,
    telefone: bodyRequest.telefone,
    endereco: bodyRequest.endereco,
    descricao: bodyRequest.descricao,
    dataCadastro: new Date().toString(),
  }

  var params = {
    TableName: tableName,
    Item: bussines
  };

  try {
    await dynamodb.put(params).promise();
    return true;
  } catch (error) {
    console.log("Error: ", error);
    return {retcode: 500, message: "Não foi possivel cadastrar essa empresa. [002]"};
  }
}

// DELETAR UMA EMPRESA ESPECIFICO
async function deleteBussines(id) {
  var bussinesExits = await searchBussines(id)
  if( bussinesExits == false) {
    return {retcode: 403, message: "Nenhuma empresa encontrada com esse ID."};
  }
  
  var params = {
    TableName: tableName,
    Key: {
      id: id
    }
  };

  try {
    await dynamodb.delete(params).promise();
    return true;
  } catch (error) {
    console.log("Error: ", error);
    return {retcode: 500, message: "Não foi possivel remover esse produto. [004]"};
  }

}

// EDITAR UMA EMPRESA ESPECIFICO
async function updateBussines(bussines, token) {
  var bussinesExits = await searchBussines(bussines.id)
  if( bussinesExits == false) {
    return {retcode: 403, message: "Nenhuma empresa encontrada com esse ID."};
  }

  var opper = await getOpper(token);
  if(opper["retcode"]) {
    return {retcode: opper["retcode"], message: opper["message"]};
  }

  if(opper != bussines.id) {
    return {retcode: 401, message: "Você não pode editar essa empresa."};
  }

  var params = {
    TableName: tableName,
    Key: {
      id: bussines.id
    },
    UpdateExpression: "set nome = :nome, email = :email, telefone = :telefone, endereco = :endereco, descricao = :descricao",
    ExpressionAttributeValues: {
      ":nome": bussines.nome,
      ":email": bussines.email,
      ":telefone": bussines.telefone,
      ":endereco": bussines.endereco,
      ":descricao": bussines.descricao,
    },
    ReturnValues: "UPDATED_NEW"
  };

  try {
    await dynamodb.update(params).promise();
    return true;
  } catch (error) {
    console.log("Error: ", error);
    return {retcode: 500, message: "Não foi possivel atualizar essa empresa. [006]"};
  }
}

// BUSCAR UMA EMPRESA PELO SEU ID
async function searchForID(id) {
  var params = {
    TableName: tableName,
    FilterExpression: "id = :id",
    ExpressionAttributeValues: {
      ":id": id,
    },
  };

  try {
    const dados = await dynamodb.scan(params).promise();

    if(dados && dados.Count > 0) {
      return dados.Items;
    }

    return {retcode: 200, message: "Essa empresa não existe."};
  } catch (error) {
    console.log("Error: ", error);
    return {retcode: 500, message: "Não foi possivel encotrar essa empresa. [008]"};
  }
}

// BUSCAR TODAS AS EMPRESAS
async function searchAll() {
  var params = {
    TableName: tableName,
  };

  try {
    const dados = await dynamodb.scan(params).promise();

    if(dados && dados.Count > 0) {
      return dados.Items;
    }

    return {retcode: 200, message: "Essa existe nenhuma empresa."};
  } catch (error) {
    console.log("Error: ", error);
    return {retcode: 500, message: "Não foi possivel encotrar nenhuma empresa. [010]"};
  }
}

// VERIFICA SE A EMPRESA EXISTE (FUNÇÃO INTERNA)
async function searchBussines(id) {
  var params = {
    TableName: tableName,
    FilterExpression: "id = :id",
    ExpressionAttributeValues: {
      ":id": id,
    },
  };

  try {
    const dados = await dynamodb.scan(params).promise();
    
    if(dados && dados.Count > 0) {
      return true;
    }

    return false;
  } catch (error) {
    console.log("Error: ", error);
    return false;
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

module.exports = {
  createBussines,
  deleteBussines,
  updateBussines,
  searchForID,
  searchAll,
}