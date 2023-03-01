const { EthrDID } = require("ethr-did");
const { Resolver } = require("did-resolver");
const ethr = require("ethr-did-resolver");
const ethers = require("ethers");

const ETHEREUM_ENDPOINT = process.env.ETHEREUM_ENDPOINT;
const provider = new ethers.providers.JsonRpcProvider(ETHEREUM_ENDPOINT);

exports.handler = async function (event) {
  try {
    const did_url = event.queryStringParameters.did_url;

    const chainNameOrId = (await provider.getNetwork()).chainId;
    const providerConfig = {
      rpcUrl: provider.connection.url,
      registry: "0xdca7ef03e98e0dc2b855be647c39abe984fcf21b", // ERC1056のRegistry Contract Address
      chainId: chainNameOrId,
      provider,
    };
    const ethrResolver = ethr.getResolver(providerConfig);
    const didResolver = new Resolver(ethrResolver);

    try {
      const didDocument = (await didResolver.resolve(did_url)).didDocument;
      console.log(didDocument);

      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          didDocument,
        }),
      };
    } catch (error) {
      console.log(error);
      return {
        statusCode: 403,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error: error,
        }),
      };
    }
  } catch (e) {
    console.log(e);
    throw new Error(e);
  }
};
