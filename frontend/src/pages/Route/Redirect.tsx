import React from "react";
import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import { TDispatchProp } from "types";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { push } from "connected-react-router";

const styles = (theme: Theme) =>
  createStyles({
    root: {},
  });

const mapStateToProps = (state: RootState) => {
  return {};
};

interface Props extends WithStyles<typeof styles>, ReturnType<typeof mapStateToProps>, TDispatchProp {}

interface State {}

class RouteRedirectListRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  public componentDidMount() {
    const { dispatch } = this.props;
    dispatch(push("/routes"));
  }

  public render() {
    const { classes } = this.props;
    return <div className={classes.root}></div>;
  }
}

export const RouteRedirectList = withStyles(styles)(connect(mapStateToProps)(RouteRedirectListRaw));
