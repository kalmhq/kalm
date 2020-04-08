import { push } from "connected-react-router";
import React from "react";
import { connect } from "react-redux";
import { ThunkDispatch } from "redux-thunk";
import { Actions } from "types";
import { initAuthStatus } from "actions/auth";
import { RootState } from "reducers";
import { Loading } from "widgets/Loading";

const mapStateToProps = (state: RootState) => {
  const auth = state.get("auth");
  const authorized = auth.get("authorized");
  const firstLoaded = auth.get("firstLoaded");
  return {
    authorized,
    firstLoaded
  };
};

interface Props extends ReturnType<typeof mapStateToProps> {
  dispatch: ThunkDispatch<RootState, undefined, Actions>;
}

export const AuthWrapper = (WrappedComponent: React.ComponentType<any>) => {
  const authWrapper: React.ComponentType<Props> = class extends React.Component<Props> {
    componentDidMount() {
      const { firstLoaded } = this.props;
      if (!firstLoaded) {
        this.props.dispatch(initAuthStatus());
      }
    }

    componentDidUpdate() {
      const { firstLoaded, authorized } = this.props;
      if (firstLoaded && !authorized) {
        this.props.dispatch(push("/login"));
      }
    }

    render() {
      const { firstLoaded, authorized } = this.props;

      if (!firstLoaded) {
        return <Loading />;
      }

      if (!authorized) {
        return null;
      }

      return <WrappedComponent {...this.props} />;
    }
  };

  authWrapper.displayName = `authWrapper(${getDisplayName(WrappedComponent)})`;

  return connect(mapStateToProps)(authWrapper);
};

function getDisplayName(WrappedComponent: React.ComponentType) {
  return WrappedComponent.displayName || WrappedComponent.name || "Component";
}
