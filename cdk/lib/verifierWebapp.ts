import { Stack, StackProps, CfnOutput, RemovalPolicy } from "aws-cdk-lib";

import { Construct } from "constructs";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3Deployment from "aws-cdk-lib/aws-s3-deployment";
import * as path from "path";

import { VerifierBackend } from "./resources/VerifierBackend";

interface CustomProps extends StackProps {
  webAclArn: string;
}

export class VerifierWebapp extends Stack {
  constructor(scope: Construct, id: string, props: CustomProps) {
    super(scope, id, props);

    const { webAclArn } = props;

    const webAppBucket = new s3.Bucket(
      this,
      "DIDDocumentVerifierViewerWebApp",
      {
        websiteIndexDocument: "",
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        encryption: s3.BucketEncryption.S3_MANAGED,
        enforceSSL: true,
        autoDeleteObjects: true,
        removalPolicy: RemovalPolicy.DESTROY,
      }
    );

    const originAccessIdentity = new cloudfront.OriginAccessIdentity(
      this,
      "AccessIdentity"
    );

    const distribution = new cloudfront.CloudFrontWebDistribution(
      this,
      "Distribution",
      {
        originConfigs: [
          {
            s3OriginSource: {
              s3BucketSource: webAppBucket,
              originAccessIdentity,
            },
            behaviors: [
              {
                isDefaultBehavior: true,
              },
            ],
          },
        ],
        errorConfigurations: [
          {
            errorCode: 404,
            errorCachingMinTtl: 0,
            responseCode: 200,
            responsePagePath: "/",
          },
          {
            errorCode: 403,
            errorCachingMinTtl: 0,
            responseCode: 200,
            responsePagePath: "/",
          },
        ],
        webACLId: webAclArn,
        httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        geoRestriction: cloudfront.GeoRestriction.allowlist(
          process.env.ACCESS_FROM_REGION || "JP"
        ),
      }
    );

    new s3Deployment.BucketDeployment(this, "Deployment", {
      sources: [
        s3Deployment.Source.asset(
          path.join(__dirname, "..", "..", "verifierwebapp", "dist")
        ),
      ],
      destinationBucket: webAppBucket,
      distribution,
      distributionPaths: ["/*"],
    });

    new CfnOutput(this, "DIDViewerEndpointForVerifier", {
      value: `https://${distribution.distributionDomainName}`,
    });

    const holderBackend = new VerifierBackend(this, "verifyWebApp");
    holderBackend.createResources();
  }
}
