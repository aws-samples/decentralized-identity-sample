const { EthrDID } = require("ethr-did");
const { Resolver } = require("did-resolver");
const ethr = require("ethr-did-resolver");
const ethers = require("ethers");
const AWS = require("aws-sdk");

const ETHEREUM_ENDPOINT = process.env.ETHEREUM_ENDPOINT;
const provider = new ethers.providers.JsonRpcProvider(ETHEREUM_ENDPOINT);

exports.handler = async function (event) {
  try {
    const body = JSON.parse(event.body);

    const chainNameOrId = (await provider.getNetwork()).chainId;
    const providerConfig = {
      rpcUrl: provider.connection.url,
      registry: "0xdca7ef03e98e0dc2b855be647c39abe984fcf21b", // ERC1056のRegistry Contract Address
      chainId: chainNameOrId,
      provider,
    };
    const ethrResolver = ethr.getResolver(providerConfig);
    const didResolver = new Resolver(ethrResolver);

    const ethrDid = new EthrDID({
      identifier: body.identifier,
      provider,
      chainNameOrId,
      registry: "0xdca7ef03e98e0dc2b855be647c39abe984fcf21b",
    });
    try {
      const { payload, issuer } = await ethrDid.verifyJWT(
        body.jwt,
        didResolver
      );
      console.log("issuer: ", issuer);
      console.log("payload: ", payload);

      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          issuer: issuer,
          payload: payload,
        }),
      };
    } catch (error) {
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
