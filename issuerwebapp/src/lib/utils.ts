import { Web3Provider } from "@ethersproject/providers";
import ethr from "ethr-did-resolver";
import { Resolver } from "did-resolver";
import { EthrDID } from "ethr-did";

export async function getDidResolver(provider: Web3Provider) {
  //const provider = new Web3Provider(window.ethereum);
  const chainNameOrId = (await provider.getNetwork()).chainId;
  const providerConfig = {
    rpcUrl: provider.connection.url,
    registry: "0xdca7ef03e98e0dc2b855be647c39abe984fcf21b", // ERC1056のRegistry Contract Address
    chainId: chainNameOrId,
    provider,
  };
  const ethrResolver = ethr.getResolver(providerConfig);
  const didResolver = new Resolver(ethrResolver);

  return didResolver;
}

export async function getEthrDidWithKeypair(
  provider: Web3Provider,
  keypair: any,
  identifier: any = null
) {
  const chainNameOrId = (await provider.getNetwork()).chainId;
  const accounts = await provider.listAccounts();

  if (identifier == null) {
    identifier = accounts[0];
  }
  const ethrDid = new EthrDID({
    ...keypair,
    identifier: identifier,
    provider,
    chainNameOrId,
    txSigner: provider.getSigner(accounts[0]),
    registry: "0xdca7ef03e98e0dc2b855be647c39abe984fcf21b",
  });
  return ethrDid;
}

export async function getEthrDidWithoutKeypair(
  provider: Web3Provider,
  identifier: any = null
) {
  const chainNameOrId = (await provider.getNetwork()).chainId;
  const accounts = await provider.listAccounts();

  if (identifier == null) {
    identifier = accounts[0];
  }
  console.log("identifier: ", identifier);
  const ethrDid = new EthrDID({
    identifier: identifier,
    provider,
    chainNameOrId,
    txSigner: provider.getSigner(accounts[0]),
    registry: "0xdca7ef03e98e0dc2b855be647c39abe984fcf21b",
  });
  return ethrDid;
}
