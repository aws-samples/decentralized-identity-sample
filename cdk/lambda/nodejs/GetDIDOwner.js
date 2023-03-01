const { getKeypair } = require("./lib/dynamodbHelper");
const { EthrDID } = require("ethr-did");
const ethers = require("ethers");
const AWS = require("aws-sdk");
const ddb = new AWS.DynamoDB();

const TABLE_PRIVATE_KEY = process.env.TABLE_PRIVATE_KEY;
const ETHEREUM_ENDPOINT = process.env.ETHEREUM_ENDPOINT;
const provider = new ethers.providers.JsonRpcProvider(ETHEREUM_ENDPOINT);

exports.handler = async function (event) {
  try {
    const identifier = event.queryStringParameters.identifier;

    const chainNameOrId = (await provider.getNetwork()).chainId;

    const ethrDid = new EthrDID({
      identifier: identifier,
      provider,
      chainNameOrId,
      registry: "0xdca7ef03e98e0dc2b855be647c39abe984fcf21b",
    });
    const owner = await ethrDid.lookupOwner();

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "text/plain",
        "Access-Control-Allow-Origin": "*",
      },
      body: owner,
    };
  } catch (e) {
    console.log(e);
    throw new Error(e);
  }
};
