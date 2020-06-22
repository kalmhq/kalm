import {
  Box,
  Button,
  createStyles,
  ExpansionPanel,
  ExpansionPanelDetails,
  ExpansionPanelSummary,
  Grid,
  Paper,
  Tab,
  Tabs,
  Theme,
  withStyles,
  WithStyles,
} from "@material-ui/core";
import { grey } from "@material-ui/core/colors";
import DeleteIcon from "@material-ui/icons/Delete";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import clsx from "clsx";
import { push } from "connected-react-router";
import { withNamespace, withNamespaceProps } from "permission/Namespace";
import React from "react";
import { ThunkDispatch } from "redux-thunk";
import { KappConsoleIcon, KappLogIcon } from "widgets/Icon";
import { deleteComponentAction, loadApplicationAction } from "../../actions/application";
import { deletePod } from "../../actions/kubernetesApi";
import { setErrorNotificationAction, setSuccessNotificationAction } from "../../actions/notification";
import { RootState } from "../../reducers";
import { Actions } from "../../types";
import { ApplicationComponentDetails, ApplicationDetails, PodStatus } from "../../types/application";
import { formatTimeDistance } from "../../utils";
import { ErrorBadge, PendingBadge, SuccessBadge } from "../../widgets/Badge";
import { IconButtonWithTooltip, IconLinkWithToolTip } from "../../widgets/IconButtonWithTooltip";
import { H5 } from "../../widgets/Label";
import { PieChartComponent } from "../../widgets/PieChart";
import {
  BigCPULineChart,
  BigMemoryLineChart,
  SmallCPULineChart,
  SmallMemoryLineChart,
} from "../../widgets/SmallLineChart";
import { generateQueryForPods } from "./Log";
import { blinkTopProgressAction } from "../../actions/settings";

const styles = (theme: Theme) =>
  createStyles({
    root: {
      // padding: theme.spacing(2)
    },
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
    metrics: {},
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
    resources: {
      padding: theme.spacing(2),
    },
    volumeWrapper: {
      padding: `0 ${theme.spacing(2)}px`,
    },
  });

interface Props extends WithStyles<typeof styles>, withNamespaceProps {
  application: ApplicationDetails;
  activeNamespaceName: string;
  dispatch: ThunkDispatch<RootState, undefined, Actions>;
}

interface State {
  currentTabIndex: number;
}

const Status = "Status";
const Resources = "Resources";

class DetailsRaw extends React.PureComponent<Props, State> {
  private tabs = [Status, Resources];

