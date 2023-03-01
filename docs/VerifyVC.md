証明書の検証/Verified Credential Verification
===


## プログラムでの検証/Verification with program
- 環境変数の設定。etherscanのAPIを使用するため、etherscanの開発者用ページからapikeyを取得する。  
Set the etherscan's apikey to environment.
https://etherscan.io/apis

```
$ export ETHERSCAN_APIKEY=...
```

- 依存パッケージのインストール  
install dependency packages
```
$ npm install @blockcerts/cert-verifier-js
```

- 検証用のプログラムを実行する。`../cert-issuer/data/blockchain_certificates/verifiable-credential.json`にある発行済みの証明書に対して検証を行う。  
Run the verification program. Verification Credential are stored at `../cert-issuer/data/blockchain_certificates/verifiable-credential.json`
```
$ cd utils
$ node cert-verifier.js
```

    - If SSL is self-certified, such as in a verification environment, run this command.
      When the Test environment, Set disable ssl.
        ```
        NODE_TLS_REJECT_UNAUTHORIZED='0' node cert-verifier.js 
        ```


## 検証用サイトで検証/Verify on the Verification site
- `../cert-issuer/data/blockchain_certificates/verifiable-credential.json`のファイルを [Blockcerts](https://www.blockcerts.org/)にアップロードすることでも検証が可能  
You can verify at [Blockcerts](https://www.blockcerts.org/) to upload Verifiable Credential.