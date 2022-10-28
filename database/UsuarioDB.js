const crypto = require("crypto");
const AWS = require("aws-sdk");
const { encrypt, getSenhaDecrypt } = require("../utils/crypto");
const { AwsConfig } = require("../config/Credenciais");

const tableName = "Usuario";
AWS.config.update(AwsConfig);
const dynamodb = new AWS.DynamoDB.DocumentClient();

// CRIAR UM USUARIO
async function createUser(bodyRequest) {
  var userExists = await searchUser(bodyRequest.opper, bodyRequest.email)
  if( userExists === true) {
    return { retcode: 403, message: "Já existe um usuário com esse email cadastrado."}
  }

  const user = {
    id: crypto.randomBytes(32).toString("hex"),
    nome: bodyRequest.nome,
    email: bodyRequest.email,
    senha: encrypt(bodyRequest.senha),
    opper: bodyRequest.opper,
    ativo: true,
    token: "",
    dataCadastro: new Date().toString(),
  }

  var params = {
    TableName: tableName,
    Item: user,
  };

  try {
    await dynamodb.put(params).promise();
    return true;
  } catch (error) {
    console.log("Error: ", error);
    return {retcode: 500, message: "Não foi possivel cadastrar esse usuário. [002]"};
  }
}

// DELETE UM USUARIO
async function deleteUser(opper, id, email) {
  var userExists = await searchUser(opper, email, id)
  if( userExists === false) {
    return { retcode: 403, message: "Nenhum usuário encontrado com esse ID/EMAIL."}
  }

  var params = {
    TableName: tableName,
    Key: {
      id: id,
      email: email,
    },
  };

  try {
    await dynamodb.delete(params).promise();
    return true;
  } catch (error) {
    console.log("Error: ", error);
    return {retcode: 500, message: "Não foi possivel remover esse usuário. [004]"};
  }
}

// EDITA UM USUARIO
async function updateUser(opper, user) {
  var userExists = await searchUser(opper, user.email, user.id)
  if( userExists === false) {
    return { retcode: 403, message: "Nenhum usuário encontrado com esse ID/EMAIL."}
  }

  var params = {
    TableName: tableName,
    Key: {
      id: user.id,
      email: user.email,
    },
    UpdateExpression: "set nome = :nome",
    ExpressionAttributeValues: {
      ":nome": user.nome,
    },
    ReturnValues: "UPDATED_NEW",
  };

  try {
    await dynamodb.update(params).promise();
    return true;
  } catch (error) {
    console.log("Error: ", error);
    return {retcode: 500, message: "Não foi possivel atualizar esse usuário. [006]"};
  }
}

// FAZ O LOGIN DO USER
async function searchEmailPassword(opper, email, senha) {
  var errorVariable = { retcode: 403, message: "Usuário/senha não encontrado ou inválido."}
  var params = {
    TableName: tableName,
    FilterExpression: "email = :email AND opper = :opper",
    ExpressionAttributeValues: {
      ":email": email,
      ":opper": opper,
    },
  };

  try {
    const dados = await dynamodb.scan(params).promise();

    if(dados && dados.Count > 0) {
      const usuario = dados.Items[0];
      const senhaDecrypt = getSenhaDecrypt(usuario.senha);
      return (senha === senhaDecrypt) ? usuario : errorVariable;
    }

    return errorVariable;
  } catch (error) {
    console.log("Error: ", error);
    return {retcode: 500, message: "Não foi possivel fazer login no momento, tente mais tarde. [008]"};
  }
}

// VERIFICA SE O USUARIO EXISTE (FUNÇÃO INTERNA)
async function updateUserToken(id, email, opper, token) {
  var userExists = await searchUser(opper, email, id)
  if( userExists === false) {
    return { retcode: 403, message: "Nenhum usuário encontrado com esse ID/EMAIL."}
  }

  var params = {
    TableName: tableName,
    Key: {
      id: id,
      email: email,
    },
    UpdateExpression: "set #ts = :ts",
    ExpressionAttributeValues: {
      ":ts": token,
    },
    ExpressionAttributeNames: {
      "#ts": "token"
    },
    ReturnValues: "UPDATED_NEW",
  };

  try {
    await dynamodb.update(params).promise();
    return true;
  } catch (error) {
    console.log("Error: ", error);
    return false;
  }
}

// VERIFICA SE O USUARIO EXISTE (FUNÇÃO INTERNA)
async function searchUser(opper, email, id = false) {
  var params = {
    TableName: tableName,
    FilterExpression: "email = :email AND opper = :opper",
    ExpressionAttributeValues: {
      ":email": email,
      ":opper": opper,
    },
  };

  try {
    const dados = await dynamodb.scan(params).promise();
    
    if(dados && dados.Count > 0) {
      if(id) {
        const usuario = dados.Items[0];
        return usuario.id == id ? true : false;
      }
      return true;
    }

    return false;
  } catch (error) {
    console.log("Error: ", error);
    return false;
  }
}

module.exports = {
  createUser,
  deleteUser,
  updateUser,
  searchEmailPassword,
  updateUserToken,
};
