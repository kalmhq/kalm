import React from "react";
import ReactDOM from "react-dom";
import { Store } from "redux";
import { RootState } from "reducers";
import { createBrowserHistory } from "history";
import configureStore from "configureStore";
import { loadCertificates } from "actions/certificate";
import Immutable from "immutable";
import { certificateListData } from "actions/mockApiData";
import { Provider } from "react-redux";
import { CertificateForm } from "forms/Certificate";
import { newEmptyCertificateForm } from "../types/certificate";
import { act } from "react-dom/test-utils";
import { getFormSyncErrors, change } from "redux-form";

import { mount, configure, shallow } from "enzyme";
import Adapter from "enzyme-adapter-react-16";
import { fireEvent } from "@testing-library/react";
// import TestRenderer from "react-test-renderer";

configure({ adapter: new Adapter() });

let store: Store<RootState, any>;
// let container: Element;

beforeAll(() => {
  const history = createBrowserHistory();
  // @ts-ignore
  store = configureStore(history);
  // container = document.createElement("div");
});

test("load certificate list", async () => {
  await store.dispatch(loadCertificates());
  expect(
    store
      .getState()
      .get("certificates")
      .get("certificates")
  ).toEqual(Immutable.fromJS(certificateListData.data));
});

test("add certificate dialog", () => {
  const onSubmit = jest.fn();
  const initialValues = newEmptyCertificateForm();
  const formID = "certificate";
  const component = mount(
    <Provider store={store}>
      <CertificateForm isEdit={false} onSubmit={onSubmit} initialValues={initialValues} />
    </Provider>
  );
  component
    .find("input#certificate-name")
    .getDOMNode()
    .setAttribute("value", "123");
  store.dispatch(change(formID, "domains", ["test.io"]));
  component.find("input#certificate-name").simulate("change");
  component.find("button#save-certificate-button").simulate("click");

  expect(onSubmit).toHaveBeenCalledTimes(1);
});
