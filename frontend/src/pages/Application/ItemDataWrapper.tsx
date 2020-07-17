import hoistNonReactStatics from "hoist-non-react-statics";
import queryString from "qs";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { ThunkDispatch } from "redux-thunk";
import { Actions } from "types";
import { Loading } from "widgets/Loading";
import { loadApplicationAction } from "actions/application";
import { loadComponentsAction } from "actions/component";
import { Box } from "@material-ui/core";

const mapStateToProps = (state: RootState, props: any) => {
  const applications = state.get("applications");

  const { match, location } = props;
  let { applicationName, componentName } = match!.params;
  const search = queryString.parse(location.search.replace("?", ""));
  componentName = componentName || search.component;

  const application = applications.get("applications").find((x) => x.get("name") === applicationName);
  const components = application && state.get("components").get("components").get(application?.get("name"));
  const component = components?.find((x) => x.get("name") === componentName);

  const activeNamespaceName = state.get("namespaces").get("active");

  return {
    applicationName,
    activeNamespaceName,
    application,
    components,
    component,
    isLoading: applications.get("isItemLoading"),
  };
};

export interface WithApplicationItemDataProps extends ReturnType<typeof mapStateToProps> {
  dispatch: ThunkDispatch<RootState, undefined, Actions>;
}

export const ApplicationItemDataWrapper = ({ autoReload }: { autoReload: boolean }) => (
  WrappedComponent: React.ComponentType<any>,
) => {
  const WithdApplicationsData: React.ComponentType<WithApplicationItemDataProps> = class extends React.Component<
    WithApplicationItemDataProps
  > {
    private interval?: number;

    private loadData = () => {
      const { applicationName } = this.props;
      this.props.dispatch(loadComponentsAction(applicationName));
      this.props.dispatch(loadApplicationAction(applicationName));
      if (autoReload) {
        // Just for refresh mestrics. Reload per minute,
        this.interval = window.setTimeout(this.loadData, 60000);
      }
    };

    componentDidMount() {
      this.loadData();
    }

    componentWillUnmount() {
      if (this.interval) {
        window.clearTimeout(this.interval);
      }
    }

    render() {
      const { application } = this.props;

      if (!application) {
        return (
          <Box flex="1">
            <Loading />
          </Box>
        );
      }

      return <WrappedComponent {...this.props} />;
    }
  };

  WithdApplicationsData.displayName = `WithdApplicationsData(${getDisplayName(WrappedComponent)})`;
  hoistNonReactStatics(WithdApplicationsData, WrappedComponent);
  return connect(mapStateToProps)(WithdApplicationsData);
};

function getDisplayName(WrappedComponent: React.ComponentType) {
  return WrappedComponent.displayName || WrappedComponent.name || "Component";
}
