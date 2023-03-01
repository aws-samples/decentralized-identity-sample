const AWS = require("aws-sdk");
const ethers = require("ethers");

const tableName = process.env.TABLE_PRIVATE_KEY;
const ddb = new AWS.DynamoDB();

exports.handler = async function (event) {
  const username = event.userName;

  let account = ethers.Wallet.createRandom();

  const params = {
    TableName: tableName,
    Item: {
      id: { S: username },
      key: { S: account.privateKey },
    },
  };

  await ddb.putItem(params).promise();

  return event;
};
