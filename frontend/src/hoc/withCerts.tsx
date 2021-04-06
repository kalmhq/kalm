import { RootState } from "configureStore";
import React from "react";
import { useSelector } from "react-redux";

const mapStateToProps = (state: RootState) => {
  return {
    isCertsLoading: state.certificates.isLoading,
    isCertsFirstLoaded: state.certificates.isFirstLoaded,
    certs: state.certificates.certificates,
  };
};

export interface WithCertsProps extends ReturnType<typeof mapStateToProps> {}

function getDisplayName(WrappedComponent: React.ComponentType<any>) {
  return WrappedComponent.displayName || WrappedComponent.name || "Component";
}

export const withCerts = (WrappedComponent: React.ComponentType<any>) => {
  const HOC: React.FC<WithCertsProps> = (props) => {
    return <WrappedComponent {...props} {...useSelector(mapStateToProps)} />;
  };

  HOC.displayName = `WithCerts(${getDisplayName(WrappedComponent)})`;

  return HOC;
};
