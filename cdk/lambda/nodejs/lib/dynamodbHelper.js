const AWS = require("aws-sdk");
const TableName = process.env.TABLE_KEYPAIR || null;
const SessionTableName = process.env.SESSION_TABLE_NAME || null;

const ddb = new AWS.DynamoDB();

async function putKeypair(
  username,
  address,
  identifier,
  privateKey,
  publicKey
) {
  // tableNameが未定義ならエラーを返す
  if (!TableName) throw new Error("table name is undefined");

  const params = {
    TableName: TableName,
    Item: {
      username: { S: username },
      address: { S: address },
      identifier: { S: identifier },
      privateKey: { S: privateKey },
      publicKey: { S: publicKey },
    },
  };

  // jwtをdynamodbに記録
  await ddb.putItem(params).promise();
}

async function getKeypairs(username) {
  // tableNameが未定義ならエラーを返す
  if (!TableName) throw new Error("table name is undefined");

  const params = {
    TableName: TableName,
    KeyConditionExpression: "username = :Key",
    ExpressionAttributeValues: {
      ":Key": { S: username },
    },
    ProjectionExpression: "publicKey, address, identifier",
  };

  const data = await ddb.query(params).promise();
  // console.log(params)
  // console.log(data)

  // data.Itemが空なら{}を返す
  return data.Items;
}

async function getKeypair(username, address) {
  // tableNameが未定義ならエラーを返す
  if (!TableName) throw new Error("table name is undefined");

  const params = {
    TableName: TableName,
    KeyConditionExpression: "username = :Key and address = :Address",
    ExpressionAttributeValues: {
      ":Key": { S: username },
      ":Address": { S: address },
    },
    ProjectionExpression: "publicKey, address, identifier, privateKey",
  };

  const data = await ddb.query(params).promise();
  //console.log(params)
  //console.log(data)

  return data.Items[0];
}

async function putJwt(jwt, payload, issuer, didResolutionResult, exp) {
  // tableNameが未定義ならエラーを返す
  if (!SessionTableName) throw new Error("table name is undefined");

  const paramsJobStatus = {
    TableName: SessionTableName,
    Item: {
      jwt: { S: jwt },
      payload: { S: payload },
      issuer: { S: issuer },
      didResolutionResult: { S: didResolutionResult },
      exp: { N: exp.toString() },
    },
  };

  // jwtをdynamodbに記録
  await ddb.putItem(paramsJobStatus).promise();
}

async function getJwt(jwt) {
  // tableNameが未定義ならエラーを返す
  if (!SessionTableName) throw new Error("table name is undefined");

  const paramsJobStatus = {
    TableName: SessionTableName,
    Key: {
      jwt: { S: jwt },
    },
  };

  // jwtをdynamodbに記録
  const data = await ddb.getItem(paramsJobStatus).promise();

  // data.Itemが空なら{}を返す
  return data.Item;
}

exports.putKeypair = putKeypair;
exports.getKeypair = getKeypair;
exports.getKeypairs = getKeypairs;
exports.putJwt = putJwt;
exports.getJwt = getJwt;
