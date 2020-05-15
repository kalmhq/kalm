import React from "react";
import { RootState } from "../../reducers";
import { connect } from "react-redux";
import { ThunkDispatch } from "redux-thunk";
import { Actions } from "../../types";
import { loadApplicationAction } from "../../actions/application";
import hoistNonReactStatics from "hoist-non-react-statics";
import { Loading } from "widgets/Loading";

const mapStateToProps = (state: RootState, props: any) => {
  const applications = state.get("applications");
  const { match } = props;
  const { applicationName, componentName } = match!.params;
  const application = applications.get("applications").find(x => x.get("name") === applicationName);
  const component = application && application.get("components").find(x => x.get("name") === componentName);

  const activeNamespaceName = state.get("namespaces").get("active");

  return {
    applicationName,
    activeNamespaceName,
    application,
    component,
    isLoading: applications.get("isItemLoading")
  };
};

export interface WithApplicationItemDataProps extends ReturnType<typeof mapStateToProps> {
  dispatch: ThunkDispatch<RootState, undefined, Actions>;
}

// if reloadFrequency > 0, will keep reload the item
// otherwize, will only load the item once
export const ApplicationItemDataWrapper = ({ reloadFrequency }: { reloadFrequency: number }) => (
  WrappedComponent: React.ComponentType<any>
) => {
  const WithdApplicationsData: React.ComponentType<WithApplicationItemDataProps> = class extends React.Component<
    WithApplicationItemDataProps
  > {
    private interval?: number;

    private loadData = () => {
      const { applicationName } = this.props;
      this.props.dispatch(loadApplicationAction(applicationName));

      if (reloadFrequency > 0) {
        this.interval = window.setTimeout(this.loadData, reloadFrequency);
      }
    };

    componentDidMount() {
      this.loadData();
    }

    // componentDidUpdate(prevProps: WithApplicationItemDataProps) {
    //   if (prevProps.activeNamespaceName !== this.props.activeNamespaceName) {
    //     this.props.dispatch(push("/applications"));
    //   }
    // }

    componentWillUnmount() {
      if (this.interval) {
        window.clearTimeout(this.interval);
      }
    }

    render() {
      const { application } = this.props;

      if (!application) {
        return <Loading />;
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
