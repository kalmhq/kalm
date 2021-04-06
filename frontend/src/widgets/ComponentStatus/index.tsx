import { Box, createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import { grey } from "@material-ui/core/colors";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "store";
import { TDispatchProp } from "types";
import { ApplicationComponentDetails, PodStatus } from "types/application";
import { DoughnutChart } from "widgets/DoughnutChart";
import { KPanel } from "widgets/KPanel";
import { ErrorBadge, PendingBadge, SuccessBadge } from "../Badge";
import { Subtitle1 } from "../Label";
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
      minHeight: 120,
      width: 120,
      margin: "0 auto",
    },
    chartWrapperClose: {
      height: 58,
      width: 58,
      margin: "-0 -10px 16px",
    },
    podsTitle: {
      marginTop: theme.spacing(2),
    },
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
    if (pod.isTerminating) {
      return <PendingBadge />;
    }

    switch (pod.status) {
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

    component?.pods?.forEach((pod) => {
      if (pod.status === "Succeeded" || pod.status === "Running") {
        podSuccess = podSuccess + 1;
      } else if (pod.status === "Failed") {
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
      <div className={`${classes.podItem} `} key={pod.name}>
        <div className={classes.podName}>
          {this.renderPodStatus(pod)}
          <Box ml={1}>{pod.name}</Box>
        </div>
        {<div className={classes.podStatus}>{pod.status}</div>}
        {
          <div className={classes.podMessage}>
            {pod.warnings.map((w, index) => {
              return (
                <Box ml={2} color="error.main" key={index}>
                  {index + 1}. {w.message}
                </Box>
              );
            })}
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
              <DoughnutChart
                title={""}
                labels={["Running", "Pending", "Error"]}
                data={[pieChartData.podSuccess, pieChartData.podPending, pieChartData.podError]}
              />
            </div>

            <div className={classes.podsTitle}>
              <SectionTitle>
                <Subtitle1>Pods</Subtitle1>
              </SectionTitle>
            </div>
            {component.pods?.length > 0 ? (
              <>
                {component.pods
                  .filter((pod) => pod.status === "Failed")
                  .map((pod) => {
                    return this.renderPodItem(pod);
                  })}

                {component.pods
                  .filter((pod) => pod.status === "Pending")
                  .map((pod) => {
                    return this.renderPodItem(pod);
                  })}

                {component.pods
                  .filter((pod) => pod.status === "Running")
                  .map((pod) => {
                    return this.renderPodItem(pod);
                  })}

                {component.pods
                  .filter((pod) => pod.status === "Succeeded")
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
