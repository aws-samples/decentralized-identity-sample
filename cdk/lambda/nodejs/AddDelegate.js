const { getKeypair } = require("./lib/dynamodbHelper");
const { EthrDID } = require("ethr-did");
const ethers = require("ethers");

const ETHEREUM_ENDPOINT = process.env.ETHEREUM_ENDPOINT;
const provider = new ethers.providers.JsonRpcProvider(ETHEREUM_ENDPOINT);

exports.handler = async function (event) {
  try {
    const body = JSON.parse(event.body);
    console.log(body);
    const identifier = body.identifier;
    const address = body.signerAddress;
    const delegate_address = body.delegate_address;
    const delegate_type = body.delegate_type;
    const delegate_expiresIn = body.delegate_expiresIn;

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
    await ethrDid.addDelegate(delegate_address, {
      delegateType: delegate_type,
      expiresIn: delegate_expiresIn,
    });

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
