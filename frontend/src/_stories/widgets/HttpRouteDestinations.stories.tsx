import { Typography } from "@material-ui/core";
import { Alert, AlertTitle } from "@material-ui/lab";
import { date, number, text } from "@storybook/addon-knobs";
import { storiesOf } from "@storybook/react";
import { Field } from "formik";
import { KAutoCompleteOption, KFormikAutoCompleteSingleValue } from "forms/Basic/autoComplete";
import React from "react";
import {
  ApplicationDetails,
  LOAD_ALL_NAMESAPCES_COMPONETS,
  LOAD_APPLICATIONS_FULFILLED,
  LOAD_APPLICATIONS_PENDING,
} from "types/application";
import { SET_CURRENT_NAMESPACE } from "types/namespace";
import { Service } from "types/service";
import {
  createApplication,
  createApplicationComponent,
  createRoutes,
  generateRandomIntList,
  mergeMetrics,
} from "_stories/data/application";
import { createServices } from "_stories/data/service";
import { resetStore, store } from "_stories/ReduxConfig";

storiesOf("Widgets/HttpRouteDestinations", module)
  //   .addDecorator(withProvider)
  .add("Has data", () => {
    resetStore();

    const appName = text("applicationName", "kalm-bookinfo", "Application1");
    const componentCounter = number("pod counter", 5, undefined, "Application1");
    const podCounter = number("pod counter", 5, undefined, "Application1");
    const createTime = date("create Date", new Date("2020-06-11"), "Application1");

    createRoutes(store, [appName]);

    let oneApp: ApplicationDetails = createApplication(appName) as any;

    const allComponents = createApplicationComponent(
      appName,
      componentCounter,
      createTime,
      generateRandomIntList(podCounter, 0, 5),
    );

    oneApp = mergeMetrics(oneApp, allComponents);

    const applications: ApplicationDetails[] = [oneApp];
    store.dispatch({ type: LOAD_APPLICATIONS_PENDING });
    store.dispatch({
      type: LOAD_ALL_NAMESAPCES_COMPONETS,
      payload: {
        components: allComponents,
      },
    });
    store.dispatch({ type: LOAD_APPLICATIONS_FULFILLED, payload: { applicationList: applications } });
    store.dispatch({
      type: SET_CURRENT_NAMESPACE,
      payload: {
        namespace: appName,
      },
    });
    const options: KAutoCompleteOption[] = [];
    const services: Service[] = createServices() as any[];
    const activeNamespace = "kalm-bookinfo";
    services
      .filter((x) => {
        const ns = x.namespace;

        // TODO should we ignore the system namespaces??
        return (
          ns !== "default" &&
          ns !== "kalm-operator" &&
          ns !== "kalm-imgconv" &&
          ns !== "kube-system" &&
          ns !== "istio-system" &&
          ns !== "cert-manager" &&
          ns !== "istio-operator"
        );
      })
      .sort((a, b): number => {
        const aNamespace = a.namespace;
        if (aNamespace === activeNamespace) {
          return -1;
        }

        const bNamespace = b.namespace;
        if (bNamespace === activeNamespace) {
          return 1;
        }

        if (aNamespace === bNamespace) {
          return a.name.localeCompare(b.name);
        } else {
          return aNamespace.localeCompare(bNamespace);
        }
      })
      .forEach((svc) => {
        svc.ports
          .filter((p) => p.protocol === "TCP")
          .forEach((port) => {
            options.push({
              value: `${svc.name}.${svc.namespace}.svc.cluster.local:${port.port}`,
              label: svc.name + ":" + port.port,
              group: svc.namespace === activeNamespace ? `${svc.namespace} (Current)` : svc.namespace,
            });
          });
      });
    return (
      <Field
        name={"name"}
        component={KFormikAutoCompleteSingleValue}
        label="Choose a target"
        // validate={ValidatorRequired}
        options={options}
        noOptionsText={
          <Alert severity="warning">
            <AlertTitle>No valid targets found.</AlertTitle>
            <Typography>
              If you can't find the target you want, please check if you have configured ports on the component. Only
              components that have ports will appear in the options.
            </Typography>
          </Alert>
        }
      />
    );
  });
