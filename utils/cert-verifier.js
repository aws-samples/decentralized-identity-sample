const {
  Certificate,
} = require("@blockcerts/cert-verifier-js/dist/verifier-node.js");
var fs = require("fs");

fs.readFile(
  "../../cert-issuer/data/blockchain_certificates/verifiable-credential.json",
  "utf8",
  async function (err, data) {
    if (err) {
      console.log(err);
    }

    const options = {
      explorerAPIs: [
        {
          key: process.env.ETHERSCAN_APIKEY,
          keyPropertyName: "apikey",
          serviceName: "etherscan",
          //serviceURL: "https://goerli.etherscan.io"
        },
      ],
    };

    let certificate = new Certificate(data, options);
    await certificate.init();
    const verificationResult = await certificate.verify(
      ({ code, label, status, errorMessage }) => {
        console.log("Code:", code, label, " - Status:", status);
        if (errorMessage) {
          console.log(`The step ${code} fails with the error: ${errorMessage}`);
        }
      }
    );

    if (verificationResult.status === "failure") {
      console.log(
        `The certificate is not valid. Error: ${verificationResult.errorMessage}`
      );
    }
  }
);
