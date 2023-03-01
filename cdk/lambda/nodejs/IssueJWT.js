const { getKeypair } = require("./lib/dynamodbHelper");
const { EthrDID } = require("ethr-did");
const ethers = require("ethers");

const ETHEREUM_ENDPOINT = process.env.ETHEREUM_ENDPOINT;
const provider = new ethers.providers.JsonRpcProvider(ETHEREUM_ENDPOINT);

exports.handler = async function (event) {
  try {
    const address = event.queryStringParameters.address;
    const identifier = event.queryStringParameters.identifier;

    const username = event.requestContext.authorizer.claims["cognito:username"];
    // keypairをdynamodbから取得する
    const kp = await getKeypair(username, address);
    const keypair = {
      address: kp.address.S,
      identifier: kp.identifier.S,
      publicKey: kp.publicKey.S,
      privateKey: kp.privateKey.S,
    };
    console.log("keypair", keypair);

    const chainNameOrId = (await provider.getNetwork()).chainId;

    const ethrDid = new EthrDID({
      ...keypair,
      identifier: identifier,
      provider,
      chainNameOrId,
      registry: "0xdca7ef03e98e0dc2b855be647c39abe984fcf21b",
    });
    // keypairを使ってjwtを発行する
    const jwt = await ethrDid.signJWT();
    console.log("verification", jwt);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "text/plain",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(jwt),
    };
  } catch (e) {
    console.log(e);
    throw new Error(e);
  }
};
