import Immutable from "immutable";
import { ImmutableMap } from "typings";

interface HttpsCertificationContent {
  name: string;
  domains: Immutable.List<string>;
}

export type HttpsCertification = ImmutableMap<HttpsCertificationContent>;
