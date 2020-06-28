import hoistNonReactStatics from "hoist-non-react-statics";
import React from "react";
import { connect } from "react-redux";
import { ThunkDispatch } from "redux-thunk";
import { RootState } from "reducers";
import { Actions } from "types";
import { withComponents, WithComponentsProps } from "hoc/withComponents";
import { RouteComponentProps } from "react-router-dom";

const mapStateToProps = (
  state: RootState,
  {
    components,
    match: {
      params: { name },
    },
  }: WithComponentsProps & RouteComponentProps<{ name: string }>,
) => {
  return {
    component: components.find((c) => c.get("name") === name)!,
  };
};

export interface WithComponentProp extends ReturnType<typeof mapStateToProps>, WithComponentsProps {
  dispatch: ThunkDispatch<RootState, undefined, Actions>;
}

export const withComponent = (WrappedComponent: React.ComponentType<any>) => {
  const withComponent: React.ComponentType<WithComponentProp> = class extends React.Component<WithComponentProp> {
    render() {
      if (!this.props.component) {
        return "Component not found";
      }

      return <WrappedComponent {...this.props} />;
    }
  };

  withComponent.displayName = `withComponent(${getDisplayName(WrappedComponent)})`;
  hoistNonReactStatics(withComponent, WrappedComponent);
  return withComponents(connect(mapStateToProps)(withComponent));
};

function getDisplayName(WrappedComponent: React.ComponentType) {
  return WrappedComponent.displayName || WrappedComponent.name || "Component";
}
