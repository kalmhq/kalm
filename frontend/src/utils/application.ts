import { ApplicationComponentDetails, ApplicationComponent } from "../types/application";

export const applicationComponentDetailsToApplicationComponent = (
  applicationComponentDetails: ApplicationComponentDetails,
): ApplicationComponent => {
  return applicationComponentDetails
    .delete("pods")
    .delete("services")
    .delete("metrics") as ApplicationComponent;
};
