import { createStyles, Theme, withStyles, WithStyles, Tabs } from "@material-ui/core";
import { withNamespace, withNamespaceProps } from "permission/Namespace";
import React from "react";
import { ThunkDispatch } from "redux-thunk";
import { RootState } from "../../reducers";
import { Actions } from "../../types";
import { ApplicationDetails, PodStatus } from "../../types/application";
import { ErrorBadge, PendingBadge, SuccessBadge } from "../../widgets/Badge";
import { CheckCircleIcon } from "widgets/Icon";
import { Paper, Tab } from "@material-ui/core";

const styles = (theme: Theme) =>
  createStyles({
    root: {
      padding: theme.spacing(2)
    },
    topStatus: {
      display: "flex",
      alignItems: "center",
      "& > span": {
        marginLeft: 12
      }
    },
    tabBar: {
      boxShadow: "none",
      marginTop: 12
    }
  });

interface Props extends WithStyles<typeof styles>, withNamespaceProps {
  application: ApplicationDetails;
  activeNamespaceName: string;
  dispatch: ThunkDispatch<RootState, undefined, Actions>;
}

interface State {
  activeTab: number;
}

class DetailsRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      activeTab: 0
    };
  }

  private renderPodStatus = (pod: PodStatus) => {
    if (pod.get("isTerminating")) {
      return <PendingBadge />;
    }

    switch (pod.get("status")) {
      case "Running": {
        return <SuccessBadge />;
      }
      case "Pending": {
        return <PendingBadge />;
      }
      case "Succeeded": {
        return <SuccessBadge />;
      }
      case "Failed": {
        return <ErrorBadge />;
      }
    }
  };

  public render() {
    const { classes } = this.props;
    const { activeTab } = this.state;

    return (
      <div className={classes.root}>
        <div className={classes.topStatus}>
          <CheckCircleIcon />
          <span>paymentservice</span>
        </div>
        <Paper square className={classes.tabBar}>
          <Tabs
            value={activeTab}
            indicatorColor="primary"
            textColor="primary"
            onChange={(_, index) => this.setState({ activeTab: index })}>
            <Tab label="Overview" />
            <Tab label="Details" />
            <Tab label="Revision History" disabled />
            <Tab label="Events" disabled />
          </Tabs>
        </Paper>
      </div>
    );
  }
}

export default withStyles(styles)(withNamespace(DetailsRaw));
