import { ThemeProvider } from "@material-ui/core";
import { loadApplicationsAction } from "actions/application";
import { loadCertificatesAction } from "actions/certificate";
import MockStore from "api/mockStore";
import configureStore from "configureStore";
import { ConnectedRouter } from "connected-react-router";
import { configure, mount } from "enzyme";
import Adapter from "enzyme-adapter-react-16";
import ApplicationForm from "forms/Application";
import { CertificateForm } from "forms/Certificate";
import { ComponentLikeForm } from "forms/ComponentLike";
import { RouteForm } from "forms/Route";
import { createBrowserHistory } from "history";
import React from "react";
import { act } from "react-dom/test-utils";
import { Provider } from "react-redux";
import { Route } from "react-router";
import { RootState } from "reducers";
import { Store } from "redux";
import { theme } from "theme/theme";
import { newEmptyCertificateForm } from "types/certificate";
import { newEmptyComponentLike } from "types/componentTemplate";
import { newEmptyRouteForm } from "types/route";
import { sleep } from "utils/testUtils";

const INPUT_DELAY = 500;

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
  expect(store.getState().certificates.certificates).toEqual(mockStore.data.mockCertificates);
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
    // fix me
    // expect(component.find("p#certificate-domains-helper-text").getDOMNode().textContent).toBe(requiredError);
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

test("add application", async () => {
  const WrappedApplicationForm = class extends React.Component {
    public render() {
      return <ApplicationForm />;
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
  await act(async () => {
    await sleep(INPUT_DELAY);
  });

  expect(component.find("code#application-name-code").text()).toContain(applicationName);
});

test("add component", async () => {
  await store.dispatch(loadApplicationsAction());
  const onSubmit = jest.fn();

  const WrappedComponentForm = class extends React.Component {
    public render() {
      return <ComponentLikeForm _initialValues={newEmptyComponentLike} onSubmit={onSubmit} />;
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
  await act(async () => {
    component.find("form#component-form").simulate("submit");
  });

  expect(component.find("p#component-name-helper-text").text()).toContain(requiredError);

  component.find("input#component-name").getDOMNode().setAttribute("value", componentName);
  component.find("input#component-name").simulate("change");
  component.find("input#component-image").getDOMNode().setAttribute("value", "test-image");
  component.find("input#component-image").simulate("change");
  await act(async () => {
    await sleep(INPUT_DELAY);
    component.find("form#component-form").simulate("submit");
  });
  expect(onSubmit).toHaveBeenCalledTimes(1);
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
