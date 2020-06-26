import { createStyles, Grid, Theme, Typography, withStyles, WithStyles } from "@material-ui/core";
import { grey } from "@material-ui/core/colors";
import React from "react";
import { ApplicationComponentDetails, PodStatus } from "types/application";
import { ErrorBadge, PendingBadge, SuccessBadge } from "widgets/Badge";
import { BigCPULineChart, BigMemoryLineChart } from "widgets/SmallLineChart";
import { withRoutesData, WithRoutesDataProps } from "hoc/withRoutesData";
import { KTable } from "widgets/Table";
import { Expansion } from "forms/Route/expansion";
import { DoughnutChart } from "widgets/DoughnutChart";

const styles = (theme: Theme) =>
  createStyles({
    root: {},
    componentRow: {
      paddingTop: theme.spacing(1.5),
      paddingBottom: theme.spacing(1.5),
      "& .name": {
        fontSize: 14,
        display: "flex",
        alignItems: "center",
      },
    },
    componentContainer: {
      // background: "#f5f5f5",
      width: "100%",
    },
    podContainer: {
      background: grey[50],
    },
    chartTabelCell: {
      width: 130,
      textAlign: "center",
    },
    timeCell: {
      width: 100,
      textAlign: "center",
    },
    statusCell: {
      width: 200,
      textAlign: "center",
    },
    restartsCountCell: {
      width: 90,
      textAlign: "center",
    },
    rowContainer: {
      display: "flex",
      alignItems: "center",
      paddingLeft: theme.spacing(2),
      paddingRight: theme.spacing(2),
      justifyContent: "space-between",
      "& .right-part": {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      },
    },
    podHeaderRow: {
      color: "rgba(0, 0, 0, 0.87)",
      fontWeight: 500,
      lineHeight: "1.2857142857142856rem",
      "& .headerCell": {
        padding: "6px 16px 6px 16px",
        "&:last-child": {
          paddingRight: 0,
        },
      },
      "& > .headerCell:first-child": {
        paddingLeft: 0,
      },
    },
    podDataRow: {
      "& > :nth-child(1)": {
        flex: 1,
      },
      "& > :nth-child(2)": {
        flex: 1,
      },
    },
    viewMoreWrapper: {
      display: "flex",
      justifyContent: "center",
      padding: "10px",
    },
    actionCell: {
      width: 100,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-around",
    },
    podActionButton: {
      background: "white",
    },
    componentActions: {
      display: "flex",
      alignItems: "center",
    },
    summaryWrapper: {
      height: "100%",
      width: "100%",
      display: "flex",
      alignItems: "center",
    },
    flexWrapper: {
      display: "flex",
      alignItems: "center",
    },
    tabsWrapper: {
      padding: `0 ${theme.spacing(2)}px`,
    },
    tabs: {},
    volumeWrapper: {
      padding: `0 ${theme.spacing(2)}px`,
    },
  });

interface Props extends WithStyles<typeof styles>, WithRoutesDataProps {}

interface State {}

class DetailsRaw extends React.PureComponent<Props, State> {
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

  private getPodsNumber = (component: ApplicationComponentDetails): string => {
    let runningCount = 0;

    component.get("pods").forEach((pod) => {
      if (pod.get("status") === "Succeeded" || pod.get("status") === "Running") {
        runningCount = runningCount + 1;
      }
    });

    return `${runningCount}/${component.get("pods").size}`;
  };

  private getPieChartData() {
    const { activeNamespace } = this.props;

    let componentSuccess = 0;
    let componentPending = 0;
    let componentError = 0;
    let podSuccess = 0;
    let podPending = 0;
    let podError = 0;

    activeNamespace!.get("components")?.forEach((component) => {
      let hasError = false;
      let hasPending = false;
      component.get("pods").forEach((pod) => {
        if (pod.get("status") === "Succeeded" || pod.get("status") === "Running") {
          podSuccess = podSuccess + 1;
        } else if (pod.get("status") === "Failed") {
          podError = podError + 1;
          hasError = true;
        } else {
          podPending = podPending + 1;
          hasPending = true;
        }
      });

      if (hasError) {
        componentError = componentError + 1;
      } else if (hasPending) {
        componentPending = componentPending + 1;
      } else {
        componentSuccess = componentSuccess + 1;
      }
    });

    return {
      componentSuccess,
      componentPending,
      componentError,
      podSuccess,
      podPending,
      podError,
    };
  }

  private renderResourcesUsage() {
    const { activeNamespace } = this.props;

    return (
      <Grid container spacing={2}>
        <Grid item md>
          <BigCPULineChart data={activeNamespace!.get("metrics")?.get("cpu")} />
        </Grid>
        <Grid item md>
          <BigMemoryLineChart data={activeNamespace!.get("metrics")?.get("memory")} />
        </Grid>
      </Grid>
    );
  }

  private renderWarnings() {
    const { activeNamespace } = this.props;
    let warnings: { componentName: string; podName: string; message: string }[] = [];

    if (activeNamespace!.get("components")) {
      activeNamespace!.get("components").forEach((c) => {
        c.get("pods").forEach((p) => {
          p.get("warnings").forEach((w) => {
            warnings.push({
              componentName: c.get("name"),
              podName: p.get("name"),
              message: w.get("message"),
            });
          });
        });
      });
    }

    return (
      <KTable
        columns={[
          { field: "componentName", title: "Component" },
          { field: "podName", title: "Pod" },
          {
            field: "message",
            title: "Message",
            render: ({ message }: { message: string }) => <Typography color="error">{message}</Typography>,
          },
        ]}
        options={{
          paging: warnings.length > 20,
        }}
        data={warnings}
      />
    );
  }

  public render() {
    const pieChartData = this.getPieChartData();
    return (
      <>
        <Expansion title="Workload" defaultUnfold>
          <Grid container spacing={2}>
            <Grid item md={2}>
              <DoughnutChart
                title="Components"
                labels={["Running", "Pending", "Error"]}
                data={[pieChartData.componentSuccess, pieChartData.componentPending, pieChartData.componentError]}
              />
            </Grid>
            <Grid item md={2}>
              <DoughnutChart
                title="Pods"
                labels={["Running", "Pending", "Error"]}
                data={[pieChartData.podSuccess, pieChartData.podPending, pieChartData.podError]}
              />
            </Grid>
            <Grid item md={2}>
              <DoughnutChart title="Routes" labels={["Running"]} data={[this.props.httpRoutes.size]} />
            </Grid>
          </Grid>
        </Expansion>
        <Expansion title="Metrics" defaultUnfold>
          {/*{this.renderResourcesUsage()}*/}
          <div>Ingress bytes / minute</div>
          <div>Exgress bytes / minute</div>
          <div>http 500 count</div>
          <div>http 200 count</div>
          <div>http 400 count</div>
          <div>response legacy data</div>
        </Expansion>

        <Expansion title="Resources" defaultUnfold>
          {this.renderResourcesUsage()}
        </Expansion>

        <Expansion title="Warnings" defaultUnfold>
          {this.renderWarnings()}
        </Expansion>
      </>
    );
  }
}

export const ApplicationOverview = withStyles(styles)(withRoutesData(DetailsRaw));
