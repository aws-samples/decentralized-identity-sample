Verifiable Credentialの発行/Issuing Verifiable Credential
===

## cert-issuerの導入/Install cert-issuer

- git clone 
```
$ cd ~/
$ git clone https://github.com/blockchain-certificates/cert-issuer.git && cd cert-issuer
```

- ethereum版のrequirements.txtが古いので更新する  
modify ethereum_requirements.txt 
```
$ vi ethereum_requirements.txt
web3<=4.4.1
coincurve==17.0.0
ethereum==2.3.1
rlp<1
eth-account<=0.3.0
```

- pythonの仮想環境を作成  
create venv for python virtual environment
```
$ python3 -m venv .venv
$ source .venv/bin/activate
```

- 依存パッケージのインストール  
install dependencies
```
$ python3 setup.py experimental --blockchain=ethereum
```

- Issuerの秘密鍵をフォルダに保存する。  
Save the issuer's private key in a folder.  

> 本番環境では、秘密鍵はサーバーに保存せず、抜き差し可能なUSBであることが望ましい。  
In a production environment, the private key is not stored on a server, and it is desirable that it be a detachable USB.

```
$ vi /tmp/issuer.pk
0x.....
```

## 発行する証明書の設定/Set the certificate to be issued

- 証明書を発行するための設定ファイルを編集.  
Edit configuration files for issuing certificates.
```
$ vi conf.ini
```
```
## Issuerのウォレットアドレス/Issuer's wallet address
issuing_address = <issuer wallet address>
verification_method=<issuer did url>
chain = ethereum_goerli
## goerliのrpc url. 
goerli_rpc_url=<goerli endpoint>
## etherscanのapi token. 設定しないとレートリミットに抵触する可能性あり。/ etherscan api token.
etherscan_api_token=<etherscan api token>
## issuerの秘密鍵のディレクトリ。本番ではusbなど取り外しが可能なことを推奨する。/diirectory of issuer's private key stored
usb_name=/tmp/
## issuerの秘密鍵のパス。/ File path of Issuer's private key
key_file=issuer.pk
context_urls=[https://www.w3.org/2018/credentials/examples/v1]
# put your unsigned certificates here for signing. Default is <project-base>/data/unsigned_certificates
unsigned_certificates_dir=./data/unsigned_certificates
# final blockchain certificates output. Default is <project-base>/data/unsigned_certificates
blockchain_certificates_dir=./data/blockchain_certificates
# where to store intermediate files, for debugging and checkpointing. Default is <project-base>/data/work
work_dir=./data/work

no_safe_mode
```


- 発行したい証明書のJSONファイルを指定のフォルダに格納する。`issuer` にissuerのprofileをアップロードしたCloudfrontのエンドポイントを記載する。  
Store the JSON file of the certificate you want to issue in the folder. Describe the CloudFront endpoint that uploaded the issuer profile to `issuer`.  

> `credentialSubject` に任意のパラメータを設定することができるが、データ構造を@contextで事前に定義する必要がある。
Predefine data structures for arbitrary parameters in  @context.
```
$ vi data/unsigned_certificates/verifiable-credential.json
```
```
{
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    {
      "hoge": "https://schema.org/Text",
      "value": "https://schema.org/Text"
    },
    "https://w3id.org/blockcerts/v3"
  ],
  "id": "<この証明書のID>",
  "type": [
    "VerifiableCredential",
    "BlockcertsCredential"
  ],
  "issuer": "https://<cloudfront endpoint>/issuer-profile.json",
  "issuanceDate": "2022-01-01T19:33:24Z",
  "credentialSubject": {
    "id": "1393ae1e-8ec1-4dfd-aaaf-6fdda80600ae",
    "value": "hogehogehogehoge",
    "hoge": "fuga"
  }
}
```


## 証明書の発行/Issuance of certificates

- 証明書の発行/Issuance of certificates
```
python3 -m cert_issuer -c conf.ini
```

- 発行した証明書のjsonは`./data/blockchain_certificates/`に保存される  
The Json file of issued certificate is stored in `./data/blockchain_certificates/`


- 証明書のmerkle_jsonがTxのinput dataに記録されることで、jsonファイルに電子署名をいつ付与したかを証明することができる。  
Since the certificate merkle_json is recorded in Tx input data, it is possible to prove when an signature was given to the JSON file.
```
merkle_json: {'path': [], 'merkleRoot': 'f4906de7db4f9a826b5998472f51eaac762d429b29b6c2496f38870a477929d9', 'targetHash': 'f4906de7db4f9a826b5998472f51eaac762d429b29b6c2496f38870a477929d9', 'anchors': ['blink:eth:goerli:0xc7ea5d10a09b8df2e984c38ee54a603631beedbed1595b8a65f29887d9466089']}
```

- 証明書のproofValueには検証に必要な情報がbase58でエンコードされている。  
Information for verification is encoded in Base58.
```
"proof": {
        "type": "MerkleProof2019",
        "created": "2022-12-16T10:56:22.457644",
        "proofValue": "z7veGu1qoKR3AS5M3xfNxYMVGUCxFzaEQ5NkRWDGTowFPyL2gB7vtCVDfK2e4oETN19HnnqmXL3CS2qpMgnWe2XUHCVN7ufHArBc54QVVk2XouWzakWMU83iHnAsk186DuvJv5vLXN2p9bFXRcwFTfqxkyzDL9E8G8CEZ43X9HnFNz6Yz38U4ypGt6XbmKM7EnLTK5NaKRkHrQehPyRfFCFhjBEhgdSFFCJk7ouqxjdQfFRYgtKQKFLKJzvVkh49s8kXxWj92asPeD2hNUGqux9vREoakMioTi3baAQMFfeCCopyRvUtmC",
        "proofPurpose": "assertionMethod",
        "verificationMethod": "did:ethr:0x3f257ceBcD7b4Ffc892A8DeD6a5E8208daDf310D"
    }
```
```
{
  path: [],
  merkleRoot: 'f4906de7db4f9a826b5998472f51eaac762d429b29b6c2496f38870a477929d9',   // txのinput dataに記録されている。
  targetHash: 'f4906de7db4f9a826b5998472f51eaac762d429b29b6c2496f38870a477929d9',
  anchors: [
    'blink:eth:goerli:0x6f7c800b3254ce79c8b669e9f0ef91ddb20723c14c9ea85d04eeaf837a494317'   // txHash
  ]
}
```
