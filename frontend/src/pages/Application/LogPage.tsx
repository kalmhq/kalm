import React from "react";
import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import { TDispatchProp } from "types";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { Loading } from "widgets/Loading";

const styles = (theme: Theme) =>
  createStyles({
    root: {},
    more: {
      display: "flex",
      justifyContent: "flex-end",
      alignItems: "flex-start",
    },
  });

const mapStateToProps = (state: RootState) => {
  return {};
};

interface Props extends WithStyles<typeof styles>, ReturnType<typeof mapStateToProps>, TDispatchProp {}

interface State {
  LogComponent: any;
}

class LogPageRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      LogComponent: undefined,
    };
  }

  public componentDidMount() {
    import("./Log").then((Log) => {
      this.setState({ LogComponent: Log.Log });
    });
  }

  public render() {
    const { LogComponent } = this.state;
    return LogComponent === undefined ? <Loading /> : <LogComponent {...this.props} />;
  }
}

export const LogPage = withStyles(styles)(connect(mapStateToProps)(LogPageRaw));
