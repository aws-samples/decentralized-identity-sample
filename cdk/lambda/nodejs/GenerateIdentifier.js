const { putKeypair } = require("./lib/dynamodbHelper");
const { EthrDID } = require("ethr-did");
const ethers = require("ethers");
const AWS = require("aws-sdk");
const ddb = new AWS.DynamoDB();

const TABLE_PRIVATE_KEY = process.env.TABLE_PRIVATE_KEY;
const ETHEREUM_ENDPOINT = process.env.ETHEREUM_ENDPOINT;
const provider = new ethers.providers.JsonRpcProvider(ETHEREUM_ENDPOINT);

async function getPrivateKey(username) {
  const paramsPrivateKey = {
    TableName: TABLE_PRIVATE_KEY,
    Key: {
      id: { S: username },
    },
  };

  const res = await ddb.getItem(paramsPrivateKey).promise();
  const privateKey = res.Item.key.S;
  return privateKey;
}

exports.handler = async function (event) {
  try {
    const username = event.requestContext.authorizer.claims["cognito:username"];
    const kp = EthrDID.createKeyPair();
    // keypairをdynamodbに記録する
    await putKeypair(
      username,
      kp.address,
      kp.identifier,
      kp.privateKey,
      kp.publicKey
    );

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        address: kp.address,
        identifier: kp.identifier,
        publicKey: kp.publicKey,
      }),
    };
  } catch (e) {
    console.log(e);
    throw new Error(e);
  }
};
