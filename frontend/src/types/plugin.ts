import { ImmutableMap } from "typings";
import Immutable from "immutable";

export const EXTERNAL_ACCESS_PLUGIN_TYPE = "plugins.core.kapp.dev/v1alpha1.ingress";

export interface ExternalAccessPlugin {
  type: typeof EXTERNAL_ACCESS_PLUGIN_TYPE;
  name: string;
  hosts?: Immutable.List<string>;
  paths?: Immutable.List<string>;
  enableHttp?: boolean;
  enableHttps?: boolean;
  autoHttps?: boolean;
  stripPath?: boolean;
  preserveHost?: boolean;
}

export interface PluginContent {
  name: string;
  isActive: boolean;
  config: any;
}

// distinguish broswer Plugin type
export type PluginType = ImmutableMap<PluginContent>;
