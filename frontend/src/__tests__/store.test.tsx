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

configure({ adapter: new Adapter() });

let store: Store<RootState, any>;
const mockStore = new MockStore();

beforeAll(() => {
  const history = createBrowserHistory();
  // @ts-ignore
  store = configureStore(history);
});

test("load certificate list", async () => {
  await store.dispatch(loadCertificates());
  expect(store.getState().get("certificates").get("certificates")).toEqual(mockStore.data.mockCertificates);
});

test("add certificate", () => {
  const onSubmit = jest.fn();
  const initialValues = newEmptyCertificateForm();
  const formID = "certificate";
  const requiredError = "Required";
  const component = mount(
    <Provider store={store}>
      <CertificateForm isEdit={false} onSubmit={onSubmit} initialValues={initialValues} />
    </Provider>,
  );

  const clickSubmitButton = () => {
    component.find("button#save-certificate-button").simulate("click");
  };

  // When domains is not typed, validation will not pass and onSubmit will not be executed
  component.find("input#certificate-name").getDOMNode().setAttribute("value", "123");
  component.find("input#certificate-name").simulate("change");
  clickSubmitButton();
  expect(getTestFormSyncErrors(store, formID).domains).toBe(requiredError);
  expect(onSubmit).toHaveBeenCalledTimes(0);

  // When a valid form is submitted, onSubmit is executed once
  store.dispatch(change(formID, "domains", ["test.io"]));
  clickSubmitButton();
  expect(onSubmit).toHaveBeenCalledTimes(1);

  // To change the managedType as selfManaged, need to upload the certificate file
  store.dispatch(change(formID, "managedType", selfManaged));
  clickSubmitButton();
  expect(getTestFormSyncErrors(store, formID).selfManagedCertContent).toBe(requiredError);
  expect(getTestFormSyncErrors(store, formID).selfManagedCertPrivateKey).toBe(requiredError);

  // invalid certificate
  const invalidCert = "just for test invalid certificate";
  store.dispatch(change(formID, "selfManagedCertContent", invalidCert));
  clickSubmitButton();
  expect(getTestFormSyncErrors(store, formID).selfManagedCertContent).toBe("Invalid Certificate");

  // valid certificate
  const validCert = readFileSync("src/certs/server.crt", "utf8");
  const validPrivateKey = readFileSync("src/certs/server_private.key", "utf8");
  store.dispatch(change(formID, "selfManagedCertContent", validCert));
  store.dispatch(change(formID, "selfManagedCertPrivateKey", validPrivateKey));
  clickSubmitButton();
  expect(onSubmit).toHaveBeenCalledTimes(2);
});
