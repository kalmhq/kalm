import hoistNonReactStatics from "hoist-non-react-statics";
import React from "react";
import { connect } from "react-redux";
import { ThunkDispatch } from "redux-thunk";
import { RootState } from "reducers";
import { Actions } from "types";
import { withNamespace, WithNamespaceProps } from "hoc/withNamespace";
import Immutable from "immutable";

const mapStateToProps = (state: RootState, props: WithNamespaceProps) => {
  const activeNamespace = props.activeNamespace!;

  return {
    components: activeNamespace.get("components") || Immutable.List(),
  };
};

export interface WithComponentsProps extends ReturnType<typeof mapStateToProps>, WithNamespaceProps {
  dispatch: ThunkDispatch<RootState, undefined, Actions>;
}

export const withComponents = (WrappedComponent: React.ComponentType<any>) => {
  const withComponents: React.ComponentType<WithComponentsProps> = class extends React.Component<WithComponentsProps> {
    render() {
      return <WrappedComponent {...this.props} />;
    }
  };

  withComponents.displayName = `withComponent(${getDisplayName(WrappedComponent)})`;
  hoistNonReactStatics(withComponents, WrappedComponent);
  return withNamespace(connect(mapStateToProps)(withComponents));
};

function getDisplayName(WrappedComponent: React.ComponentType) {
  return WrappedComponent.displayName || WrappedComponent.name || "Component";
}
