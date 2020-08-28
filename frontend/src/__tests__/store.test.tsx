import { ThemeProvider } from "@material-ui/core";
import { loadApplicationsAction } from "actions/application";
import { loadCertificatesAction } from "actions/certificate";
import { createComponentAction } from "actions/component";
import { createRouteAction } from "actions/routes";
import { loadServicesAction } from "actions/service";
import MockStore from "api/mockStore";
import configureStore from "configureStore";
import { ConnectedRouter } from "connected-react-router/immutable";
import { configure, mount } from "enzyme";
import Adapter from "enzyme-adapter-react-16";
import ApplicationForm from "forms/Application";
import { CertificateForm } from "forms/Certificate";
import { ComponentLikeForm } from "forms/ComponentLike";
import { COMPONENT_FORM_ID, ROUTE_FORM_ID } from "forms/formIDs";
import { RouteForm } from "forms/Route";
import { createBrowserHistory } from "history";
import Immutable from "immutable";
import React from "react";
import { act } from "react-dom/test-utils";
import { Provider } from "react-redux";
import { Route } from "react-router";
import { RootState } from "reducers";
import { Store } from "redux";
import { change } from "redux-form";
import { theme } from "theme/theme";
import { newEmptyCertificateForm } from "types/certificate";
import { ComponentLike, newEmptyComponentLike } from "types/componentTemplate";
import { HttpRouteForm, newEmptyRouteForm, HttpRoute } from "types/route";
import { getTestFormSyncErrors } from "utils/testUtils";

configure({ adapter: new Adapter() });

let store: Store<RootState, any>;
let history: any;
const mockStore = new MockStore();
const requiredError = "Required";
const applicationName = "test-application";
const componentName = "test-component";

beforeEach(() => {
  history = createBrowserHistory();
  store = configureStore(history);
});

test("load certificate list", async () => {
  await store.dispatch(loadCertificatesAction());
  expect(store.getState().get("certificates").get("certificates")).toEqual(mockStore.data.get("mockCertificates"));
});

describe("add certificate", () => {
  const onSubmit = jest.fn();

  test("test domains validate", async () => {
    const initialValues = newEmptyCertificateForm;
    const WrappedCertificateForm = class extends React.Component {
      public render() {
        return <CertificateForm isEdit={false} onSubmit={onSubmit} initialValues={initialValues} />;
      }
    };
    const component = mount(
      <Provider store={store}>
        <ThemeProvider theme={theme}>
          <ConnectedRouter history={history}>
            <Route component={WrappedCertificateForm} />
          </ConnectedRouter>
        </ThemeProvider>
      </Provider>,
    );
    await act(async () => {
      component.find("form#certificate-form").simulate("submit");
    });
    expect(component.find("p#certificate-domains-helper-text").getDOMNode().textContent).toBe(requiredError);
    expect(onSubmit).toHaveBeenCalledTimes(0);
  });

  test("test submit", async () => {
    const initialValues = { ...newEmptyCertificateForm, domains: ["tesxt.io"] };
    const WrappedCertificateForm = class extends React.Component {
      public render() {
        return <CertificateForm isEdit={false} onSubmit={onSubmit} initialValues={initialValues} />;
      }
    };
    const component = mount(
      <Provider store={store}>
        <ThemeProvider theme={theme}>
          <ConnectedRouter history={history}>
            <Route component={WrappedCertificateForm} />
          </ConnectedRouter>
        </ThemeProvider>
      </Provider>,
    );
    await act(async () => {
      component.find("form#certificate-form").simulate("submit");
    });
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});

test("add application", () => {
  const WrappedApplicationForm = class extends React.Component {
    public render() {
      return <ApplicationForm currentTab={"basic"} />;
    }
  };
  const component = mount(
    <Provider store={store}>
      <ConnectedRouter history={history}>
        <Route component={WrappedApplicationForm} />
      </ConnectedRouter>
    </Provider>,
  );
  component.find("input#application-name").getDOMNode().setAttribute("value", applicationName);
  component.find("input#application-name").simulate("change");
  expect(component.find("code#application-name-code").text()).toContain(applicationName);
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

describe("add route", () => {
  const onSubmit = jest.fn();

  test("test hosts validate", async () => {
    const initial = newEmptyRouteForm();
    const WrappedRouteForm = class extends React.Component {
      public render() {
        return <RouteForm isEdit={false} onSubmit={onSubmit} initial={initial} />;
      }
    };
    const component = mount(
      <Provider store={store}>
        <ThemeProvider theme={theme}>
          <ConnectedRouter history={history}>
            <Route component={WrappedRouteForm} />
          </ConnectedRouter>
        </ThemeProvider>
      </Provider>,
    );
    await act(async () => {
      component.find("form#route-form").simulate("submit");
    });
    expect(component.find("p#route-hosts-helper-text").getDOMNode().textContent).toBe(requiredError);
    expect(onSubmit).toHaveBeenCalledTimes(0);
  });

  test("test route submit", async () => {
    const initial = { ...newEmptyRouteForm(), hosts: ["test.com"] };
    const WrappedRouteForm = class extends React.Component {
      public render() {
        return <RouteForm isEdit={false} onSubmit={onSubmit} initial={initial} />;
      }
    };
    const component = mount(
      <Provider store={store}>
        <ThemeProvider theme={theme}>
          <ConnectedRouter history={history}>
            <Route component={WrappedRouteForm} />
          </ConnectedRouter>
        </ThemeProvider>
      </Provider>,
    );
    await act(async () => {
      component.find("form#route-form").simulate("submit");
    });
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
