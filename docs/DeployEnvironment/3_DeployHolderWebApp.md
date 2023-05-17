Holder用のWebAppをデプロイ/Deploy  WebApp for Holder
===

## CDKを使ったデプロイ/Deploy with CDK

- holderwebappをビルドする  
Build holder webapp.
```
$ pwd
decentralized-identity-sample

$ cd holderwebapp/
$ npm install
$ npm run build
```

- ビルド済み資材が`holderwebapp/dist/`に保存されたことを確認する  
builded package are stored in `holderwebapp/dist/`  
```
$ pwd
decentralized-identity-sample/holderwebapp

$ ls dist/
css  favicon.ico  fonts  index.html  js
```

- クセス可能なIPアドレスを制限するために、環境変数を設定する.  
Assuming it's a demo environment, set environment variables to limit the IP addresses that can be accessed.
```
$ export SOURCE_IP_ADDRESS=xxx.xxx.xxx.xxx/32
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
Deploy with CDK. Plelase note of the results.

```
$ cd ../cdk/
$ pwd
decentralized-identity-sample/cdk

$ cdk deploy HolderWebapp
```
```
HolderWebapp.ApiEndpointForHolderWebApp = https://aaaaaaaaa.execute-api.ap-northeast-1.amazonaws.com/prod/
HolderWebapp.DIDHolderApiEndpoint2050CF0D = https://aaaaaaaaa.execute-api.ap-northeast-1.amazonaws.com/prod/
HolderWebapp.DIDViewerEndpointForHolder = https://xxxxxxxxxxx.cloudfront.net
HolderWebapp.HolderVcBucketName = 00000000000-holder-vc-bucket
HolderWebapp.UserPoolIdForHolderWebApp = ap-northeast-cccccccccccc
HolderWebapp.UserPoolWEBClientIdForHolderWebApp = ddddddddddddd
```

- CDKの出力結果を使用してvuejs用の設定ファイルを作成する  
Modify vue.js config with CDK results.
```
$ cd ../holderwebapp/
$ pwd
decentralized-identity-sample/holderwebapp

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
$ pwd
decentralized-identity-sample/holderwebapp

$ npm run build
```

- 再度CDKでデプロイすることで変更した設定ファイルの内容が反映される。  
The contents of the changed configuration file are reflected by deploying again with CDK.
```
$ cd ../cdk/
$ pwd
decentralized-identity-sample/cdk

$ cdk deploy HolderWebapp
```

- ブラウザを使用して`DIDViewerEndpointForHolder`にアクセスする  
Access to `DIDViewerEndpointForHolder` via your browser

![](../images/holder_webapp.png)

