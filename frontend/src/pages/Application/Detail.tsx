import { createStyles, Grid, Theme, Typography, withStyles, WithStyles, Box, Link } from "@material-ui/core";
import { grey } from "@material-ui/core/colors";
import React, { ReactElement } from "react";
import { ApplicationComponentDetails, PodStatus } from "types/application";
import { ErrorBadge, PendingBadge, SuccessBadge } from "widgets/Badge";
import { BigCPULineChart, BigMemoryLineChart } from "widgets/SmallLineChart";
import { withRoutesData, WithRoutesDataProps } from "hoc/withRoutesData";
import { KTable } from "widgets/Table";
import { Expansion } from "forms/Route/expansion";
import { DoughnutChart } from "widgets/DoughnutChart";
import { HttpStatusCodeLineChart } from "widgets/charts/httpStatusCodeChart";
import Immutable from "immutable";
import { HttpBytesSizeChart } from "widgets/charts/httpBytesSizeChart";

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
    const { components } = this.props;

    let componentSuccess = 0;
    let componentPending = 0;
    let componentError = 0;
    let podSuccess = 0;
    let podPending = 0;
    let podError = 0;

    components?.forEach((component) => {
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

  private renderWarnings() {
    const { components, activeNamespace } = this.props;
    let warnings: { componentName: ReactElement; podName: ReactElement; message: string }[] = [];

    if (components) {
      components.forEach((c) => {
        c.get("pods").forEach((p) => {
          p.get("warnings").forEach((w) => {
            warnings.push({
              componentName: (
                <Link href={`/applications/${activeNamespace?.get("name")}/components/${c.get("name")}`}>
                  {c.get("name")}
                </Link>
              ),
              podName: (
                <Link href={`/applications/${activeNamespace?.get("name")}/components/${c.get("name")}`}>
                  {p.get("name")}
                </Link>
              ),
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

  private formatYAxesValue = (value: number, label: string) => {
    return `${label}: ${value.toFixed(2)}`;
  };

  public render() {
    const pieChartData = this.getPieChartData();
    const { activeNamespace } = this.props;

    return (
      <>
        <Expansion title="Workload" defaultUnfold>
          <Box display="flex" justifyContent={"space-around"}>
            <DoughnutChart
              title="Components"
              labels={["Running", "Pending", "Error"]}
              data={[pieChartData.componentSuccess, pieChartData.componentPending, pieChartData.componentError]}
            />
            <DoughnutChart
              title="Pods"
              labels={["Running", "Pending", "Error"]}
              data={[pieChartData.podSuccess, pieChartData.podPending, pieChartData.podError]}
            />
            <DoughnutChart title="Routes" labels={["Running"]} data={[this.props.httpRoutes.size]} />
          </Box>
        </Expansion>
        <Expansion title="Metrics" defaultUnfold>
          <Grid container spacing={2}>
            <Grid item xs>
              <Box pl={"58px"}>
                <HttpStatusCodeLineChart
                  formatYAxesValue={this.formatYAxesValue}
                  data={[
                    {
                      legend: "2xx",
                      data:
                        activeNamespace!.get("istioMetricHistories").get("httpRespCode2XXCount") || Immutable.List(),
                    },
                    {
                      legend: "4xx",
                      data:
                        activeNamespace!.get("istioMetricHistories").get("httpRespCode4XXCount") || Immutable.List(),
                    },
                    {
                      legend: "5xx",
                      data:
                        activeNamespace!.get("istioMetricHistories").get("httpRespCode5XXCount") || Immutable.List(),
                    },
                  ]}
                  title="http response code per second"
                />
              </Box>
            </Grid>
            <Grid item xs>
              <Box pl={"16px"}>
                <HttpBytesSizeChart
                  formatYAxesValue={this.formatYAxesValue}
                  data={[
                    {
                      legend: "request",
                      data: activeNamespace!.get("istioMetricHistories").get("httpRequestBytes") || Immutable.List(),
                    },
                    {
                      legend: "response",
                      data: activeNamespace!.get("istioMetricHistories").get("httpResponseBytes") || Immutable.List(),
                    },
                  ]}
                  title="http traffic"
                />
              </Box>
            </Grid>
          </Grid>
          <Grid container spacing={2}>
            <Grid item md>
              <BigCPULineChart data={activeNamespace!.get("metrics")?.get("cpu")} />
            </Grid>
            <Grid item md>
              <BigMemoryLineChart data={activeNamespace!.get("metrics")?.get("memory")} />
            </Grid>
          </Grid>
        </Expansion>

        <Expansion title="Warnings" defaultUnfold>
          {this.renderWarnings()}
        </Expansion>
      </>
    );
  }
}

export const ApplicationOverview = withStyles(styles)(withRoutesData(DetailsRaw));
