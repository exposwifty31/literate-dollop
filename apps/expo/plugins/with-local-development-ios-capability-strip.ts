import { type ConfigPlugin, withEntitlementsPlist } from "expo/config-plugins";

const IOS_ASSOCIATED_DOMAINS_ENTITLEMENT = "com.apple.developer.associated-domains";
const IOS_NFC_FORMATS_ENTITLEMENT = "com.apple.developer.nfc.readersession.formats";

const withLocalDevelopmentIosCapabilityStrip: ConfigPlugin = (config) =>
  withEntitlementsPlist(config, (pluginConfig) => {
    delete pluginConfig.modResults[IOS_ASSOCIATED_DOMAINS_ENTITLEMENT];
    delete pluginConfig.modResults[IOS_NFC_FORMATS_ENTITLEMENT];
    return pluginConfig;
  });

export default withLocalDevelopmentIosCapabilityStrip;
