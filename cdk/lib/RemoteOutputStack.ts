import { RemoteOutputs } from "cdk-remote-stack";
import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";

import { WafStack } from "./wafStack";

type Props = StackProps & {
  webAcl: WafStack;
};

export class RemoteOutputStack extends Stack {
  public readonly issuerProfileWafArn: string;
  public readonly webappWafArn: string;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);

    this.addDependency(props.webAcl);
    const outputs = new RemoteOutputs(this, "Outputs", { stack: props.webAcl });
    const issuerProfileWafArn = outputs.get("issuerProfileWafArn");

    const webappWafArn = outputs.get("webappWafArn");

    this.issuerProfileWafArn = issuerProfileWafArn;
    this.webappWafArn = webappWafArn;
  }
}
