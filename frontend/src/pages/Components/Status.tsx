import { Box, createStyles, Theme, WithStyles, withStyles } from "@material-ui/core";
import { RootState } from "configureStore";
import React from "react";
import { connect } from "react-redux";
import { TDispatchProp } from "types";
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

const ComponentStatusRaw: React.FC<Props> = (props) => {
  let isError = false;
  let isPending = false;
  const { component, enableMarginRight } = props;

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

export const ComponentStatus = withStyles(styles)(connect(mapStateToProps)(ComponentStatusRaw));
