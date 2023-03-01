// AWS マネージドルールのルールグループのリスト
// https://docs.aws.amazon.com/ja_jp/waf/latest/developerguide/aws-managed-rule-groups-list.html
export const apiWafRule = [
  {
    name: "AWSManagedRulesCommonRuleSet",
    priority: 1,
    statement: {
      managedRuleGroupStatement: {
        vendorName: "AWS",
        name: "AWSManagedRulesCommonRuleSet",
      },
    },
    overrideAction: { none: {} },
    visibilityConfig: {
      cloudWatchMetricsEnabled: true,
      sampledRequestsEnabled: true,
      metricName: "AWSManagedRulesCommonRuleSet",
    },
  },
  {
    name: "AWSManagedRulesAdminProtectionRuleSet",
    priority: 2,
    statement: {
      managedRuleGroupStatement: {
        vendorName: "AWS",
        name: "AWSManagedRulesAdminProtectionRuleSet",
      },
    },
    overrideAction: { none: {} },
    visibilityConfig: {
      cloudWatchMetricsEnabled: true,
      sampledRequestsEnabled: true,
      metricName: "AWSManagedRulesAdminProtectionRuleSet",
    },
  },
  {
    name: "AWSManagedRulesKnownBadInputsRuleSet",
    priority: 3,
    statement: {
      managedRuleGroupStatement: {
        vendorName: "AWS",
        name: "AWSManagedRulesKnownBadInputsRuleSet",
      },
    },
    overrideAction: { none: {} },
    visibilityConfig: {
      cloudWatchMetricsEnabled: true,
      sampledRequestsEnabled: true,
      metricName: "AWSManagedRulesKnownBadInputsRuleSet",
    },
  },
  {
    name: "AWSManagedRulesAmazonIpReputationList",
    priority: 4,
    statement: {
      managedRuleGroupStatement: {
        vendorName: "AWS",
        name: "AWSManagedRulesAmazonIpReputationList",
      },
    },
    overrideAction: { none: {} },
    visibilityConfig: {
      cloudWatchMetricsEnabled: true,
      sampledRequestsEnabled: true,
      metricName: "AWSManagedRulesAmazonIpReputationList",
    },
  },
  {
    name: "AWSManagedRulesAnonymousIpList",
    priority: 5,
    statement: {
      managedRuleGroupStatement: {
        vendorName: "AWS",
        name: "AWSManagedRulesAnonymousIpList",
      },
    },
    overrideAction: { none: {} },
    visibilityConfig: {
      cloudWatchMetricsEnabled: true,
      sampledRequestsEnabled: true,
      metricName: "AWSManagedRulesAnonymousIpList",
    },
  },
]