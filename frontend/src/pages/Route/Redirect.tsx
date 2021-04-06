import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import { push } from "connected-react-router";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "store";
import { TDispatchProp } from "types";

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
