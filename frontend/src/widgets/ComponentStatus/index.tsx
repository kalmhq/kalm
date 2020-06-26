import { Box, createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import { grey } from "@material-ui/core/colors";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { TDispatchProp } from "types";
import { KPanel } from "widgets/KPanel";
import { APP_BAR_HEIGHT } from "layout/AppBar";
import { ApplicationComponentDetails, PodStatus } from "types/application";
import { ErrorBadge, PendingBadge, SuccessBadge } from "../Badge";
import { H5 } from "../Label";
import { DoughnutChart } from "widgets/DoughnutChart";
import { SectionTitle } from "../SectionTitle";

const RIGHT_DRAWER_WIDTH = 340;

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
    drawer: {
      width: RIGHT_DRAWER_WIDTH,
      flexShrink: 0,
      whiteSpace: "nowrap",
    },
    drawerPaper: {
      width: RIGHT_DRAWER_WIDTH,
      paddingTop: APP_BAR_HEIGHT,
      zIndex: 1201,
    },
    flexCenter: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    // <Box boxShadow={3}> doesn't work here, so use style boxShadow
    drawerShadow: {
      boxShadow:
        "rgba(0, 0, 0, 0.2) 0px 3px 3px -2px, rgba(0, 0, 0, 0.14) 0px 3px 4px 0px, rgba(0, 0, 0, 0.12) 0px 1px 8px 0px",
    },
    // material-ui official
    drawerOpen: {
      width: RIGHT_DRAWER_WIDTH,
      transition: theme.transitions.create("width", {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
      }),
    },
    drawerClose: {
      transition: theme.transitions.create("width", {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
      overflowX: "hidden",
      width: 70 + 1,
      [theme.breakpoints.up("sm")]: {
        width: 70 + 1,
      },
    },
  });

const mapStateToProps = (state: RootState) => {
  return {
    isOpenComponentStatusDrawer: state.get("settings").get("isOpenComponentStatusDrawer"),
  };
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
    const { classes, isOpenComponentStatusDrawer: open } = this.props;

    return (
      <div className={`${classes.podItem} ${open ? "" : classes.flexCenter}`} key={pod.get("name")}>
        <div className={classes.podName} style={{ marginRight: open ? 0 : "-6px" }}>
          {this.renderPodStatus(pod)}
          {open && pod.get("name")}
        </div>
        {open && <div className={classes.podStatus}>{pod.get("status")}</div>}
        {open && (
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
        )}
      </div>
    );
  }

  public render() {
    const { classes, component, isOpenComponentStatusDrawer: open } = this.props;
    const pieChartData = this.getPieChartData();
    if (!component) {
      return null;
    }

    return (
      <KPanel
        title={"Component Status"}
        content={
          <Box p={2} tutorial-anchor-id="component-from-pods-status">
            {/* <Paper className={classes.root} square>*/}
            {/* <div className={`${classes.componentTitle} ${open ? "" : classes.flexCenter}`}>
              <IconButton
                onClick={() => dispatch(setSettingsAction({ isOpenComponentStatusDrawer: !open }))}
                size={"small"}>
                {open ? <ChevronRightIcon /> : <ChevronLeftIcon />}
              </IconButton>{" "}
              {open && this.renderComponentStatus(component)} {open && <H5>{component.get("name")}</H5>}
            </div> */}

            {!open && (
              <div className={`${classes.componentTitle} ${open ? "" : classes.flexCenter}`}>
                <H5>Status</H5>
              </div>
            )}
            {!open && (
              <div className={classes.flexCenter} style={{ marginRight: "-6px", padding: "10px" }}>
                {this.renderComponentStatus(component)}
              </div>
            )}
            {open ? (
              <div className={classes.chartWrapperOpen}>
                <DoughnutChart
                  title={""}
                  labels={["Running", "Pending", "Error"]}
                  data={[pieChartData.podSuccess, pieChartData.podPending, pieChartData.podError]}
                />
              </div>
            ) : (
              <div className={classes.chartWrapperClose}>
                <DoughnutChart
                  insideLabel={true}
                  title={""}
                  labels={["Running", "Pending", "Error"]}
                  data={[pieChartData.podSuccess, pieChartData.podPending, pieChartData.podError]}
                />
              </div>
            )}
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
