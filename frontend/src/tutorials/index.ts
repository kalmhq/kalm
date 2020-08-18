import { BasicApplicationCreationTutorialFactory } from "./basicApplicationCreation";
import { AccessYourApplicationTutorialFactory } from "tutorials/accessYourApplication";
import { ConfigureHttpsCertsTutorialFactory } from "./configureHttpsCerts";

export const tutorialConfigs = [
  {
    name: "Basic",
    items: [
      {
        name: "Deploy an application",
        factory: BasicApplicationCreationTutorialFactory,
      },
      {
        name: "Access your application",
        factory: AccessYourApplicationTutorialFactory,
      },
    ],
  },
  {
    name: "Advanced",
    items: [
      {
        name: "Configure https certs",
        factory: ConfigureHttpsCertsTutorialFactory,
      },
    ],
  },
  // {
  //   name: "Connect to private image registry",
  //   factory: BasicApplicationCreationTutorialFactory,
  // },
  // {
  //   name: "Use disks",
  //   factory: BasicApplicationCreationTutorialFactory,
  // },
  // {
  //   name: "Integration with CI pipeline",
  //   factory: BasicApplicationCreationTutorialFactory,
  // },
  // {
  //   name: "I'm an kubernetes expert",
  //   factory: BasicApplicationCreationTutorialFactory,
  // },
  // ],
  // },
];
