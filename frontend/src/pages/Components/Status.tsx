import React from "react";
import { Box, createStyles, Theme, WithStyles, withStyles } from "@material-ui/core";
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
  enableMarginRight?: boolean;
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
    const { component, enableMarginRight } = this.props;

    component.pods?.forEach((pod) => {
      if (pod.isTerminating) {
        isPending = true;
      } else {
        switch (pod.status) {
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

    let statusBadge = <SuccessBadge />;
    if (isError) {
      statusBadge = <ErrorBadge />;
    } else if (isPending) {
      statusBadge = <PendingBadge />;
    }

    return (
      <Box fontSize={0} mr={enableMarginRight ? 1 : 0}>
        {statusBadge}
      </Box>
    );
  };
}

export const ComponentStatus = withStyles(styles)(connect(mapStateToProps)(ComponentStatusRaw));
