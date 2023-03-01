import { StackProps, RemovalPolicy } from "aws-cdk-lib";
import { Construct } from "constructs";

import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as kms from "aws-cdk-lib/aws-kms";

export class DynamodbStack {
  public didKeypairTable: dynamodb.Table;
  public jwtSessionTable: dynamodb.Table;

  constructor() {}

  public createDynamoDbForDIDKeypairTable(
    scope: Construct,
    props?: StackProps
  ) {
    const dynamoDBEncryptionKey = new kms.Key(
      scope,
      "DynamoDBEncryptionKeyForDIDKeypairTable",
      {
        enableKeyRotation: true,
        removalPolicy: RemovalPolicy.DESTROY,
      }
    );

    this.didKeypairTable = new dynamodb.Table(scope, "DIDKeypairTable", {
      partitionKey: { name: "username", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "address", type: dynamodb.AttributeType.STRING },
      //timeToLiveAttribute: 'exp',
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey: dynamoDBEncryptionKey,
      removalPolicy: RemovalPolicy.DESTROY,
    });
  }

  public createDynamoDbJWTSessionTable(scope: Construct, props?: StackProps) {
    const dynamoDBEncryptionKey = new kms.Key(
      scope,
      "DynamoDBEncryptionKeyForJWTSessionTable",
      {
        enableKeyRotation: true,
        removalPolicy: RemovalPolicy.DESTROY,
      }
    );

    this.jwtSessionTable = new dynamodb.Table(scope, "JWTSessionTable", {
      partitionKey: { name: "jwt", type: dynamodb.AttributeType.STRING },
      timeToLiveAttribute: "exp",
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey: dynamoDBEncryptionKey,
      removalPolicy: RemovalPolicy.DESTROY,
    });
  }
}
