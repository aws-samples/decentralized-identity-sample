const AWS = require("aws-sdk");
const { putJwt, getJwt } = require("./lib/dynamodbHelper");
const url = require("url");
const path = require("path");
const { EthrDID } = require("ethr-did");
const { Resolver } = require("did-resolver");
const ethr = require("ethr-did-resolver");
const ethers = require("ethers");

const s3 = new AWS.S3({ signatureVersion: "v4" });
const VC_BUCKET_NAME = process.env.VC_BUCKET_NAME;
const ETHEREUM_ENDPOINT = process.env.ETHEREUM_ENDPOINT;
const provider = new ethers.providers.JsonRpcProvider(ETHEREUM_ENDPOINT);

const headerTemplate = {
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "OPTIONS,GET",
};

async function getSvcDownloadLink(document, svcName) {
  // didドキュメントからsvcのパスを抽出
  const documentLength = document.didDocument.service.length;
  for (let index = 0; index < documentLength; index++) {
    if (
      document &&
      document.didDocument.service &&
      document.didDocument.service[index].type == svcName
    ) {
      console.log(document.didDocument.service[index]);
      // s3の保存先URLを使う。
      const urlParsed = url.parse(
        document.didDocument.service[index].serviceEndpoint.toString()
      );
      console.log(urlParsed);
      console.log(urlParsed.pathname?.split(path.sep));
      const username = urlParsed.pathname?.split(path.sep)[4];
      const filename = urlParsed.pathname?.split(path.sep)[5];

      const params = { Bucket: VC_BUCKET_NAME, Key: `${username}/${filename}` };

      const downloadUrl = await s3.getSignedUrlPromise("getObject", params);
      console.log(downloadUrl);

      return downloadUrl;
    }
  }
}
// identifierとsvcNameを指定してコンテンツをS3からDL
exports.handler = async function (event) {
  console.log(event.queryStringParameters);

  const identifier = event.queryStringParameters?.identifier;
  const svcName = event.queryStringParameters?.svcName;
  console.log(identifier);
  console.log(svcName);
  // 空欄の場合はエラーにする
  if (identifier == undefined || svcName == undefined) {
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "OPTIONS,GET",
      },
      body: JSON.stringify({
        error_message: "filename or identifier is undefined",
      }),
    };
  } else {
    const chainNameOrId = (await provider.getNetwork()).chainId;

    const ethrDid = new EthrDID({
      identifier: identifier,
      provider,
      chainNameOrId,
      registry: "0xdca7ef03e98e0dc2b855be647c39abe984fcf21b",
    });

    const providerConfig = {
      rpcUrl: provider.connection.url,
      registry: "0xdca7ef03e98e0dc2b855be647c39abe984fcf21b", // ERC1056のRegistry Contract Address
      chainId: chainNameOrId,
      provider,
    };
    const ethrResolver = ethr.getResolver(providerConfig);
    const didResolver = new Resolver(ethrResolver);

    const jwt = event.headers.Authorization || "";
    console.log("jwt: ", jwt);

    // jwtの検証フラグ
    let jwt_verified = false;

    let payload;
    let issuer;
    let didResolutionResult;

    try {
      // jwtがdynamobdにキャッシュされているか確認
      let jwtCached = await getJwt(jwt);
      if (!jwtCached || jwtCached == {}) {
        // キャッシュされていない場合は、検証する
        const verifiedJWT = await ethrDid.verifyJWT(jwt, didResolver);
        console.log("verifiedJWT: ", verifiedJWT);
        console.log("issuer: ", verifiedJWT.issuer);
        console.log("payload: ", verifiedJWT.payload);
        console.log("didResolutionResult: ", verifiedJWT.didResolutionResult);

        // jwtの検証結果から使用する項目を抽出
        payload = verifiedJWT.payload;
        issuer = verifiedJWT.issuer;
        didResolutionResult = verifiedJWT.didResolutionResult;

        // 検証がOKであればjwt_verifyをtrueにする.
        if (verifiedJWT.verified) {
          jwt_verified = true;

          // dynamodbにjwtをキャッシュ
          putJwt(
            jwt,
            JSON.stringify(payload),
            issuer,
            JSON.stringify(didResolutionResult),
            payload?.exp || 1
          );
        }
      } else {
        console.log("jwtCached: ", jwtCached);
        // キャッシュされている場合はjwt_verifiedをtrueにする
        jwt_verified = true;

        // dynamodbから使用する項目を抽出
        payload = JSON.parse(jwtCached.payload.S || "");
        issuer = jwtCached.issuer.S || "";
        didResolutionResult = JSON.parse(jwtCached.didResolutionResult.S || "");
      }

      // didドキュメントの取得
      const document = didResolutionResult;
      console.log(document.service);

      // didドキュメントにsvcがなかったらエラーを返す
      if (!document.didDocument.service) {
        return {
          statusCode: 404,
          headers: {
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "OPTIONS,GET",
          },
          body: JSON.stringify({ error_message: "service not found" }),
        };
      }

      if (jwt_verified) {
        // didドキュメントからsvcのパスを抽出
        //const documentLength = document.didDocument.service.length
        const downloadUrl = await getSvcDownloadLink(document, svcName);

        return {
          statusCode: 200,
          headers: headerTemplate,
          body: JSON.stringify({ downloadUrl }),
        };

        //   }
        // }
      } else {
        // 認証失敗を返す
        return {
          statusCode: 401,
          headers: headerTemplate,
          body: JSON.stringify({ error_message: "jwt unverified" }),
        };
      }
    } catch (error) {
      console.log(error);
      return {
        statusCode: 500,
        headers: headerTemplate,
        body: JSON.stringify({
          error_message: "someting happen. please contact to service owner",
        }),
      };
    }
  }
};
