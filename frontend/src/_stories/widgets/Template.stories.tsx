import React from "react";
import { storiesOf } from "@storybook/react";
// import { Field } from "redux-form";
// import { Typography } from "@material-ui/core";
// import { Alert, AlertTitle } from "@material-ui/lab";
// import Immutable from "immutable";
// import { resetStore, store } from "_stories/ReduxConfig";
// import { Service } from "types/service";
// import { date, number, text } from "@storybook/addon-knobs";

// import {
//   createApplication,
//   createApplicationComponent,
//   createRoutes,
//   generateRandomIntList,
//   mergeMetrics,
// } from "_stories/data/application";
// import {
//   ApplicationComponentDetails,
//   ApplicationDetails,
//   LOAD_ALL_NAMESAPCES_COMPONETS,
//   LOAD_APPLICATIONS_FULFILLED,
//   LOAD_APPLICATIONS_PENDING,
// } from "types/application";
// import { SET_CURRENT_NAMESPACE } from "types/namespace";
// import { KAutoCompleteOption, KAutoCompleteSingleValue } from "forms/Basic/autoComplete";
// import { createServices } from "_stories/data/service";
// import withReduxForm from "_stories/ReduxFormConfig";
import { SecretValueLabel } from "widgets/Label";

storiesOf("Widgets/Template", module).add("Short Secure Label", () => {
  return <SecretValueLabel>123123123</SecretValueLabel>;
});
