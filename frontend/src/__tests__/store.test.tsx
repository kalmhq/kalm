import { createApplicationAction, loadApplicationsAction } from "actions/application";
import { loadCertificates } from "actions/certificate";
import MockStore from "api/mockStore";
import configureStore from "configureStore";
import { ConnectedRouter } from "connected-react-router/immutable";
import { configure, mount } from "enzyme";
import Adapter from "enzyme-adapter-react-16";
import ApplicationForm, { applicationInitialValues } from "forms/Application";
import { CertificateForm } from "forms/Certificate";
import { ComponentLikeForm } from "forms/ComponentLike";
import { APPLICATION_FORM_ID, CERTIFICATE_FORM_ID, COMPONENT_FORM_ID } from "forms/formIDs";
import { readFileSync } from "fs";
import { createBrowserHistory } from "history";
import React from "react";
import { Provider } from "react-redux";
import { Route } from "react-router";
import { RootState } from "reducers";
import { Store } from "redux";
import { change } from "redux-form";
import { Application } from "types/application";
import { ComponentLike, newEmptyComponentLike } from "types/componentTemplate";
import { newEmptyCertificateForm, selfManaged } from "../types/certificate";
import { getTestFormSyncErrors } from "../utils/testUtils";
import { ThemeProvider } from "@material-ui/core";
import { theme } from "theme";
import { createComponentAction } from "actions/component";

configure({ adapter: new Adapter() });

let store: Store<RootState, any>;
let history: any;
const mockStore = new MockStore();
const requiredError = "Required";
const applicationName = "test-application";
const componentName = "test-component";

beforeAll(() => {
  history = createBrowserHistory();
  // @ts-ignore
  store = configureStore(history);
});

test("load certificate list", async () => {
  await store.dispatch(loadCertificates());
  expect(store.getState().get("certificates").get("certificates")).toEqual(mockStore.data.get("mockCertificates"));
});

test("add certificate", () => {
  const onSubmit = jest.fn();
  const initialValues = newEmptyCertificateForm();
  const WrappedCertificateForm = class extends React.Component {
    public render() {
      return <CertificateForm isEdit={false} onSubmit={onSubmit} initialValues={initialValues} />;
    }
  };
  const component = mount(
    <Provider store={store}>
      <ConnectedRouter history={history}>
        <Route component={WrappedCertificateForm} initialValues={initialValues} onSubmit={onSubmit} />
      </ConnectedRouter>
    </Provider>,
  );

  const clickSubmitButton = () => {
    component.find("button#save-certificate-button").simulate("click");
  };

  // When domains is not typed, validation will not pass and onSubmit will not be executed
  component.find("input#certificate-name").getDOMNode().setAttribute("value", "123");
  component.find("input#certificate-name").simulate("change");
  clickSubmitButton();
  expect(getTestFormSyncErrors(store, CERTIFICATE_FORM_ID).domains).toBe(requiredError);
  expect(onSubmit).toHaveBeenCalledTimes(0);

  // When a valid form is submitted, onSubmit is executed once
  store.dispatch(change(CERTIFICATE_FORM_ID, "domains", ["test.io"]));
  clickSubmitButton();
  expect(onSubmit).toHaveBeenCalledTimes(1);

  // To change the managedType as selfManaged, need to upload the certificate file
  store.dispatch(change(CERTIFICATE_FORM_ID, "managedType", selfManaged));
  clickSubmitButton();
  expect(getTestFormSyncErrors(store, CERTIFICATE_FORM_ID).selfManagedCertContent).toBe(requiredError);
  expect(getTestFormSyncErrors(store, CERTIFICATE_FORM_ID).selfManagedCertPrivateKey).toBe(requiredError);

  // invalid certificate
  const invalidCert = "just for test invalid certificate";
  store.dispatch(change(CERTIFICATE_FORM_ID, "selfManagedCertContent", invalidCert));
  clickSubmitButton();
  expect(getTestFormSyncErrors(store, CERTIFICATE_FORM_ID).selfManagedCertContent).toBe("Invalid Certificate");

  // valid certificate
  const validCert = readFileSync("src/certs/server.crt", "utf8");
  const validPrivateKey = readFileSync("src/certs/server_private.key", "utf8");
  store.dispatch(change(CERTIFICATE_FORM_ID, "selfManagedCertContent", validCert));
  store.dispatch(change(CERTIFICATE_FORM_ID, "selfManagedCertPrivateKey", validPrivateKey));
  clickSubmitButton();
  expect(onSubmit).toHaveBeenCalledTimes(2);
});

test("add application", async (done) => {
  const onSubmit = async (applicationFormValue: Application) => {
    return await store.dispatch(createApplicationAction(applicationFormValue));
  };

  const onSubmitSuccess = (app: Application) => {
    try {
      expect(app.get("name")).toBe(applicationName);
      done();
    } catch (error) {
      done(error);
    }
  };

  const WrappedApplicationForm = class extends React.Component {
    public render() {
      return (
        <ApplicationForm
          currentTab={"basic"}
          isEdit={false}
          initialValues={applicationInitialValues}
          onSubmit={onSubmit}
          onSubmitSuccess={onSubmitSuccess}
        />
      );
    }
  };
  const component = mount(
    <Provider store={store}>
      <ConnectedRouter history={history}>
        <Route component={WrappedApplicationForm} />
      </ConnectedRouter>
    </Provider>,
  );
  store.dispatch(change(APPLICATION_FORM_ID, "name", applicationName));
  expect(component.find("code#application-name-code").text()).toContain(applicationName);
  component.find("button#add-application-submit-button").simulate("click");
});

test("add component", async (done) => {
  await store.dispatch(loadApplicationsAction());
  const testApplication = store.getState().get("applications").get("applications").get(0);
  const onSubmit = async (formValues: ComponentLike) => {
    return await store.dispatch(createComponentAction(formValues, testApplication?.get("name")));
  };

  const onSubmitSuccess = () => {
    try {
      const testApplicationComponent = store
        .getState()
        .get("components")
        .get("components")
        .get(testApplication!.get("name"))
        ?.get(0);
      expect(!!testApplicationComponent).toBeTruthy();
      done();
    } catch (error) {
      done(error);
    }
  };
  const WrappedComponentForm = class extends React.Component {
    public render() {
      return (
        <ComponentLikeForm
          initialValues={newEmptyComponentLike()}
          onSubmit={onSubmit}
          onSubmitSuccess={onSubmitSuccess}
        />
      );
    }
  };
  const component = mount(
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <ConnectedRouter history={history}>
          <Route component={WrappedComponentForm} />
        </ConnectedRouter>
      </ThemeProvider>
    </Provider>,
  );

  component.find("button#add-component-submit-button").simulate("click");
  expect(getTestFormSyncErrors(store, COMPONENT_FORM_ID).name).toBe(requiredError);
  expect(getTestFormSyncErrors(store, COMPONENT_FORM_ID).image).toBe(requiredError);

  store.dispatch(change(COMPONENT_FORM_ID, "name", componentName));
  store.dispatch(change(COMPONENT_FORM_ID, "image", "test-image"));
  component.find("button#add-component-submit-button").simulate("click");
});
