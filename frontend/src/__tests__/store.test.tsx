import React from "react";
import { Store } from "redux";
import { RootState } from "reducers";
import { createBrowserHistory } from "history";
import configureStore from "configureStore";
import { loadCertificates } from "actions/certificate";
import { Provider } from "react-redux";
import { CertificateForm } from "forms/Certificate";
import { newEmptyCertificateForm, selfManaged } from "../types/certificate";
import { change } from "redux-form";
import { getTestFormSyncErrors } from "../utils/testUtils";
import { readFileSync } from "fs";
import { configure, mount } from "enzyme";
import Adapter from "enzyme-adapter-react-16";
import MockStore from "api/mockStore";
import ApplicationForm, { applicationInitialValues } from "forms/Application";
import { CERTIFICATE_FORM_ID, APPLICATION_FORM_ID } from "forms/formIDs";
import { Route } from "react-router";
import { ConnectedRouter } from "connected-react-router/immutable";
import { createApplicationAction } from "actions/application";
import { Application } from "types/application";

configure({ adapter: new Adapter() });

let store: Store<RootState, any>;
let history: any;
const mockStore = new MockStore();
const requiredError = "Required";

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

test("add application", async () => {
  const onSubmit = async (applicationFormValue: Application) => {
    return await store.dispatch(createApplicationAction(applicationFormValue));
  };
  const onSubmitSuccess = (app: Application) => {
    expect(app.get("name")).toBe("test-application");
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
  store.dispatch(change(APPLICATION_FORM_ID, "name", "test-application"));
  expect(component.find("code#application-name-code").text()).toContain("test-application");
  component.find("button#add-application-submit-button").simulate("click");
});
