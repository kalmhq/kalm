import { Box, createStyles, Theme, WithStyles, withStyles } from "@material-ui/core";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "store";
import { TDispatchProp } from "types";
import { Node } from "types/node";
import { SuccessBadge, WarningBadge } from "widgets/Badge";

const styles = (theme: Theme) =>
  createStyles({
    root: {},
  });

const mapStateToProps = (state: RootState) => {
  return {};
};

interface Props extends WithStyles<typeof styles>, ReturnType<typeof mapStateToProps>, TDispatchProp {
  node: Node;
  enableMarginRight?: boolean;
}

interface State {}

class NodeStatusRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  public render = () => {
    const { enableMarginRight, node } = this.props;

    let statusBadge = <SuccessBadge />;

    if (node.statusTexts.length === 1 && node.statusTexts[0] === "Ready") {
      statusBadge = <SuccessBadge />;
    } else {
      statusBadge = <WarningBadge />;
    }

    return (
      <Box fontSize={0} mr={enableMarginRight ? 1 : 0}>
        {statusBadge}
      </Box>
    );
  };
}

export const NodeStatus = withStyles(styles)(connect(mapStateToProps)(NodeStatusRaw));
