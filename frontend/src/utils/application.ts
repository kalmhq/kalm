import Immutable from "immutable";

import { ApplicationComponent, ApplicationComponentDetails } from "../types/application";

export const applicationComponentDetailsToApplicationComponent = (
  applicationComponentDetails: ApplicationComponentDetails,
): ApplicationComponent => {
  const applicationComponentDetailsContent: any = applicationComponentDetails.toJS();
  delete applicationComponentDetailsContent.pods;
  delete applicationComponentDetailsContent.services;
  delete applicationComponentDetailsContent.metrics;

  return Immutable.fromJS(applicationComponentDetailsContent) as ApplicationComponent;
};
