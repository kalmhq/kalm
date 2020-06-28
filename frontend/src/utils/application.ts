import { ApplicationComponentDetails, ApplicationComponent, ApplicationDetails } from "types/application";
import { formatDate } from "utils";

export const applicationComponentDetailsToApplicationComponent = (
  applicationComponentDetails: ApplicationComponentDetails,
): ApplicationComponent => {
  return applicationComponentDetails.delete("pods").delete("services").delete("metrics") as ApplicationComponent;
};

export const getApplicationCreatedAtString = (application: ApplicationDetails): string => {
  const createdAt = getApplicationCreatedAtDate(application);
  const createdAtString = createdAt <= new Date(0) ? "-" : formatDate(createdAt);
  return createdAtString;
};

export const getApplicationCreatedAtDate = (application: ApplicationDetails): Date => {
  let createdAt = new Date(0);

  application.get("components")?.forEach((component) => {
    const componentCreatedAt = getComponentCreatedAtDate(component);
    if (createdAt <= new Date(0) || (componentCreatedAt > new Date(0) && componentCreatedAt < createdAt)) {
      createdAt = componentCreatedAt;
    }
  });

  return createdAt;
};

export const getComponentCreatedAtString = (component: ApplicationComponentDetails): string => {
  const createdAt = getComponentCreatedAtDate(component);
  const createdAtString = createdAt <= new Date(0) ? "-" : formatDate(createdAt);
  return createdAtString;
};

export const getComponentCreatedAtDate = (component: ApplicationComponentDetails): Date => {
  let createdAt = new Date(0);

  component.get("pods").forEach((podStatus) => {
    const ts = podStatus.get("createTimestamp");
    const tsDate = new Date(ts);
    if (createdAt <= new Date(0) || (tsDate > new Date(0) && tsDate < createdAt)) {
      createdAt = tsDate;
    }
  });

  return createdAt;
};
