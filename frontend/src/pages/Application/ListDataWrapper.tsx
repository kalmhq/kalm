import React from "react";
import { RootState } from "../../reducers";
import { connect } from "react-redux";
import { ThunkDispatch } from "redux-thunk";
import { Actions } from "../../types";
import { loadApplicationsAction } from "../../actions/application";

const mapStateToProps = (state: RootState) => {
  const applications = state.get("applications");

  return {
    applicationList: applications.get("applicationList"),
    applications: applications.get("applications").toList(),
    isLoading: applications.get("isListLoading"),
    isFirstLoaded: applications.get("isListFirstLoaded")
  };
};

export interface WithApplicationsDataProps extends ReturnType<typeof mapStateToProps> {
  dispatch: ThunkDispatch<RootState, undefined, Actions>;
}

export const ApplicationListDataWrapper = (WrappedComponent: React.ComponentType<any>) => {
  const WithdApplicationsData: React.ComponentType<WithApplicationsDataProps> = class extends React.Component<
    WithApplicationsDataProps
  > {
    private interval?: number;

    private loadData = () => {
      this.props.dispatch(loadApplicationsAction());
      // this.interval = window.setTimeout(this.loadData, 500000);
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
      return <WrappedComponent {...this.props} />;
    }
  };

  WithdApplicationsData.displayName = `WithdApplicationsData(${getDisplayName(WrappedComponent)})`;

  return connect(mapStateToProps)(WithdApplicationsData);
};

function getDisplayName(WrappedComponent: React.ComponentType) {
  return WrappedComponent.displayName || WrappedComponent.name || "Component";
}
