import React from "react";
import { RootState } from "../../reducers";
import { connect } from "react-redux";
import { ThunkDispatch } from "redux-thunk";
import { Actions } from "../../actions";
import { loadApplicationAction } from "../../actions/application";

const mapStateToProps = (state: RootState, props: any) => {
  const applications = state.get("applications");
  const { match } = props;
  const { namespace, applicationName } = match!.params;

  return {
    applicationName,
    namespace,
    application: applications.get("applications").get(applicationName),
    isLoading: applications.get("isItemLoading")
  };
};

export interface WithApplicationsDataProps extends ReturnType<typeof mapStateToProps> {
  dispatch: ThunkDispatch<RootState, undefined, Actions>;
}

export const ApplicationItemDataWrapper = (WrappedComponent: React.ComponentType<any>) => {
  const WithdApplicationsData: React.ComponentType<WithApplicationsDataProps> = class extends React.Component<
    WithApplicationsDataProps
  > {
    private interval?: number;

    private loadData = () => {
      const { namespace, applicationName } = this.props;
      this.props.dispatch(loadApplicationAction(namespace, applicationName));
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
