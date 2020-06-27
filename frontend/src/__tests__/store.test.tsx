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

  // domains没有输入时，提交时validate未通过，onSubmit不会被执行
  component.find("input#certificate-name").getDOMNode().setAttribute("value", "123");
  component.find("input#certificate-name").simulate("change");
  clickSubmitButton();
  expect(getTestFormSyncErrors(store, formID).domains).toBe(requiredError);
  expect(onSubmit).toHaveBeenCalledTimes(0);

  // 输入domains，提交就是一个合法的form，onSubmit会被执行一次
  store.dispatch(change(formID, "domains", ["test.io"]));
  clickSubmitButton();
  expect(onSubmit).toHaveBeenCalledTimes(1);

  // 修改selfManaged类型，需要上传证书文件
  store.dispatch(change(formID, "managedType", selfManaged));
  clickSubmitButton();
  expect(getTestFormSyncErrors(store, formID).selfManagedCertContent).toBe(requiredError);
  expect(getTestFormSyncErrors(store, formID).selfManagedCertPrivateKey).toBe(requiredError);

  // 不合法证书
  const invalidCert = "just for test invalid certificate";
  store.dispatch(change(formID, "selfManagedCertContent", invalidCert));
  clickSubmitButton();
  expect(getTestFormSyncErrors(store, formID).selfManagedCertContent).toBe("Invalid Certificate");

  // 上传合法的证书
  const validCert = readFileSync("src/certs/server.crt", "utf8");
  const validPrivateKey = readFileSync("src/certs/server_private.key", "utf8");
  store.dispatch(change(formID, "selfManagedCertContent", validCert));
  store.dispatch(change(formID, "selfManagedCertPrivateKey", validPrivateKey));
  clickSubmitButton();
  expect(onSubmit).toHaveBeenCalledTimes(2);
});
