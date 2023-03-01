import { Stack, StackProps, CfnOutput } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as wafv2 from "aws-cdk-lib/aws-wafv2";
import { cloudfrontWafRule } from "../waf/cloudfrontWafRule";

export class WafStack extends Stack {
  public readonly issuerProfileWaf: string;
  public readonly webappWaf: string;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const sourceIpAddress = process.env.SOURCE_IP_ADDRESS || "";

    //AWSマネージドルールを適用するWebACLの作成
    const issuerProfileWaf = new wafv2.CfnWebACL(this, "IssuerProfileWas", {
      defaultAction: { allow: {} },
      scope: "CLOUDFRONT",
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        sampledRequestsEnabled: true,
        metricName: "issuerProfileWaf",
      },
      rules: cloudfrontWafRule,
    });

    const wafIPSet = new wafv2.CfnIPSet(this, "WafIPSet", {
      name: "WafIpSet",
      ipAddressVersion: "IPV4",
      scope: "CLOUDFRONT",
      addresses: [sourceIpAddress],
    });

    const webappWafV2WebAcl = new wafv2.CfnWebACL(this, "webappWafV2WebAcl", {
      defaultAction: { allow: {} },
      scope: "CLOUDFRONT",
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        sampledRequestsEnabled: true,
        metricName: "webappWafV2WebAcl",
      },
      rules: [
        {
          priority: 6,
          name: "WafWebAclIpSetRule",
          action: { allow: {} },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: "WafWebAclIpSetRule",
          },
          statement: {
            ipSetReferenceStatement: {
              arn: wafIPSet.attrArn,
            },
          },
        },
        ...cloudfrontWafRule,
      ],
    });

    new CfnOutput(this, "cloudfrontWafV2WebAcl", {
      value: issuerProfileWaf.attrArn,
      exportName: "cloudfrontWafV2WebAcl",
    });

    this.issuerProfileWaf = issuerProfileWaf.attrArn;
    this.webappWaf = webappWafV2WebAcl.attrArn;
  }
}
