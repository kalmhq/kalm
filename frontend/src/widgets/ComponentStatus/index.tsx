import { Box, createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import { grey } from "@material-ui/core/colors";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { TDispatchProp } from "types";
import { KPanel } from "widgets/KPanel";
import { ApplicationComponentDetails, PodStatus } from "../../types/application";
import { ErrorBadge, PendingBadge, SuccessBadge } from "../Badge";
import { H5 } from "../Label";
import { PieChartComponent } from "../PieChart";
import { SectionTitle } from "../SectionTitle";

const styles = (theme: Theme) =>
  createStyles({
    root: {
      padding: `0 ${theme.spacing(2)}px`,
      width: "100%",
      height: "100%",
    },
    componentTitle: {
      display: "flex",
      alignItems: "center",
      margin: `0 -${theme.spacing(2)}px`,
      // padding: `0 ${theme.spacing(2)}px`,
      height: 35,
      lineHeight: 35,
      background: "rgba(0, 0, 0, 0.04)",
    },
    chartWrapperOpen: {
      height: 120,
      width: 120,
      margin: "0 auto",
    },
    chartWrapperClose: {
      height: 58,
      width: 58,
      margin: "-0 -10px 16px",
    },
    podsTitle: {},
    podItem: {
      width: "100%",
      position: "relative",
      padding: "10px 0",
    },
    podName: {
      display: "flex",
      alignItems: "center",
    },
    podStatus: {
      position: "absolute",
      color: grey[600],
      top: 12,
      right: 0,
    },
    podMessage: {
      maxWidth: "100%",
      whiteSpace: "break-spaces",
    },
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

  private getPieChartData() {
    const { component } = this.props;

    let podSuccess = 0;
    let podPending = 0;
    let podError = 0;

    component?.get("pods").forEach((pod) => {
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
      podError,
    };
  }

  private renderPodItem(pod: PodStatus) {
    const { classes } = this.props;

    return (
      <div className={`${classes.podItem} `} key={pod.get("name")}>
        <div className={classes.podName}>
          {this.renderPodStatus(pod)}
          <Box ml={1}>{pod.get("name")}</Box>
        </div>
        {<div className={classes.podStatus}>{pod.get("status")}</div>}
        {
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
        }
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
      <KPanel
        title={"Component Status"}
        content={
          <Box p={2} tutorial-anchor-id="component-from-pods-status">
            <div className={classes.chartWrapperOpen}>
              <PieChartComponent
                title={""}
                labels={["Running", "Pending", "Error"]}
                data={[pieChartData.podSuccess, pieChartData.podPending, pieChartData.podError]}
              />
            </div>

            <div className={classes.podsTitle}>
              <SectionTitle>
                <H5>Pods</H5>
              </SectionTitle>
            </div>
            {component.get("pods").size > 0 ? (
              <>
                {component
                  .get("pods")
                  .filter((pod) => pod.get("status") === "Failed")
                  .map((pod) => {
                    return this.renderPodItem(pod);
                  })}

                {component
                  .get("pods")
                  .filter((pod) => pod.get("status") === "Pending")
                  .map((pod) => {
                    return this.renderPodItem(pod);
                  })}

                {component
                  .get("pods")
                  .filter((pod) => pod.get("status") === "Running")
                  .map((pod) => {
                    return this.renderPodItem(pod);
                  })}

                {component
                  .get("pods")
                  .filter((pod) => pod.get("status") === "Succeeded")
                  .map((pod) => {
                    return this.renderPodItem(pod);
                  })}
              </>
            ) : null}
          </Box>
        }
      />
    );
  }
}

export const ComponentStatus = withStyles(styles)(connect(mapStateToProps)(ComponentStatusRaw));
