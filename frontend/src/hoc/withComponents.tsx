import hoistNonReactStatics from "hoist-non-react-statics";
import React from "react";
import { connect } from "react-redux";
import { ThunkDispatch } from "redux-thunk";
import { RootState } from "store";
import { Actions } from "types";

const mapStateToProps = (state: RootState) => {
  return {
    componentsMap: state.components.components,
  };
};

export interface WithComponentsProps extends ReturnType<typeof mapStateToProps> {
  dispatch: ThunkDispatch<RootState, undefined, Actions>;
}

export const withComponents = (WrappedComponent: React.ComponentType<any>) => {
  const withComponents: React.FC<WithComponentsProps> = (props) => {
    return <WrappedComponent {...props} />;
  };

  withComponents.displayName = `withComponent(${getDisplayName(WrappedComponent)})`;
  hoistNonReactStatics(withComponents, WrappedComponent);
  return connect(mapStateToProps)(withComponents);
};

function getDisplayName(WrappedComponent: React.ComponentType) {
  return WrappedComponent.displayName || WrappedComponent.name || "Component";
}
