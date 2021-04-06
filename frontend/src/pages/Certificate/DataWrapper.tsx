import React from "react";
import { connect } from "react-redux";
import { ThunkDispatch } from "redux-thunk";
import { RootState } from "store";
import { Actions } from "types";

const mapStateToProps = (state: RootState) => {
  const certificates = state.certificates;
  return {
    componentTemplates: certificates.certificates,
    isLoading: certificates.isLoading,
    isFirstLoaded: certificates.isFirstLoaded,
  };
};

export interface WithCertificatesDataProps extends ReturnType<typeof mapStateToProps> {
  dispatch: ThunkDispatch<RootState, undefined, Actions>;
}

export const CertificateDataWrapper = (WrappedComponent: React.ComponentType<any>) => {
  const WithCertificatesData: React.ComponentType<WithCertificatesDataProps> = class extends React.Component<
    WithCertificatesDataProps
  > {
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
