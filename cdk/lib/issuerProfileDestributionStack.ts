import { Stack, StackProps } from "aws-cdk-lib";

import { Construct } from "constructs";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3Deployment from "aws-cdk-lib/aws-s3-deployment";
import * as path from "path";

interface CustomProps extends StackProps {
  issuerProfileBucket: s3.Bucket;
  distribution: cloudfront.Distribution;
}

export class IssuerProfileDestributionStack extends Stack {
  constructor(scope: Construct, id: string, props: CustomProps) {
    super(scope, id, props);

    const { issuerProfileBucket, distribution } = props;

    new s3Deployment.BucketDeployment(this, "Deployment", {
      sources: [
        s3Deployment.Source.asset(path.join(__dirname, "..", "issuerProfile")),
      ],
      destinationBucket: issuerProfileBucket,
      distribution,
      distributionPaths: ["/*"],
    });
  }
}
