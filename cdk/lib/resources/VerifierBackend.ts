import { Stack, CfnOutput, Duration, RemovalPolicy } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as agw from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as logs from "aws-cdk-lib/aws-logs";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as wafv2 from "aws-cdk-lib/aws-wafv2";
import { apiWafRule } from "../../waf/apiWafRule";

import { DynamodbStack } from "./dynamodb";

export class VerifierBackend extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);
  }

  public createResources() {
    const dynamodbStack = new DynamodbStack();
    dynamodbStack.createDynamoDbForDIDKeypairTable(this);
    dynamodbStack.createDynamoDbJWTSessionTable(this);

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

    const verifyVC = new lambdaNodejs.NodejsFunction(this, "VerifyVC", {
      ...defaultFuncProps,
      entry: "./lambda/nodejs/VerifyVC.js",
      environment: {
        ...defaultFuncEnvironments,
      },
    });

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
    const apiWaf = new wafv2.CfnWebACL(this, "VerifierProfileWas", {
      defaultAction: { allow: {} },
      scope: "REGIONAL",
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        sampledRequestsEnabled: true,
        metricName: "VerifierApiWaf",
      },
      rules: apiWafRule,
    });

    const api = new agw.RestApi(this, "DIDVerifierApi", {
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
    association.addDependency(apiWaf);

    const filesApi = api.root.addResource("vc");
    const verifyVcApi = filesApi.addResource("verify");
    const identifierApi = api.root.addResource("identifier");
    const jwtApi = api.root.addResource("jwt");
    const documenbtApi = api.root.addResource("document");
    const ownerApi = api.root.addResource("owner");

    // vcの検証
    this.defineAPIRoute("POST", verifyVcApi, verifyVC, authorizer);
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

    new CfnOutput(this, "UserPoolIdForVerifierWebApp", {
      value: userPool.userPoolId,
      exportName: "userPoolIdForVerifierWebApp",
    });

    new CfnOutput(this, "UserPoolWEBClientIdForVerifierWebApp", {
      value: client.userPoolClientId,
      exportName: "userPoolWEBClientIdForVerifierWebApp",
    });

    new CfnOutput(this, "ApiEndpointForVerifierWebApp", {
      value: api.url,
      exportName: "ApiEndpointForVerifierWebApp",
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
}
