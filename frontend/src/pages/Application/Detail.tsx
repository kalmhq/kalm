import { Box, createStyles, Grid, Link, Theme, Typography, withStyles, WithStyles } from "@material-ui/core";
import { grey } from "@material-ui/core/colors";
import { Expansion } from "forms/Route/expansion";
import { withNamespace, WithNamespaceProps } from "hoc/withNamespace";
import { withRoutesData, WithRoutesDataProps } from "hoc/withRoutesData";
import Immutable from "immutable";
import React, { ReactElement } from "react";
import { ApplicationComponentDetails, PodStatus } from "types/application";
import { TimestampFilter } from "utils/date";
import { ErrorBadge, PendingBadge, SuccessBadge } from "widgets/Badge";
import { HttpBytesSizeChart } from "widgets/charts/httpBytesSizeChart";
import { HttpStatusCodeLineChart } from "widgets/charts/httpStatusCodeChart";
import { DoughnutChart } from "widgets/DoughnutChart";
import { KRTable } from "widgets/KRTable";
import { BigCPULineChart, BigMemoryLineChart } from "widgets/SmallLineChart";

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

interface Props extends WithStyles<typeof styles>, WithNamespaceProps, WithRoutesDataProps {}

interface State {
  chartDateFilter: string;
}

class DetailsRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      chartDateFilter: "all",
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

  private getWarningsKRTableColumns() {
    return [
      { accessor: "componentName", Header: "Component" },
      { accessor: "podName", Header: "Pod" },
      {
        accessor: "message",
        Header: "Message",
      },
    ];
  }

  private getWarningsKRTableData() {
    const { components, activeNamespace } = this.props;
    let warnings: { componentName: ReactElement; podName: ReactElement; message: ReactElement }[] = [];

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
              message: <Typography color="error">{w.get("message")}</Typography>,
            });
          });
        });
      });
    }

    return warnings;
  }

  private renderWarningsKRTable() {
    return (
      <KRTable showTitle={false} columns={this.getWarningsKRTableColumns()} data={this.getWarningsKRTableData()} />
    );
  }

  private formatYAxesValue = (value: number, label: string) => {
    return value.toFixed(2);
    // return `${label}: ${value.toFixed(2)}`;
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
          {/* <Grid container spacing={2}>
            <Grid item xs={10}></Grid>
            <Grid item xs={2}>
              <KSelect
                label="Filter"
                value={this.state.chartDateFilter}
                options={[
                  {
                    value: "1h",
                    text: "1h",
                  },
                  {
                    value: "12h",
                    text: "12h",
                  },
                  {
                    value: "24h",
                    text: "24h",
                  },
                  {
                    value: "7days",
                    text: "7days",
                  },
                  {
                    value: "all",
                    text: "all",
                  },
                ]}
                onChange={(x) => {
                  this.setState({ chartDateFilter: x as string });
                }}
              />
            </Grid>
          </Grid> */}
          <Grid container spacing={2}>
            <Grid item xs>
              <HttpStatusCodeLineChart
                formatYAxesValue={this.formatYAxesValue}
                data={[
                  {
                    legend: "2xx",
                    data: activeNamespace!.get("istioMetricHistories").get("httpRespCode2XXCount") || Immutable.List(),
                  },
                  {
                    legend: "4xx",
                    data: activeNamespace!.get("istioMetricHistories").get("httpRespCode4XXCount") || Immutable.List(),
                  },
                  {
                    legend: "5xx",
                    data: activeNamespace!.get("istioMetricHistories").get("httpRespCode5XXCount") || Immutable.List(),
                  },
                ]}
                title="http response code per second"
                filter={this.state.chartDateFilter as TimestampFilter}
              />
            </Grid>
            <Grid item xs>
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
                filter={this.state.chartDateFilter as TimestampFilter}
              />
            </Grid>
          </Grid>
          <Grid container spacing={2}>
            <Grid item md>
              <BigCPULineChart
                data={activeNamespace!.get("metrics")?.get("cpu")}
                yAxesWidth={50}
                filter={this.state.chartDateFilter as TimestampFilter}
              />
            </Grid>
            <Grid item md>
              <BigMemoryLineChart
                data={activeNamespace!.get("metrics")?.get("memory")}
                yAxesWidth={50}
                filter={this.state.chartDateFilter as TimestampFilter}
              />
            </Grid>
          </Grid>
        </Expansion>

        <Expansion title="Warnings" defaultUnfold>
          {this.renderWarningsKRTable()}
        </Expansion>
      </>
    );
  }
}

export const ApplicationOverview = withStyles(styles)(withNamespace(withRoutesData(DetailsRaw)));
