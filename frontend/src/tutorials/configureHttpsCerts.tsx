import { RootState } from "reducers";
import { Actions } from "types";
import { ActionTypes, actionTypes } from "redux-form";
import Immutable from "immutable";
import React from "react";
import { Tutorial, TutorialFactory } from "types/tutorial";
import { store } from "store";
import {
  isUnderPath,
  requireSubStepCompleted,
  requireSubStepNotCompleted,
  isCertificateFormFieldValueEqualTo,
  popupTitle,
} from "tutorials/utils";
import { CERTIFICATE_FORM_ID } from "forms/formIDs";
import { Certificate } from "types/certificate";

export const ConfigureHttpsCertsTutorialFactory: TutorialFactory = (title): Tutorial => {
  let certificates: Immutable.List<Certificate> = store.getState().get("certificates").get("certificates");

  const certificateNameTemplate = "tutorial-";
  const domain = "tutorial.io";
  let i = 0;
  let certificateName = "tutorial";

  // eslint-disable-next-line
  while (certificates.find((certificate) => certificate.get("name") === certificateName)) {
    i += 1;
    certificateName = certificateNameTemplate + i;
  }

  return {
    title,
    steps: [
      {
        name: "Create an Certificate",
        description: "",
        highlights: [
          {
            title: popupTitle,
            description: "Go to certificates page",
            anchor: "[tutorial-anchor-id=first-level-sidebar-item-certificates]",
            triggeredByState: (state: RootState) => requireSubStepNotCompleted(state, 0),
          },
          {
            title: popupTitle,
            description: "Open the new certificate dialog",
            anchor: "[tutorial-anchor-id=add-certificate]",
            triggeredByState: (state: RootState) =>
              requireSubStepNotCompleted(state, 1) && requireSubStepCompleted(state, 0),
          },
        ],
        subSteps: [
          {
            title: "Go to certificates page",
            irrevocable: true,
            shouldCompleteByState: (state: RootState) => isUnderPath(state, "/certificates"),
          },
          {
            title: (
              <span>
                Click the <strong>NEW CERTIFICATE</strong> button
              </span>
            ),
            irrevocable: true,
            shouldCompleteByState: (state: RootState) => isUnderPath(state, "/certificates/new"),
          },
          {
            title: (
              <span>
                Type <strong>{certificateName}</strong> in name field
              </span>
            ),
            formValidator: [
              {
                form: CERTIFICATE_FORM_ID,
                field: "name",
                validate: (name) =>
                  name === certificateName ? undefined : `Please follow the tutorial, use ${certificateName}.`,
              },
            ],
            shouldCompleteByState: (state: RootState) =>
              isCertificateFormFieldValueEqualTo(state, "name", certificateName),
          },
          {
            title: (
              <span>
                Type <strong>{domain}</strong> in domains field
              </span>
            ),
            formValidator: [
              {
                form: CERTIFICATE_FORM_ID,
                field: "domains",
                validate: (domains) =>
                  domains === Immutable.List([domain]) ? undefined : `Please follow the tutorial, use ${domain}.`,
              },
            ],
            shouldCompleteByState: (state: RootState) =>
              isCertificateFormFieldValueEqualTo(state, "domains", Immutable.List([domain])),
          },
          {
            title: "Submit form",
            shouldCompleteByAction: (action: Actions) =>
              action.type === (actionTypes.SET_SUBMIT_SUCCEEDED as keyof ActionTypes) &&
              action.meta!.form === CERTIFICATE_FORM_ID,
          },
        ],
      },
      {
        name: "Vailidate Status",
        description: "Take a look at the certificate status panel. It shows that your certificate is valid.",
        subSteps: [
          {
            title: "Wait the certificate validate.",
            shouldCompleteByState: (state: RootState) => {
              const certificate = state
                .get("certificates")
                .get("certificates")
                .find((c) => c.get("name") === certificateName);

              if (!certificate) {
                return false;
              }

              return certificate.get("ready") === "True";
            },
          },
        ],
        highlights: [],
      },
    ],
  };
};
