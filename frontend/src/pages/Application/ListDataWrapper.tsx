import React from "react";
import { RootState } from "../../reducers";
import { connect } from "react-redux";
import { ThunkDispatch } from "redux-thunk";
import { Actions } from "../../types";
import { loadApplicationsAction } from "../../actions/application";

const mapStateToProps = (state: RootState) => {
  const applications = state.get("applications");

  return {
    activeNamespaceName: state.get("namespaces").get("active"),
    applications: applications.get("applications"),
    isLoading: applications.get("isListLoading"),
    isFirstLoaded: applications.get("isListFirstLoaded")
  };
};

export interface WithApplicationsListDataProps extends ReturnType<typeof mapStateToProps> {
  dispatch: ThunkDispatch<RootState, undefined, Actions>;
}

export const ApplicationListDataWrapper = (WrappedComponent: React.ComponentType<any>) => {
  const WithdApplicationsData: React.ComponentType<WithApplicationsListDataProps> = class extends React.Component<
    WithApplicationsListDataProps
  > {
    private interval?: number;

    private loadData = () => {
      this.props.dispatch(loadApplicationsAction());
      this.interval = window.setTimeout(this.loadData, 5000);
    };

    componentDidMount() {
      this.loadData();
    }

    componentDidUpdate(prevProps: WithApplicationsListDataProps) {
      if (prevProps.activeNamespaceName !== this.props.activeNamespaceName) {
        window.clearTimeout(this.interval);
        this.loadData();
      }
    }

    componentWillUnmount() {
      if (this.interval) {
        window.clearTimeout(this.interval);
      }
    }

    render() {
      return <WrappedComponent {...this.props} />;
    }
  };

  WithdApplicationsData.displayName = `WithdApplicationsData(${getDisplayName(WrappedComponent)})`;

  return connect(mapStateToProps)(WithdApplicationsData);
};

function getDisplayName(WrappedComponent: React.ComponentType) {
  return WrappedComponent.displayName || WrappedComponent.name || "Component";
}
