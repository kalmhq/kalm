import React from "react";
import { RootState } from "../../reducers";
import { connect } from "react-redux";
import { ThunkDispatch } from "redux-thunk";
import { Actions } from "../../types";
import { loadCertificateIssuers, loadCertificates } from "actions/certificate";

const mapStateToProps = (state: RootState) => {
  const certificates = state.get("certificates");
  return {
    componentTemplates: certificates.get("certificates"),
    isLoading: certificates.get("isLoading"),
    isFirstLoaded: certificates.get("isFirstLoaded"),
  };
};

export interface WithCertificatesDataProps extends ReturnType<typeof mapStateToProps> {
  dispatch: ThunkDispatch<RootState, undefined, Actions>;
}

export const CertificateDataWrapper = (WrappedComponent: React.ComponentType<any>) => {
  const WithCertificatesData: React.ComponentType<WithCertificatesDataProps> = class extends React.Component<
    WithCertificatesDataProps
  > {
    private interval?: number;

    private loadData = () => {
      this.props.dispatch(loadCertificates());
      this.props.dispatch(loadCertificateIssuers());
      this.interval = window.setTimeout(this.loadData, 5000);
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

  WithCertificatesData.displayName = `WithCertificatesData(${getDisplayName(WrappedComponent)})`;

  return connect(mapStateToProps)(WithCertificatesData);
};

function getDisplayName(WrappedComponent: React.ComponentType) {
  return WrappedComponent.displayName || WrappedComponent.name || "Component";
}
