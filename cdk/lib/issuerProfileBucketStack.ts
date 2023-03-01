import { Stack, StackProps, CfnOutput, RemovalPolicy } from "aws-cdk-lib";

import { Construct } from "constructs";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as cloudfront_origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as s3 from "aws-cdk-lib/aws-s3";

interface CustomProps extends StackProps {
  webAclArn: string;
}

export class IssuerProfileBucketStack extends Stack {
  public issuerProfileBucket: s3.Bucket;
  public distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: CustomProps) {
    super(scope, id, props);

    const { webAclArn } = props;

    this.issuerProfileBucket = new s3.Bucket(this, "IssuerProfileBucket", {
      websiteIndexDocument: "",
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      autoDeleteObjects: true,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    this.distribution = new cloudfront.Distribution(this, "Distribution2", {
      defaultBehavior: {
        origin: new cloudfront_origins.S3Origin(this.issuerProfileBucket),
        responseHeadersPolicy:
          cloudfront.ResponseHeadersPolicy.CORS_ALLOW_ALL_ORIGINS,
      },
      webAclId: webAclArn,
      httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
      geoRestriction: cloudfront.GeoRestriction.allowlist(
        process.env.ACCESS_FROM_REGION || "JP"
      ),
    });

    new CfnOutput(this, "CloudFrontEndpoint", {
      value: `https://${this.distribution.distributionDomainName}`,
    });
  }
}
