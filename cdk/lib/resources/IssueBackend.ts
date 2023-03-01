import {
  Stack,
  CfnOutput,
  Duration,
  RemovalPolicy,
  SecretValue,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import * as agw from "aws-cdk-lib/aws-apigateway";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambda_python from "@aws-cdk/aws-lambda-python-alpha";
import * as logs from "aws-cdk-lib/aws-logs";
import * as iam from "aws-cdk-lib/aws-iam";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as wafv2 from "aws-cdk-lib/aws-wafv2";
import { apiWafRule } from "../../waf/apiWafRule";

export class IssueBackend extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);
  }

  public createResources() {
    // issuerがVCに署名するときに使用する秘密鍵をSecretmanagerに保存
    const issuerPrivatekey = new secretsmanager.Secret(
      this,
      "SecretIssuerPrivateKey",
      {
        secretObjectValue: {
          issuer_privatekey: SecretValue.unsafePlainText(
            process.env.ISSUER_PRIVATEKEY || ""
          ),
        },
      }
    );

    new CfnOutput(this, "SecretIssuerPrivateKeyArn", {
      value: issuerPrivatekey.secretArn,
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
    const authorizer = new agw.CognitoUserPoolsAuthorizer(this, "Authorizer", {
      cognitoUserPools: [userPool],
    });

    const defaultFuncProps = {
      entry: "./lambda/python/Issue_vc",
      handler: "lambda_handler",
      runtime: lambda.Runtime.PYTHON_3_9,
      memorySize: 256,
      timeout: Duration.seconds(30),
      tracing: lambda.Tracing.ACTIVE,
      logRetention: logs.RetentionDays.ONE_MONTH,
    };

    const defaultFuncEnvironments = {
      ISSUER_PROFILE_URL: process.env.ISSUER_PROFILE_URL || "",
      SSM_ISSUER_PRIVATEKEY_NAME: issuerPrivatekey.secretName,
    };

    const funcIssue = new lambda_python.PythonFunction(this, "funcIssueVc", {
      index: "issue_vc.py",
      layers: [
        lambda_python.PythonLayerVersion.fromLayerVersionArn(
          this,
          `AWS-Parameters-and-Secrets-Lambda-Extension-layer-2`,
          "arn:aws:lambda:ap-northeast-1:133490724326:layer:AWS-Parameters-and-Secrets-Lambda-Extension:2"
        ),
      ],
      environment: {
        ...defaultFuncEnvironments,
      },
      ...defaultFuncProps,
    });
    funcIssue.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "secretsmanager:GetSecretValue",
          "secretsmanager:ListSecretVersionIds",
          "ssm:PutParameter",
          "ssm:GetParameterHistory",
          "ssm:GetParametersByPath",
          "ssm:GetParameters",
          "ssm:GetParameter",
        ],
        resources: [issuerPrivatekey.secretArn],
      })
    );

    //AWSマネージドルールを適用するWebACLの作成
    const apiWaf = new wafv2.CfnWebACL(this, "IssuerProfileWas", {
      defaultAction: { allow: {} },
      scope: "REGIONAL",
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        sampledRequestsEnabled: true,
        metricName: "IssuerApiWaf",
      },
      rules: apiWafRule,
    });

    const api = new agw.RestApi(this, "DIDIssuerApi", {
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

    const api_issue = api.root.addResource("issue");
    this.defineAPIRoute("POST", api_issue, funcIssue, authorizer);

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

    new CfnOutput(this, "UserPoolId", {
      value: userPool.userPoolId,
      exportName: "userPoolId",
    });

    new CfnOutput(this, "UserPoolWEBClientIdForIssuerWebApp", {
      value: client.userPoolClientId,
      exportName: "userPoolWEBClientIdForIssuerWebApp",
    });

    new CfnOutput(this, "ApiEndpointForIssuerWebApp", {
      value: api.url,
      exportName: "ApiEndpointForIssuerWebApp",
    });
  }
  private defineAPIRoute(
    method: string,
    resource: agw.Resource,
    integration: lambda_python.PythonFunction,
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
