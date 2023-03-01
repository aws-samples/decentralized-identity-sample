#!/usr/bin/env node
import "source-map-support/register";
import { App, CfnOutput, Aspects } from "aws-cdk-lib";
import { IssuerProfileBucketStack } from "../lib/issuerProfileBucketStack";
import { IssuerProfileDestributionStack } from "../lib/issuerProfileDestributionStack";
import { WafStack } from "../lib/wafStack";
import { RemoteOutputStack } from "../lib/RemoteOutputStack";
import { IssuerWebapp } from "../lib/issuerWebapp";
import { HolderWebapp } from "../lib/holderWebapp";
import { VerifierWebapp } from "../lib/verifierWebapp";
import { AwsPrototypingChecks } from "@aws-prototyping-sdk/pdk-nag";

const app = new App();
Aspects.of(app).add(new AwsPrototypingChecks());

// CloudFront用のWAFはus-east-1でしか作れない。
const webAcl = new WafStack(app, "DIDWafStack", {
  env: {
    region: "us-east-1",
  },
});
new CfnOutput(webAcl, "issuerProfileWafArn", {
  value: webAcl.issuerProfileWaf,
});
new CfnOutput(webAcl, "webappWafArn", { value: webAcl.webappWaf });

// クロスリージョン参照用
const remoteOutput = new RemoteOutputStack(app, "RemoteOutput", {
  webAcl,
});

const issuerProfileBucketStack = new IssuerProfileBucketStack(
  app,
  "DIDIssuerProfileBucketStack",
  {
    webAclArn: remoteOutput.issuerProfileWafArn,
  }
);
issuerProfileBucketStack.addDependency(webAcl);
issuerProfileBucketStack.addDependency(remoteOutput);

const issuerProfileDestributionStack = new IssuerProfileDestributionStack(
  app,
  "DIDIssuerProfileDestributionStack",
  {
    issuerProfileBucket: issuerProfileBucketStack.issuerProfileBucket,
    distribution: issuerProfileBucketStack.distribution,
  }
);
issuerProfileDestributionStack.addDependency(issuerProfileBucketStack);

const issuerWebapp = new IssuerWebapp(app, "IssuerWebapp", {
  webAclArn: remoteOutput.webappWafArn,
});
issuerWebapp.addDependency(webAcl);
issuerWebapp.addDependency(remoteOutput);

const holderWebapp = new HolderWebapp(app, "HolderWebapp", {
  webAclArn: remoteOutput.webappWafArn,
});
holderWebapp.addDependency(webAcl);
holderWebapp.addDependency(remoteOutput);

const verifierWebapp = new VerifierWebapp(app, "VerifierWebapp", {
  webAclArn: remoteOutput.webappWafArn,
});
verifierWebapp.addDependency(webAcl);
verifierWebapp.addDependency(remoteOutput);
