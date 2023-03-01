const {
  Certificate,
} = require("@blockcerts/cert-verifier-js/dist/verifier-node.js");

const ETHERSCAN_APIKEY = process.env.ETHERSCAN_APIKEY;

exports.handler = async function (event) {
  try {
    const options = {
      explorerAPIs: [
        {
          key: ETHERSCAN_APIKEY,
          keyPropertyName: "apikey",
          serviceName: "etherscan",
          //serviceURL: "https://goerli.etherscan.io"
        },
      ],
    };

    try {
      const certificate = new Certificate(event.body, options);
      await certificate.init();
      const verificationResult = await certificate.verify(
        ({ code, label, status, errorMessage }) => {
          console.log("Code:", code, label, " - Status:", status);
          if (errorMessage) {
            console.log(
              `The step ${code} fails with the error: ${errorMessage}`
            );
          }
        }
      );

      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          status: verificationResult.status,
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
