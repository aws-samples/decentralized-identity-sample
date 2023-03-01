Verifier用のWebAppをデプロイ/ Deploy WebApp for Verifier
===

## CDKを使ったデプロイ

- verifierwebappをビルドする  
Build verifier webapp

```
$ cd verifierwebapp/
$ npm install
$ npm run build
```
- ビルド済み資材が`verifierwebapp/dist/`に保存されたことを確認する  
builded package are stored in `verifierwebapp/dist/`  
```
$ ls dist/
css  favicon.ico  fonts  index.html  js
```

- アクセス可能なIPアドレスを制限するために、環境変数を設定する.  
Assuming it's a demo environment, set environment variables to limit the IP addresses that can be accessed.
```
$ export SOURCE_IP_ADDRESS=xxx.xxx.xxx.xxx/32
$ export ETHEREUM_ENDPOINT=https://ETHEREUM_ENDPOINT
```

- アクセス可能な国を制限するために、環境変数を設定する.  
コンテンツの地理的ディストリビューションの制限についてはこちらを参照してください  
Assume that it is a verification environment and set environment variables to limit the countries that can be accessed.  
Please check here for restricting the geographic distribution of content  
https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/georestrictions.html  
リージョン名はISO3166-1で定義されているフォーマットです.  
Region name are in the format defined by ISO3166-1
https://ja.wikipedia.org/wiki/ISO_3166-1

```
$ export ACCESS_FROM_REGION=JP
```

- CDKを使用してデプロイする。出力結果はメモしておくこと  
Deploy with CDK. Please note of the results.
```
$ cdk deploy VerifierWebapp
```
```
VerifierWebapp.ApiEndpointForVerifierWebApp = https://aaaaaaaaa.execute-api.ap-northeast-1.amazonaws.com/prod/
VerifierWebapp.DIDVerifierApiEndpoint3B20006C = https://aaaaaaaaa.execute-api.ap-northeast-1.amazonaws.com/prod/
VerifierWebapp.DIDViewerEndpointForVerifier = https://xxxxxxxxxxx.cloudfront.net
VerifierWebapp.UserPoolIdForVerifierWebApp = ap-northeast-cccccccccccc
VerifierWebapp.UserPoolWEBClientIdForVerifierWebApp = ddddddddddddd
```

- CDKの出力結果を使用してvuejs用の設定ファイルを作成する  
Modify vue.js config with CDK results.
```
$ vi .env.local
```
```
VUE_APP_AWS_REGION=ap-northeast-1
VUE_APP_API_ENDPOINT=https://aaaaaaaaa.execute-api.ap-northeast-1.amazonaws.com/prod/
VUE_APP_USER_POOL_ID=ap-northeast-cccccccccccc
VUE_APP_USER_POOL_WEB_CLIENT_ID=ddddddddddddd
```

- 設定ファイルを反映するために再度webappをビルドする  
Build the webapp again to reflect the configuration files.  
```
$ npm run build
```

- 再度CDKでデプロイすることで変更した設定ファイルの内容が反映される。  
The contents of the changed configuration file are reflected by deploying again with CDK.
```
$ cdk deploy VerifierWebapp
```

- ブラウザを使用して`DIDViewerEndpointForVerifier`にアクセスする  
Access to `DIDViewerEndpointForVerifier` via your browser

![](../images/verifier_webapp.png)

