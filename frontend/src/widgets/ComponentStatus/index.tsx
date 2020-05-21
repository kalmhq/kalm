import React from "react";
import { createStyles, Theme, withStyles, WithStyles, Box } from "@material-ui/core";
import { TDispatchProp } from "types";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { ApplicationComponentDetails, PodStatus } from "../../types/application";
import { PieChart } from "../PieChart";
import { ErrorBadge, PendingBadge, SuccessBadge } from "../Badge";
import { H5 } from "../Label";
import { grey } from "@material-ui/core/colors";

const styles = (theme: Theme) =>
  createStyles({
    root: {
      padding: 20,
      width: "100%"
    },
    componentTitle: {
      display: "flex",
      alignItems: "center"
    },
    chartWrapper: {
      height: 120,
      width: 120,
      margin: "0 auto"
    },
    podsTitle: {},
    podItem: {
      width: "100%",
      position: "relative",
      padding: "10px 0"
    },
    podName: {
      display: "flex",
      alignItems: "center"
    },
    podStatus: {
      position: "absolute",
      color: grey[600],
      top: 12,
      right: 0
    },
    podMessage: {}
  });

const mapStateToProps = (state: RootState) => {
  return {};
};

interface Props extends WithStyles<typeof styles>, ReturnType<typeof mapStateToProps>, TDispatchProp {
  component?: ApplicationComponentDetails;
}

interface State {}

class ComponentStatusRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {};
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

  private renderComponentStatus = (component: ApplicationComponentDetails) => {
    let isError = false;
    let isPending = false;

    component.get("pods").forEach(pod => {
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

  private getPieChartData() {
    const { component } = this.props;

    let podSuccess = 0;
    let podPending = 0;
    let podError = 0;

    component?.get("pods").forEach(pod => {
      if (pod.get("status") === "Succeeded" || pod.get("status") === "Running") {
        podSuccess = podSuccess + 1;
      } else if (pod.get("status") === "Failed") {
        podError = podError + 1;
      } else {
        podPending = podPending + 1;
      }
    });

    return {
      podSuccess,
      podPending,
      podError
    };
  }

  private renderPodItem(pod: PodStatus) {
    const { classes } = this.props;

    return (
      <div className={classes.podItem}>
        <div className={classes.podName}>
          {this.renderPodStatus(pod)}
          {pod.get("name")}
        </div>
        <div className={classes.podStatus}>{pod.get("status")}</div>
        <div className={classes.podMessage}>
          {pod
            .get("warnings")
            .map((w, index) => {
              return (
                <Box ml={2} color="error.main" key={index}>
                  {index + 1}. {w.get("message")}
                </Box>
              );
            })
            .toArray()}
        </div>
      </div>
    );
  }

  public render() {
    const { classes, component } = this.props;
    const pieChartData = this.getPieChartData();
    if (!component) {
      return null;
    }

    return (
      <div className={classes.root}>
        <div className={classes.componentTitle}>
          {this.renderComponentStatus(component)} <H5>{component.get("name")}</H5>
        </div>
        <div className={classes.chartWrapper}>
          <PieChart
            title={""}
            labels={["Running", "Pending", "Error"]}
            data={[pieChartData.podSuccess, pieChartData.podPending, pieChartData.podError]}
          />
        </div>
        <div className={classes.podsTitle}>
          <H5>Pods</H5>
        </div>
        {component.get("pods").size > 0 ? (
          <>
            {component
              .get("pods")
              .filter(pod => pod.get("status") === "Failed")
              .map(pod => {
                return this.renderPodItem(pod);
              })}

            {component
              .get("pods")
              .filter(pod => pod.get("status") === "Pending")
              .map(pod => {
                return this.renderPodItem(pod);
              })}

            {component
              .get("pods")
              .filter(pod => pod.get("status") === "Running")
              .map(pod => {
                return this.renderPodItem(pod);
              })}

            {component
              .get("pods")
              .filter(pod => pod.get("status") === "Succeeded")
              .map(pod => {
                return this.renderPodItem(pod);
              })}
          </>
        ) : null}
      </div>
    );
  }
}

export const ComponentStatus = withStyles(styles)(connect(mapStateToProps)(ComponentStatusRaw));
