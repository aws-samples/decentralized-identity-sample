from __future__ import print_function
from jinja2 import Template, Environment, FileSystemLoader

import subprocess
import os
import boto3
import json
import requests


def createDirectory(path):
  if not os.path.exists(path):
    os.makedirs(path)

def get_secretmanager(secret_name):

  url = 'http://localhost:2773'
  header = {'X-Aws-Parameters-Secrets-Token': os.getenv('AWS_SESSION_TOKEN')}
  parameter_encode = requests.utils.quote(secret_name)
  path = f'secretsmanager/get?secretId={parameter_encode}'
  res = requests.get(f'{url}/{path}', headers=header)

  if res.status_code == 200:
      secret = json.loads(res.text)["SecretString"] 
      privateKey = json.loads(secret)['issuer_privatekey']

      # 秘密鍵をファイルに保存
      with open("/tmp/issuer.pk", mode="w") as f:
        f.write(privateKey)

      #return data['Parameter']['Value']
      return None
  else:
      print(
          f"Failed to get SSM parameter store {SSM_ISSUER_PRIVATEKEY_NAME}")
      return None

# 署名前の証明書を作成.ファイルに保存する
def readVerifiableCredentialTemplate(param=None):
  #テンプレート読み込み
  env = Environment(loader=FileSystemLoader('./template', encoding='utf8'))
  tmpl = env.get_template('verifiable-credential.json.j2')

  if not param:
    param = {
      'id': 'xxxx',
      'issuer_profile_url': os.getenv('ISSUER_PROFILE_URL'),
      'name': "yamada",
      'address': 'yamagata',
      'phoneNumber': '111-1111-1111'
    }
  # テンプレートにVCに登録する値を設定
  rendered = tmpl.render(param)

  # json化
  rendered_json = json.loads(rendered)

  # ファイルに出力
  with open('/tmp/unsigned_certificates/{}.json'.format(param['id']), 'w') as f:
    json.dump(rendered_json, f, indent=2)

  return rendered_json

# 生成されたVerifiableCredentialを取得する
def getSignedVerifiableCredential(param=None):
  with open('/tmp/blockchain_certificates/{}.json'.format(param['id'])) as f:
    vc = json.load(f)
    print(vc)
    return vc


# cert_issuerを実行して証明書を払い出す。
def subprocess_cert_issuer():
    args = [
      'python3',
      '-m',
      'cert_issuer',
      '-c',
      'conf.ini'
    ]
    output = subprocess.run(args, capture_output=True)
    print(output)

def lambda_handler(event, context):
  try:
    #print("Received event: " + json.dumps(event, indent=2))

    #print(event['body'])
    payload = json.loads(event['body'])
    print(payload)

    # 保存先ディレクトリの作成
    createDirectory('/tmp/unsigned_certificates')
    createDirectory('/tmp/blockchain_certificates')
    createDirectory('/tmp/work')
    createDirectory('/tmp/signed_certificates')

    # 秘密鍵の取得
    SSM_ISSUER_PRIVATEKEY_NAME = os.getenv('SSM_ISSUER_PRIVATEKEY_NAME')
    get_secretmanager(secret_name=SSM_ISSUER_PRIVATEKEY_NAME)

    ## templateからVCの署名前ファイルを生成
    param = {
        'id': payload['id'],
        'issuer_profile_url': os.environ['ISSUER_PROFILE_URL'],
        'name': payload['name'],
        'address': payload['address'],
        'phoneNumber': payload['phoneNumber']
      }
    readVerifiableCredentialTemplate(param)

    # Issuerの秘密鍵で電子署名
    subprocess_cert_issuer()

    # 生成されたVerifiable Credentialを取得
    vc = getSignedVerifiableCredential(param)


    response = {
      'statusCode': 200,
      'headers': {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      'body': json.dumps(vc)
    }

    print(response)
    return response

  except:
    import traceback
    traceback.print_exc()

    response = {
      'statusCode': 502,
      'headers': {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      'error': traceback.print_exc()
    }
    return response