import { createStyles, Paper, Theme, withStyles, WithStyles } from "@material-ui/core";
import LaptopWindowsIcon from "@material-ui/icons/LaptopWindows";
import ViewHeadlineIcon from "@material-ui/icons/ViewHeadline";
import clsx from "clsx";
import { formatDistance } from "date-fns";
import React from "react";
import { DispatchProp } from "react-redux";
import { ApplicationListItem } from "../../types/application";
import { ErrorBedge, PendingBedge, SuccessBedge, UnknownBedge } from "../../widgets/Bedge";
import { IconLinkWithToolTip } from "../../widgets/IconButtonWithTooltip";
import { SmallCPULineChart, SmallMemoryLineChart } from "../../widgets/SmallLineChart";
import { generateQueryForPods } from "./Log";
const styles = (theme: Theme) =>
  createStyles({
    root: {},
    componentRow: {
      paddingTop: theme.spacing(1.5),
      paddingBottom: theme.spacing(1.5),
      "& .name": {
        fontSize: 14
      }
    },
    componentContainer: {
      margin: theme.spacing(2),
      background: "#f5f5f5"
    },
    podContainer: {
      background: "#eaeaea"
    },
    chartTabelCell: {
      width: 130,
      textAlign: "center"
    },
    timeCell: {
      width: 120,
      textAlign: "center"
    },
    statusCell: {
      width: 200,
      textAlign: "center"
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
        justifyContent: "space-between"
      }
    },
    podHeaderRow: {
      color: "rgba(0, 0, 0, 0.87)",
      fontWeight: 500,
      lineHeight: "1.2857142857142856rem",
      "& .headerCell": {
        padding: "6px 16px 6px 16px",
        "&:first-child": {
          paddingLeft: 0
        },
        "&:last-child": {
          paddingRight: 0
        }
      }
    },
    podDataRow: {
      "& > :nth-child(1)": {
        flex: 1
      },
      "& > :nth-child(2)": {
        flex: 1
      }
    },
    actionCell: {
      width: 80,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-around"
    },
    podActionButton: {
      background: "white"
    }
  });

interface Props extends WithStyles<typeof styles>, DispatchProp {
  application: ApplicationListItem;
}

interface State {}

class DetailsRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  private renderStatus = (status: string) => {
    switch (status) {
      case "Running": {
        return <SuccessBedge text="Running" />;
      }
      case "ContainerCreating": {
        return <PendingBedge text="ContainerCreating" />;
      }
      case "Terminating": {
        return <PendingBedge text="Terminating" />;
      }
      case "Pending": {
        return <PendingBedge text="Pending" />;
      }
      case "Succeeded": {
        return <SuccessBedge text="Succeeded" />;
      }
      case "Failed": {
        return <ErrorBedge text="Failed" />;
      }
      case "CrashLoopBackOff": {
        return <ErrorBedge text="CrashLoopBackOff" />;
      }
      default: {
        return <UnknownBedge text={status} />;
      }
    }
  };

  private renderComponent = (index: number) => {
    const { classes, application } = this.props;
    const component = application.get("components")!.get(index)!;

    return (
      <Paper className={classes.componentContainer} key={index}>
        <div className={clsx(classes.rowContainer, classes.componentRow)}>
          <div className="name">
            <strong>{component.get("name")}</strong>
          </div>
          <div>
            <strong>Workload:</strong> {component.get("workloadType")}
          </div>
          <div>
            <strong>Image:</strong> registry.exmaple.com/group/project_name:tag_name (TODO)
          </div>
          <div>23 / 30 (TODO)</div>
          <div>10 days (TODO)</div>
          {/* <div className="right-part">
            <div className={classes.chartTabelCell}>
              <SmallCPULineChart data={component.get("metrics").get("cpu")!} />
            </div>
            <div className={classes.chartTabelCell}>
              <SmallMemoryLineChart data={component.get("metrics").get("memory")!} />
            </div>
          </div> */}
        </div>
        <div className={classes.podContainer}>
          {component.get("pods").size > 0 ? (
            <div className={clsx(classes.rowContainer, classes.podHeaderRow, classes.podDataRow)}>
              <div className="headerCell">Pod Name</div>
              <div className="headerCell">Node</div>
              <div className="right-part">
                <div className={clsx("headerCell", classes.statusCell)}>Status</div>
                <div className={clsx("headerCell", classes.timeCell)}>CreatedAt</div>
                <div className={clsx("headerCell", classes.timeCell)}>StartedAt</div>
                <div className={clsx("headerCell", classes.chartTabelCell)}>CPU</div>
                <div className={clsx("headerCell", classes.chartTabelCell)}>Memory</div>
                <div className={clsx("headerCell", classes.actionCell)}>Actions</div>
              </div>
            </div>
          ) : null}
          {component
            .get("pods")
            .map(x => {
              return (
                <div key={x.get("name")} className={clsx(classes.rowContainer, classes.podDataRow)}>
                  {/* <div className={classes.podContainer} key={x.get("name")}> */}
                  <div>{x.get("name")}</div>
                  <div>{x.get("node")}</div>
                  <div className="right-part">
                    <div className={classes.statusCell}>{this.renderStatus(x.get("status"))}</div>
                    <div className={classes.timeCell}>{formatDistance(x.get("createTimestamp"), new Date())}</div>
                    <div className={classes.timeCell}>{formatDistance(x.get("startTimestamp"), new Date())}</div>
                    <div className={classes.chartTabelCell}>
                      <SmallCPULineChart data={x.get("metrics").get("cpu")!} />
                    </div>
                    <div className={classes.chartTabelCell}>
                      <SmallMemoryLineChart data={x.get("metrics").get("memory")!} />
                    </div>
                    <div className={classes.actionCell}>
                      <IconLinkWithToolTip
                        className={classes.podActionButton}
                        size="small"
                        tooltipTitle="Log"
                        to={
                          `/applications/${application.get("namespace")}/${application.get("name")}/logs?` +
                          generateQueryForPods([x.get("name")], x.get("name"))
                        }>
                        <ViewHeadlineIcon />
                      </IconLinkWithToolTip>
                      <IconLinkWithToolTip
                        tooltipTitle="Shell"
                        size="small"
                        className={classes.podActionButton}
                        to={
                          `/applications/${application.get("namespace")}/${application.get("name")}/shells?` +
                          generateQueryForPods([x.get("name")], x.get("name"))
                        }>
                        <LaptopWindowsIcon />
                      </IconLinkWithToolTip>
                    </div>
                  </div>
                </div>
              );
            })
            .toArray()}
        </div>
      </Paper>
    );
  };

  public render() {
    const { application, classes } = this.props;
    return (
      <div className={classes.root}>
        {application
          .get("components")!
          .map((_x, index) => this.renderComponent(index))
          .toArray()}
      </div>
    );
  }
}

export const Details = withStyles(styles)(DetailsRaw);