  constructor(props: Props) {
    super(props);
    this.state = {
      currentTabIndex: 0,
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

  private renderVolumes = (index: number) => {
    const { classes, application } = this.props;
    const component = application.get("components")?.get(index)!;

    return component?.get("volumes")?.map((v) => {
      return (
        <Grid container spacing={2} className={classes.volumeWrapper}>
          <Grid item>{v.get("type")}</Grid>
          <Grid item>{v.get("size")}</Grid>
          <Grid item>Mounted</Grid>
          <Grid item>{v.get("path")}</Grid>
        </Grid>
      );
    });
  };

  private renderComponentPanel = (index: number) => {
    const { classes, application } = this.props;
    const component = application.get("components")?.get(index)!;

    return (
      <ExpansionPanel key={index}>
        <ExpansionPanelSummary
          style={{ padding: "0px 16px" }}
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1a-content"
          id={`applicationComponent-${index}`}
        >
          <div className={classes.summaryWrapper}>
            <div
              className={classes.flexWrapper}
              style={{ width: "20%", cursor: "pointer" }}
              // onClick={() => {
              //   dispatch(push(`/applications/${application.get("name")}/components/${component.get("name")}`));
              // }}
            >
              {this.renderComponentStatus(component)} <H5>{component.get("name")}</H5>
              <div style={{ marginLeft: 8 }}>({component.get("workloadType") || "Server"})</div>
            </div>
            <div className={classes.flexWrapper} style={{ width: "40%" }}>
              {component.get("image")}
            </div>
            <div className={classes.flexWrapper} style={{ width: "20%" }}>
              <H5>Pods:</H5>
              <div style={{ marginLeft: 8 }}>{this.getPodsNumber(component)}</div>
            </div>
          </div>
        </ExpansionPanelSummary>
        <ExpansionPanelDetails style={{ padding: 0 }}>{this.renderComponentDetail(index)}</ExpansionPanelDetails>
      </ExpansionPanel>
    );
  };

  private renderComponentDetail = (index: number) => {
    const { classes, application, dispatch, hasRole } = this.props;
    const component = application.get("components")?.get(index)!;
    const hasWriterRole = hasRole("writer");
    // const externalAccessPlugin = Immutable.List([]);
    // component.get("plugins") &&
    // (component.get("plugins")!.filter(p => p.get("type") === EXTERNAL_ACCESS_PLUGIN_TYPE) as
    //   | Immutable.List<ImmutableMap<ExternalAccessPlugin>>
    //   | undefined);
    return (
      <Paper className={classes.componentContainer} key={index}>
        {/* <div className={clsx(classes.rowContainer, classes.componentRow)}>
          <div className="name">
            <strong>{component.get("name")}</strong> ({component.get("workloadType")})
          </div>

          <div className="right-part">
            <div className={classes.chartTabelCell}>
              <SmallCPULineChart data={component.get("metrics").get("cpu")!} />
            </div>
            <div className={classes.chartTabelCell}>
              <SmallMemoryLineChart data={component.get("metrics").get("memory")!} />
            </div>
          </div>
        </div> */}

        <Box p={2}>
          <div className={classes.flexWrapper}>
            <H5>CPU:</H5>
            <div style={{ marginLeft: 8 }}>{component.get("cpu")}</div>
          </div>

          <div className={classes.flexWrapper}>
            <H5>Memory:</H5>
            <div style={{ marginLeft: 8 }}>{component.get("memory")}</div>
          </div>

          <div className={classes.flexWrapper}>
            <H5>Pods:</H5>{" "}
            <div style={{ marginLeft: 8 }}>{component.get("pods") ? component.get("pods").size : "-"}</div>
          </div>
        </Box>

        <Box p={2} className={classes.componentActions}>
          <Button
            style={{ marginRight: 20 }}
            color="primary"
            size="large"
            onClick={() => {
              dispatch(push(`/applications/${application.get("name")}/edit?component=${component.get("name")}`));
            }}
          >
            Scale
          </Button>
          <Button
            style={{ marginRight: 20 }}
            color="primary"
            size="large"
            onClick={() => {
              dispatch(push(`/applications/${application.get("name")}/edit?component=${component.get("name")}`));
            }}
          >
            Edit
          </Button>
          <Button
            style={{ marginRight: 20 }}
            color="primary"
            size="large"
            onClick={() => {
              blinkTopProgressAction();
              dispatch(deleteComponentAction(component.get("name"), application.get("name")));
            }}
          >
            Delete
          </Button>
        </Box>

        {/* <Box p={2}>
          <div>Internal Endpoints:</div>
          <Box ml={2}>
            {component
              .get("services")
              .map(serviceStatus => {
                const dns = `${serviceStatus.get("name")}.${application.get("namespace")}`;
                return serviceStatus
                  .get("ports")
                  .map(port => {
                    return (
                      <div key={port.get("name")}>
                        <strong>{port.get("name")}</strong>: {dns}:{port.get("port")}
                      </div>
                    );
                  })
                  .toArray();
              })
              .toArray()
              .flat()}
          </Box>
        </Box> */}

        <div className={classes.podContainer}>
          {component.get("pods").size > 0 ? (
            <div className={clsx(classes.rowContainer, classes.podHeaderRow, classes.podDataRow)}>
              <div className="headerCell">Pod Name</div>
              <div className="headerCell">Node</div>
              <div className="right-part">
                <div className={clsx("headerCell", classes.restartsCountCell)}>Restarts</div>
                <div className={clsx("headerCell", classes.statusCell)}>Status</div>
                <div className={clsx("headerCell", classes.timeCell)}>AGE</div>
                {/* <div className={clsx("headerCell", classes.timeCell)}>StartedAt</div> */}
                <div className={clsx("headerCell", classes.chartTabelCell)}>CPU</div>
                <div className={clsx("headerCell", classes.chartTabelCell)}>Memory</div>
                <div className={clsx("headerCell", classes.actionCell)}>Actions</div>
              </div>
            </div>
          ) : null}
          {component
            .get("pods")
            .map((pod, index) => {
              const containerNames = pod
                .get("containers")
                .map((container) => container.get("name"))
                .toArray();
              return (
                <div key={index}>
                  <div key={index} className={clsx(classes.rowContainer, classes.podDataRow)}>
                    {/* <div className={classes.podContainer} key={pod.get("name")}> */}

                    <div style={{ display: "flex", alignItems: "center" }}>
                      {this.renderPodStatus(pod)}
                      {pod.get("name")}
                    </div>
                    <div>{pod.get("node")}</div>
                    <div className="right-part">
                      <div className={classes.restartsCountCell}>{pod.get("restarts")}</div>
                      <div className={classes.statusCell}>{pod.get("statusText")}</div>
                      <div className={classes.timeCell}>{formatTimeDistance(pod.get("createTimestamp"))}</div>
                      {/* <div className={classes.timeCell}>{differenceInMinutes(pod.get("startTimestamp"), new Date())}</div> */}
                      <div className={classes.chartTabelCell}>
                        <SmallCPULineChart data={pod.get("metrics").get("cpu")!} />
                      </div>
                      <div className={classes.chartTabelCell}>
                        <SmallMemoryLineChart data={pod.get("metrics").get("memory")!} />
                      </div>
                      <div className={classes.actionCell}>
                        <IconLinkWithToolTip
                          onClick={() => {
                            blinkTopProgressAction();
                          }}
                          className={classes.podActionButton}
                          size="small"
                          tooltipTitle="Log"
                          to={
                            `/applications/${application.get("name")}/logs?` +
                            generateQueryForPods(
                              this.props.activeNamespaceName,
                              [[pod.get("name"), containerNames[0]]],
                              [pod.get("name"), containerNames[0]],
                            )
                          }
                        >
                          <KappLogIcon />
                        </IconLinkWithToolTip>
                        {hasWriterRole ? (
                          <IconLinkWithToolTip
                            onClick={() => {
                              blinkTopProgressAction();
                            }}
                            tooltipTitle="Shell"
                            size="small"
                            className={classes.podActionButton}
                            to={
                              `/applications/${application.get("name")}/shells?` +
                              generateQueryForPods(
                                this.props.activeNamespaceName,
                                [[pod.get("name"), containerNames[0]]],
                                [pod.get("name"), containerNames[0]],
                              )
                            }
                          >
                            <KappConsoleIcon />
                          </IconLinkWithToolTip>
                        ) : null}
                        {hasWriterRole ? (
                          <IconButtonWithTooltip
                            tooltipTitle="Delete"
                            size="small"
                            className={classes.podActionButton}
                            onClick={async () => {
                              blinkTopProgressAction();

                              try {
                                await deletePod(application.get("name"), pod.get("name"));
                                dispatch(setSuccessNotificationAction(`Delete pod ${pod.get("name")} successfully`));
                                // reload
                                dispatch(loadApplicationAction(application.get("name")));
                              } catch (e) {
                                dispatch(setErrorNotificationAction(e.response.data.message));
                              }
                            }}
                          >
                            <DeleteIcon />
                          </IconButtonWithTooltip>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <Box pl={2} pr={2}>
                    {/* Do not show errors when pod is terminating */}
                    {pod.get("isTerminating")
                      ? null
                      : pod
                          .get("warnings")
                          .map((w, index) => {
                            return (
                              <Box ml={2} color="error.main" key={index}>
                                {index + 1}. {w.get("message")}
                              </Box>
                            );
                          })
                          .toArray()}
                  </Box>
                  <div key={pod.get("name")} className={clsx(classes.rowContainer, classes.viewMoreWrapper)}>
                    <Button
                      style={{ marginRight: 20 }}
                      color="primary"
                      size="large"
                      onClick={() => {
                        blinkTopProgressAction();
                        dispatch(push(`/applications/${application.get("name")}/components/${component.get("name")}`));
                      }}
                    >
                      View More
                    </Button>
                  </div>
                </div>
              );
            })
            .toArray()}
        </div>
      </Paper>
    );
  };

  private getPieChartData() {
    const { application } = this.props;

    let componentSuccess = 0;
    let componentPending = 0;
    let componentError = 0;
    let podSuccess = 0;
    let podPending = 0;
    let podError = 0;

    application.get("components")?.forEach((component) => {
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

  private renderStatus() {
    const { application, classes } = this.props;

    const pieChartData = this.getPieChartData();

    return (
      <>
        <Grid container spacing={2} className={classes.metrics}>
          <Grid item md={2} style={{ padding: 20 }}>
            <PieChartComponent
              title="Components"
              labels={["Running", "Pending", "Error"]}
              data={[pieChartData.componentSuccess, pieChartData.componentPending, pieChartData.componentError]}
            />
          </Grid>
          <Grid item md={2} style={{ padding: 20 }}>
            <PieChartComponent
              title="Pods"
              labels={["Running", "Pending", "Error"]}
              data={[pieChartData.podSuccess, pieChartData.podPending, pieChartData.podError]}
            />
          </Grid>
          <Grid item md={4}>
            <BigCPULineChart data={application.get("metrics")?.get("cpu")} />
          </Grid>
          <Grid item md={4}>
            <BigMemoryLineChart data={application.get("metrics")?.get("memory")} />
          </Grid>
        </Grid>

        {application
          .get("components")
          ?.map((_x, index) => this.renderComponentPanel(index))
          ?.toArray()}
      </>
    );
  }

  private renderResources() {
    const { classes, application } = this.props;

    return (
      <div className={classes.resources}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={12} md={12}>
            <H5>Volumes</H5>
          </Grid>
        </Grid>
        {application
          .get("components")
          ?.map((_x, index) => this.renderVolumes(index))
          ?.toArray()}
      </div>
    );
  }

  private renderTabDetails() {
    switch (this.tabs[this.state.currentTabIndex]) {
      case Status: {
        return this.renderStatus();
      }
      case Resources: {
        return this.renderResources();
      }
    }

    return this.renderStatus();
  }

  private renderTabs() {
    const { classes } = this.props;
    return (
      <Tabs
        className={classes.tabs}
        value={this.state.currentTabIndex}
        variant="scrollable"
        scrollButtons="auto"
        indicatorColor="primary"
        textColor="primary"
        onChange={(event: React.ChangeEvent<{}>, value: number) => {
          this.setState({ currentTabIndex: value });
        }}
        aria-label="component form tabs"
      >
        {this.tabs.map((tab) => {
          return <Tab key={tab} label={tab} />;
        })}
      </Tabs>
    );
  }

  public render() {
    const { classes } = this.props;

    return (
      <div className={classes.root}>
        <div className={classes.tabsWrapper}>{this.renderTabs()}</div>

        {this.renderTabDetails()}
      </div>
    );
  }
}

export const Details = withStyles(styles)(withNamespace(DetailsRaw));
