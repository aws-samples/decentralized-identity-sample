import { Stack, CfnOutput, Duration, RemovalPolicy } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as agw from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as logs from "aws-cdk-lib/aws-logs";
import * as iam from "aws-cdk-lib/aws-iam";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as wafv2 from "aws-cdk-lib/aws-wafv2";
import { apiWafRule } from "../../waf/apiWafRule";

import { DynamodbStack } from "./dynamodb";

export class HolderBackend extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);
  }

  public createResources() {
    const dynamodbStack = new DynamodbStack();
    dynamodbStack.createDynamoDbForDIDKeypairTable(this);
    dynamodbStack.createDynamoDbJWTSessionTable(this);

    // Verifiable Credentialを保存するS3Bucket
    const HolderVcBucket = new s3.Bucket(this, "HolderVcBucket", {
      bucketName: `${Stack.of(this).account}-holder-vc-bucket`,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET],
          allowedOrigins: ["*"],
          allowedHeaders: ["*"],
          exposedHeaders: [],
        },
      ],
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY
    });

    new CfnOutput(this, "HolderVcBucketName", {
      value: HolderVcBucket.bucketName,
      exportName: "HolderVcBucketName",
    });

    const defaultFuncProps = {
      entry: "./lambda/",
      handler: "handler",
      runtime: lambda.Runtime.NODEJS_18_X,
      memorySize: 256,
      timeout: Duration.seconds(30),
      tracing: lambda.Tracing.ACTIVE,
      logRetention: logs.RetentionDays.ONE_MONTH,
    };

    const defaultFuncEnvironments = {
      ETHEREUM_ENDPOINT: process.env.ETHEREUM_ENDPOINT || "",
      TABLE_KEYPAIR: dynamodbStack.didKeypairTable.tableName,
      SESSION_TABLE_NAME: dynamodbStack.jwtSessionTable.tableName,
      VC_BUCKET_NAME: HolderVcBucket.bucketName,
    };

    const generateIdentifier = new lambdaNodejs.NodejsFunction(
      this,
      "GenerateIdentifier",
      {
        ...defaultFuncProps,
        entry: "./lambda/nodejs/GenerateIdentifier.js",
        environment: {
          ...defaultFuncEnvironments,
        },
      }
    );
    dynamodbStack.didKeypairTable.grantReadWriteData(generateIdentifier);

    const getIdentifier = new lambdaNodejs.NodejsFunction(
      this,
      "GetIdentifier",
      {
        ...defaultFuncProps,
        entry: "./lambda/nodejs/GetIdentifier.js",
        environment: {
          ...defaultFuncEnvironments,
        },
      }
    );
    dynamodbStack.didKeypairTable.grantReadData(getIdentifier);

    const issueJWT = new lambdaNodejs.NodejsFunction(this, "IssueJWT", {
      ...defaultFuncProps,
      entry: "./lambda/nodejs/IssueJWT.js",
      environment: {
        ...defaultFuncEnvironments,
      },
    });
    dynamodbStack.didKeypairTable.grantReadData(issueJWT);

    const verifyJWT = new lambdaNodejs.NodejsFunction(this, "VerifyJWT", {
      ...defaultFuncProps,
      entry: "./lambda/nodejs/VerifyJWT.js",
      environment: {
        ...defaultFuncEnvironments,
      },
    });

    const getDidDocument = new lambdaNodejs.NodejsFunction(
      this,
      "GetDidDocument",
      {
        ...defaultFuncProps,
        entry: "./lambda/nodejs/GetDIDDocument.js",
        environment: {
          ...defaultFuncEnvironments,
        },
      }
    );

    const getDidOwner = new lambdaNodejs.NodejsFunction(this, "GetDidOwner", {
      ...defaultFuncProps,
      entry: "./lambda/nodejs/GetDIDOwner.js",
      environment: {
        ...defaultFuncEnvironments,
      },
    });
    const changeDidOwner = new lambdaNodejs.NodejsFunction(
      this,
      "ChangeDidOwner",
      {
        ...defaultFuncProps,
        entry: "./lambda/nodejs/ChangeDIDOwner.js",
        environment: {
          ...defaultFuncEnvironments,
        },
      }
    );
    dynamodbStack.didKeypairTable.grantReadData(changeDidOwner);

    const addDlegateDid = new lambdaNodejs.NodejsFunction(
      this,
      "AddDelegateDid",
      {
        ...defaultFuncProps,
        entry: "./lambda/nodejs/AddDelegate.js",
        environment: {
          ...defaultFuncEnvironments,
        },
      }
    );
    dynamodbStack.didKeypairTable.grantReadData(addDlegateDid);

    const revokeDlegateDid = new lambdaNodejs.NodejsFunction(
      this,
      "RevokeDelegateDid",
      {
        ...defaultFuncProps,
        entry: "./lambda/nodejs/RevokeDelegate.js",
        environment: {
          ...defaultFuncEnvironments,
        },
      }
    );
    dynamodbStack.didKeypairTable.grantReadData(revokeDlegateDid);

    const addAttributeDid = new lambdaNodejs.NodejsFunction(
      this,
      "AddAttributeDid",
      {
        ...defaultFuncProps,
        entry: "./lambda/nodejs/AddAttribute.js",
        environment: {
          ...defaultFuncEnvironments,
        },
      }
    );
    dynamodbStack.didKeypairTable.grantReadData(addAttributeDid);

    const revokeAttributeDid = new lambdaNodejs.NodejsFunction(
      this,
      "RevokeAttributeDid",
      {
        ...defaultFuncProps,
        entry: "./lambda/nodejs/RevokeAttribute.js",
        environment: {
          ...defaultFuncEnvironments,
        },
      }
    );
    dynamodbStack.didKeypairTable.grantReadData(revokeAttributeDid);

    const downloadVC = new lambdaNodejs.NodejsFunction(this, "DownloadVC", {
      ...defaultFuncProps,
      entry: "./lambda/nodejs/DownloadVC.js",
      environment: {
        ...defaultFuncEnvironments,
      },
    });
    dynamodbStack.jwtSessionTable.grantReadWriteData(downloadVC);
    HolderVcBucket.grantRead(downloadVC);

    const userPool = new cognito.UserPool(this, "UserPool", {
      selfSignUpEnabled: true,
      signInAliases: {
        username: true,
        email: true,
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const client = userPool.addClient("WebClient", {
      userPoolClientName: "webClient",
      idTokenValidity: Duration.days(1),
      accessTokenValidity: Duration.days(1),
      authFlows: {
        userPassword: true,
        userSrp: true,
        custom: true,
      },
    });

    // Cognito Authorizer
    const authorizer = new agw.CognitoUserPoolsAuthorizer(this, "Authorizer", {
      cognitoUserPools: [userPool],
    });

    //AWSマネージドルールを適用するWebACLの作成
    const apiWaf = new wafv2.CfnWebACL(this, "HolderProfileWas", {
      defaultAction: { allow: {} },
      scope: "REGIONAL",
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        sampledRequestsEnabled: true,
        metricName: "HolderApiWaf",
      },
      rules: apiWafRule,
    });

    const api = new agw.RestApi(this, "DIDHolderApi", {
      defaultCorsPreflightOptions: {
        allowOrigins: agw.Cors.ALL_ORIGINS,
        allowMethods: agw.Cors.ALL_METHODS,
      },
    });

    const association = new wafv2.CfnWebACLAssociation(
      this,
      "WebAclAssociation",
      {
        resourceArn: `arn:aws:apigateway:${Stack.of(this).region}::/restapis/${
          api.restApiId
        }/stages/${api.deploymentStage.stageName}`,
        webAclArn: apiWaf.attrArn,
      }
    );
    association.addDependsOn(apiWaf);

    const restApiRole = new iam.Role(this, "Role", {
      assumedBy: new iam.ServicePrincipal("apigateway.amazonaws.com"),
      path: "/",
    });
    HolderVcBucket.grantReadWrite(restApiRole);

    const filesApi = api.root.addResource("vc");
    const fileNameApi = filesApi.addResource("{fileName}");
    const identifierApi = api.root.addResource("identifier");
    const jwtApi = api.root.addResource("jwt");
    const documenbtApi = api.root.addResource("document");
    const ownerApi = api.root.addResource("owner");
    const delegateApi = api.root.addResource("delegate");
    const attributeApi = api.root.addResource("attribute");
    const downloadVcApi = api.root.addResource("download");

    // S3オブジェクトの一覧を返す
    this.addListMethods(filesApi, HolderVcBucket, restApiRole, authorizer);
    // S3オブジェクトを返す
    this.addGetMethods(fileNameApi, HolderVcBucket, restApiRole, authorizer);
    // S3にオブジェクトをアップロードする
    this.addPutMethods(fileNameApi, HolderVcBucket, restApiRole, authorizer);
    // identifierの取得
    this.defineAPIRoute("GET", identifierApi, getIdentifier, authorizer);
    // identifierの作成
    this.defineAPIRoute("POST", identifierApi, generateIdentifier, authorizer);
    // jwtの作成
    this.defineAPIRoute("GET", jwtApi, issueJWT, authorizer);
    // jwtの検証
    this.defineAPIRoute("POST", jwtApi, verifyJWT, authorizer);
    // DID Documentの取得
    this.defineAPIRoute("GET", documenbtApi, getDidDocument, authorizer);
    // DID Ownerの取得
    this.defineAPIRoute("GET", ownerApi, getDidOwner, authorizer);
    // DID Ownerの変更
    this.defineAPIRoute("POST", ownerApi, changeDidOwner, authorizer);
    // Delegateの追加
    this.defineAPIRoute("POST", delegateApi, addDlegateDid, authorizer);
    // Delegateの削除
    this.defineAPIRoute("DELETE", delegateApi, revokeDlegateDid, authorizer);
    // Attributeの追加
    this.defineAPIRoute("POST", attributeApi, addAttributeDid, authorizer);
    // Attributeの削除
    this.defineAPIRoute("DELETE", attributeApi, revokeAttributeDid, authorizer);
    // VCのダウンロード(認証はlambda内で実施)
    this.defineAPIRoute("GET", downloadVcApi, downloadVC);

    api.addGatewayResponse("Api4xx", {
      type: agw.ResponseType.DEFAULT_4XX,
      responseHeaders: {
        "Access-Control-Allow-Origin": "'*'",
      },
    });

    api.addGatewayResponse("Api5xx", {
      type: agw.ResponseType.DEFAULT_5XX,
      responseHeaders: {
        "Access-Control-Allow-Origin": "'*'",
      },
    });

    new CfnOutput(this, "UserPoolIdForHolderWebApp", {
      value: userPool.userPoolId,
      exportName: "userPoolIdForHolderWebApp",
    });

    new CfnOutput(this, "UserPoolWEBClientIdForHolderWebApp", {
      value: client.userPoolClientId,
      exportName: "userPoolWEBClientIdForHolderWebApp",
    });

    new CfnOutput(this, "ApiEndpointForHolderWebApp", {
      value: api.url,
      exportName: "ApiEndpointForHolderWebApp",
    });
  }

  private defineAPIRoute(
    method: string,
    resource: agw.Resource,
    integration: lambdaNodejs.NodejsFunction,
    authorizer: agw.CognitoUserPoolsAuthorizer | null = null
  ): void {
    if (authorizer) {
      resource.addMethod(method, new agw.LambdaIntegration(integration), {
        authorizationType: agw.AuthorizationType.COGNITO,
        authorizer,
      });
    } else {
      resource.addMethod(method, new agw.LambdaIntegration(integration));
    }
  }

  private addListMethods(
    api_resource: agw.Resource,
    bucket: s3.Bucket,
    restApiRole: iam.Role,
    authorizer: agw.CognitoUserPoolsAuthorizer
  ) {
    api_resource.addMethod(
      "GET",
      new agw.AwsIntegration({
        service: "s3",
        integrationHttpMethod: "GET",
        path: `${bucket.bucketName}`,
        options: {
          credentialsRole: restApiRole,
          passthroughBehavior: agw.PassthroughBehavior.WHEN_NO_MATCH,
          requestParameters: {
            "integration.request.path.username": "method.request.path.username",
          },
          integrationResponses: [
            {
              statusCode: "200",
              responseParameters: {
                "method.response.header.Timestamp":
                  "integration.response.header.Date",
                "method.response.header.Content-Length":
                  "integration.response.header.Content-Length",
                "method.response.header.Content-Type":
                  "integration.response.header.Content-Type",
                "method.response.header.Access-Control-Allow-Headers":
                  "'Content-Type,Authorization'",
                "method.response.header.Access-Control-Allow-Methods":
                  "'OPTIONS,POST,PUT,GET,DELETE'",
                "method.response.header.Access-Control-Allow-Origin": "'*'",
              },
            },
            {
              statusCode: "400",
              selectionPattern: "4\\d{2}",
              responseParameters: {
                "method.response.header.Access-Control-Allow-Headers":
                  "'Content-Type,Authorization'",
                "method.response.header.Access-Control-Allow-Methods":
                  "'OPTIONS,POST,PUT,GET,DELETE'",
                "method.response.header.Access-Control-Allow-Origin": "'*'",
              },
            },
            {
              statusCode: "500",
              selectionPattern: "5\\d{2}",
              responseParameters: {
                "method.response.header.Access-Control-Allow-Headers":
                  "'Content-Type,Authorization'",
                "method.response.header.Access-Control-Allow-Methods":
                  "'OPTIONS,POST,PUT,GET,DELETE'",
                "method.response.header.Access-Control-Allow-Origin": "'*'",
              },
            },
          ],
          requestTemplates: {
            "application/json": `
              #set($context.requestOverride.path.username = $context.authorizer.claims['cognito:username']),
              #set($context.requestOverride.querystring.prefix = $context.authorizer.claims['cognito:username']+"/"),
              #set($context.requestOverride.querystring.delimiter = "/")
            `,
          },
        },
      }),
      {
        requestParameters: {
          "method.request.path.username": false,
        },
        methodResponses: [
          {
            statusCode: "200",
            responseParameters: {
              "method.response.header.Timestamp": true,
              "method.response.header.Content-Length": true,
              "method.response.header.Content-Type": true,
              "method.response.header.Access-Control-Allow-Headers": true,
              "method.response.header.Access-Control-Allow-Methods": true,
              "method.response.header.Access-Control-Allow-Origin": true,
            },
          },
          {
            statusCode: "400",
            responseParameters: {
              "method.response.header.Access-Control-Allow-Headers": true,
              "method.response.header.Access-Control-Allow-Methods": true,
              "method.response.header.Access-Control-Allow-Origin": true,
            },
          },
          {
            statusCode: "500",
            responseParameters: {
              "method.response.header.Access-Control-Allow-Headers": true,
              "method.response.header.Access-Control-Allow-Methods": true,
              "method.response.header.Access-Control-Allow-Origin": true,
            },
          },
        ],

        authorizationType: agw.AuthorizationType.COGNITO,
        authorizer: authorizer,
      }
    );
  }
  private addGetMethods(
    api_resource: agw.Resource,
    bucket: s3.Bucket,
    restApiRole: iam.Role,
    authorizer: agw.CognitoUserPoolsAuthorizer
  ) {
    api_resource.addMethod(
      "GET",
      new agw.AwsIntegration({
        service: "s3",
        integrationHttpMethod: "GET",
        path: `${bucket.bucketName}/{username}/{fileName}`,
        options: {
          credentialsRole: restApiRole,
          passthroughBehavior: agw.PassthroughBehavior.WHEN_NO_MATCH,
          requestParameters: {
            "integration.request.path.fileName": "method.request.path.fileName",
            "integration.request.path.username": "method.request.path.username",
          },
          integrationResponses: [
            {
              statusCode: "200",
              responseParameters: {
                "method.response.header.Timestamp":
                  "integration.response.header.Date",
                "method.response.header.Content-Length":
                  "integration.response.header.Content-Length",
                "method.response.header.Content-Type":
                  "integration.response.header.Content-Type",
                "method.response.header.Access-Control-Allow-Headers":
                  "'Content-Type,Authorization'",
                "method.response.header.Access-Control-Allow-Methods":
                  "'OPTIONS,POST,PUT,GET,DELETE'",
                "method.response.header.Access-Control-Allow-Origin": "'*'",
              },
            },
            {
              statusCode: "400",
              selectionPattern: "4\\d{2}",
              responseParameters: {
                "method.response.header.Access-Control-Allow-Headers":
                  "'Content-Type,Authorization'",
                "method.response.header.Access-Control-Allow-Methods":
                  "'OPTIONS,POST,PUT,GET,DELETE'",
                "method.response.header.Access-Control-Allow-Origin": "'*'",
              },
            },
            {
              statusCode: "500",
              selectionPattern: "5\\d{2}",
              responseParameters: {
                "method.response.header.Access-Control-Allow-Headers":
                  "'Content-Type,Authorization'",
                "method.response.header.Access-Control-Allow-Methods":
                  "'OPTIONS,POST,PUT,GET,DELETE'",
                "method.response.header.Access-Control-Allow-Origin": "'*'",
              },
            },
          ],
          requestTemplates: {
            "application/json": `#set($context.requestOverride.path.username = $context.authorizer.claims['cognito:username'])`,
          },
        },
      }),
      {
        requestParameters: {
          "method.request.path.fileName": true,
          "method.request.path.username": false,
        },
        methodResponses: [
          {
            statusCode: "200",
            responseParameters: {
              "method.response.header.Timestamp": true,
              "method.response.header.Content-Length": true,
              "method.response.header.Content-Type": true,
              "method.response.header.Access-Control-Allow-Headers": true,
              "method.response.header.Access-Control-Allow-Methods": true,
              "method.response.header.Access-Control-Allow-Origin": true,
            },
          },
          {
            statusCode: "400",
            responseParameters: {
              "method.response.header.Access-Control-Allow-Headers": true,
              "method.response.header.Access-Control-Allow-Methods": true,
              "method.response.header.Access-Control-Allow-Origin": true,
            },
          },
          {
            statusCode: "500",
            responseParameters: {
              "method.response.header.Access-Control-Allow-Headers": true,
              "method.response.header.Access-Control-Allow-Methods": true,
              "method.response.header.Access-Control-Allow-Origin": true,
            },
          },
        ],

        authorizationType: agw.AuthorizationType.COGNITO,
        authorizer: authorizer,
      }
    );
  }
  private addPutMethods(
    api_resource: agw.Resource,
    bucket: s3.Bucket,
    restApiRole: iam.Role,
    authorizer: agw.CognitoUserPoolsAuthorizer
  ) {
    api_resource.addMethod(
      "PUT",
      new agw.AwsIntegration({
        service: "s3",
        integrationHttpMethod: "PUT",
        path: `${bucket.bucketName}/{username}/{fileName}`,
        options: {
          credentialsRole: restApiRole,
          passthroughBehavior: agw.PassthroughBehavior.WHEN_NO_MATCH,
          requestParameters: {
            "integration.request.path.fileName": "method.request.path.fileName",
            "integration.request.path.username": "method.request.path.username",
          },
          integrationResponses: [
            {
              statusCode: "200",
              responseParameters: {
                "method.response.header.Timestamp":
                  "integration.response.header.Date",
                "method.response.header.Content-Length":
                  "integration.response.header.Content-Length",
                "method.response.header.Content-Type":
                  "integration.response.header.Content-Type",
                "method.response.header.Access-Control-Allow-Headers":
                  "'Content-Type,Authorization'",
                "method.response.header.Access-Control-Allow-Methods":
                  "'OPTIONS,POST,PUT,GET,DELETE'",
                "method.response.header.Access-Control-Allow-Origin": "'*'",
              },
            },
            {
              statusCode: "400",
              selectionPattern: "4\\d{2}",
              responseParameters: {
                "method.response.header.Access-Control-Allow-Headers":
                  "'Content-Type,Authorization'",
                "method.response.header.Access-Control-Allow-Methods":
                  "'OPTIONS,POST,PUT,GET,DELETE'",
                "method.response.header.Access-Control-Allow-Origin": "'*'",
              },
            },
            {
              statusCode: "500",
              selectionPattern: "5\\d{2}",
              responseParameters: {
                "method.response.header.Access-Control-Allow-Headers":
                  "'Content-Type,Authorization'",
                "method.response.header.Access-Control-Allow-Methods":
                  "'OPTIONS,POST,PUT,GET,DELETE'",
                "method.response.header.Access-Control-Allow-Origin": "'*'",
              },
            },
          ],
          requestTemplates: {
            "application/json": `#set($allParams = $input.params())
#set($context.requestOverride.path.username = $context.authorizer.claims['cognito:username'])
$input.json('$')
`,
          },
        },
      }),
      {
        requestParameters: {
          "method.request.path.fileName": true,
          "method.request.path.username": false,
        },
        methodResponses: [
          {
            statusCode: "200",
            responseParameters: {
              "method.response.header.Timestamp": true,
              "method.response.header.Content-Length": true,
              "method.response.header.Content-Type": true,
              "method.response.header.Access-Control-Allow-Headers": true,
              "method.response.header.Access-Control-Allow-Methods": true,
              "method.response.header.Access-Control-Allow-Origin": true,
            },
          },
          {
            statusCode: "400",
            responseParameters: {
              "method.response.header.Access-Control-Allow-Headers": true,
              "method.response.header.Access-Control-Allow-Methods": true,
              "method.response.header.Access-Control-Allow-Origin": true,
            },
          },
          {
            statusCode: "500",
            responseParameters: {
              "method.response.header.Access-Control-Allow-Headers": true,
              "method.response.header.Access-Control-Allow-Methods": true,
              "method.response.header.Access-Control-Allow-Origin": true,
            },
          },
        ],

        authorizationType: agw.AuthorizationType.COGNITO,
        authorizer: authorizer,
      }
    );
  }
}
