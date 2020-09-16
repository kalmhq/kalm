import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { TDispatchProp } from "types";

const mapStateToProps = (state: RootState) => {
  return {
    isCertsLoading: state.certificates.isLoading,
    isCertsFirstLoaded: state.certificates.isFirstLoaded,
    certs: state.certificates.certificates,
  };
};

export interface WithCertsProps extends ReturnType<typeof mapStateToProps>, TDispatchProp {}

export const withCerts = (WrappedComponent: React.ComponentType<any>) => {
  const HOC: React.ComponentType<WithCertsProps> = class extends React.Component<WithCertsProps> {
    render() {
      return <WrappedComponent {...this.props} />;
    }
  };

  HOC.displayName = `WithCerts(${getDisplayName(WrappedComponent)})`;

  return connect(mapStateToProps)(HOC);
};

function getDisplayName(WrappedComponent: React.ComponentType<any>) {
  return WrappedComponent.displayName || WrappedComponent.name || "Component";
}
