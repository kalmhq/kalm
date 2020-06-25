import React from "react";
import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import { TDispatchProp } from "types";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { ApplicationComponentDetails } from "types/application";
import { ErrorBadge, PendingBadge, SuccessBadge } from "widgets/Badge";

const styles = (theme: Theme) =>
  createStyles({
    root: {},
  });

const mapStateToProps = (state: RootState) => {
  return {};
};

interface Props extends WithStyles<typeof styles>, ReturnType<typeof mapStateToProps>, TDispatchProp {
  component: ApplicationComponentDetails;
}

interface State {}

class ComponentStatusRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  public render = () => {
    let isError = false;
    let isPending = false;
    const { component } = this.props;

    component.get("pods").forEach((pod) => {
      if (pod.get("isTerminating")) {
        isPending = true;
      } else {
        switch (pod.get("status")) {
          case "Pending": {
            isPending = true;
            break;
          }
          case "Failed": {
            isError = true;
            break;
          }
        }
      }
    });

    if (isError) {
      return <ErrorBadge />;
    } else if (isPending) {
      return <PendingBadge />;
    } else {
      return <SuccessBadge />;
    }
  };
}

export const ComponentStatus = withStyles(styles)(connect(mapStateToProps)(ComponentStatusRaw));
