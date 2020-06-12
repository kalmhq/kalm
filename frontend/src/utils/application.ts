import Immutable from "immutable";

import { ApplicationComponentDetails, ApplicationComponent } from "../types/application";

export const componentDetailsToComponent = (componentDetails: ApplicationComponentDetails): ApplicationComponent => {
  const componentDetailsContent: any = componentDetails.toJS();
  delete componentDetailsContent.pods;
  delete componentDetailsContent.services;
  delete componentDetailsContent.metrics;

  return Immutable.fromJS(componentDetailsContent) as ApplicationComponent;
};
