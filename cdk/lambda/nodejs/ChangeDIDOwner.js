const { getKeypair } = require("./lib/dynamodbHelper");
const { EthrDID } = require("ethr-did");
const ethers = require("ethers");
const AWS = require("aws-sdk");

const ETHEREUM_ENDPOINT = process.env.ETHEREUM_ENDPOINT;
const provider = new ethers.providers.JsonRpcProvider(ETHEREUM_ENDPOINT);

exports.handler = async function (event) {
  try {
    const body = JSON.parse(event.body);
    console.log(body);
    const identifier = body.identifier;
    const address = body.signerAddress;
    const new_owner_address = body.new_owner_address;

    const username = event.requestContext.authorizer.claims["cognito:username"];
    // keypairをdynamodbから取得する
    const kp = await getKeypair(username, address);
    const keypair = {
      address: kp.address.S,
      identifier: kp.identifier.S,
      publicKey: kp.publicKey.S,
      privateKey: kp.privateKey.S,
    };
    const wallet = new ethers.Wallet(keypair.privateKey, provider);
    const chainNameOrId = (await provider.getNetwork()).chainId;

    const ethrDid = new EthrDID({
      identifier: identifier,
      provider,
      chainNameOrId,
      txSigner: wallet,
      registry: "0xdca7ef03e98e0dc2b855be647c39abe984fcf21b",
    });
    await ethrDid.changeOwner(new_owner_address);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: "success",
    };
  } catch (e) {
    console.log(e);
    return {
      statusCode: 400,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(e),
    };
  }
};
