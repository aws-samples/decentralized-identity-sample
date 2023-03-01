const ethers = require("ethers");

async function main() {
  let randomWallet = ethers.Wallet.createRandom();

  let returnParam = {
    address: randomWallet.address,
    privateKey: randomWallet.privateKey,
    publicKey: randomWallet.publicKey,
  };

  console.log(returnParam);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
