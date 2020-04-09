import { push } from "connected-react-router";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { ThunkDispatch } from "redux-thunk";
import { Actions } from "types";
import { getDisplayName } from "./utils";

const mapStateToProps = (state: RootState) => {
  const auth = state.get("auth");
  const isAdmin = auth.get("isAdmin");

  return {
    isAdmin
  };
};

interface Props extends ReturnType<typeof mapStateToProps> {
  dispatch: ThunkDispatch<RootState, undefined, Actions>;
}

interface Options {
  requireAdmin?: boolean;
  redirectOnUnauthorized?: boolean;
}

export const Roles = ({ requireAdmin, redirectOnUnauthorized }: Options) => (
  WrappedComponent: React.ComponentType<any>
) => {
  const wrapper: React.ComponentType<Props> = class extends React.Component<Props> {
    componentDidMount() {
      this.permissionCheck();
    }

    componentDidUpdate() {
      this.permissionCheck();
    }

    permissionCheck = () => {
      const { isAdmin } = this.props;
      if (!isAdmin && requireAdmin && redirectOnUnauthorized) {
        this.props.dispatch(push("/"));
      }
    };

    render() {
      const { isAdmin } = this.props;

      if (!isAdmin && requireAdmin) {
        return null;
      }

      return <WrappedComponent {...this.props} />;
    }
  };

  wrapper.displayName = `Roles(${getDisplayName(WrappedComponent)})`;

  return connect(mapStateToProps)(wrapper);
};

export const RequireAdmin = (WrappedComponent: React.ComponentType<any>) =>
  Roles({ requireAdmin: true, redirectOnUnauthorized: true })(WrappedComponent);

export const OnlyVisiableToAdmin = (WrappedComponent: React.ComponentType<any>) =>
  Roles({ requireAdmin: true, redirectOnUnauthorized: false })(WrappedComponent);
