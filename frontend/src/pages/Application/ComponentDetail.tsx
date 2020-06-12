import { createStyles, Theme, Grid, withStyles, WithStyles, Tabs } from "@material-ui/core";
import { withNamespace, withNamespaceProps } from "permission/Namespace";
import React from "react";
import { ThunkDispatch } from "redux-thunk";
import { RootState } from "../../reducers";
import { Actions } from "../../types";
import { ApplicationDetails, PodStatus, ApplicationComponentDetails } from "../../types/application";
import { ErrorBadge, PendingBadge, SuccessBadge } from "../../widgets/Badge";
import { Paper, Tab } from "@material-ui/core";
import { BigCPULineChart, BigMemoryLineChart } from "../../widgets/SmallLineChart";
import Typography from "@material-ui/core/Typography";
import { grey } from "@material-ui/core/colors";
import MaterialTable from "material-table";

const styles = (theme: Theme) =>
  createStyles({
    root: {
      padding: theme.spacing(2)
    },
    topStatus: {
      display: "flex",
      alignItems: "center"
    },
    paper: {
      boxShadow: "none",
      marginTop: 12
    },
    info: {
      fontSize: 18,
      color: grey[600]
    },
    infoLabel: {
      fontWeight: "bold"
    },
    label: {
      minWidth: 290,
      marginRight: 12
    },
    tableList: {
      marginTop: 12
    },
    tableLabel: {
      fontSize: 18,
      fontWeight: "bold"
    },
    table: {
      boxShadow: "none"
    },
    flexColumn: {
      display: "flex",
      flexDirection: "column"
    },
    flexRow: {
      display: "flex"
    }
  });

interface Props extends WithStyles<typeof styles>, withNamespaceProps {
  application: ApplicationDetails;
  component: ApplicationComponentDetails;
  activeNamespaceName: string;
  dispatch: ThunkDispatch<RootState, undefined, Actions>;
}

interface State {
  activeTab: number;
}

interface TabPanelProps {
  children?: React.ReactNode;
  className?: string;
  index: any;
  value: any;
}

interface RowData extends PodStatus {
  index: number;
}

function TabPanel(props: TabPanelProps) {
  const { value, index, ...other } = props;

  return (
    <Typography
      component="div"
      role="tabpanel"
      hidden={value !== index}
      id={`vertical-tabpanel-${index}`}
      aria-labelledby={`vertical-tab-${index}`}
      {...other}
    />
  );
}

function a11yProps(index: any) {
  return {
    id: `vertical-tab-${index}`,
    "aria-controls": `vertical-tabpanel-${index}`
  };
}

class DetailsRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      activeTab: 0
    };
  }

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

  private renderName = (rowData: RowData) => {
    return rowData.get("name");
  };

  private renderStatus = (rowData: RowData) => {
    switch (rowData.get("status")) {
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

  private renderRestarts = (rowData: RowData) => {
    return <span>{rowData.get("restarts")}</span>;
  };

  private getColumns() {
    return [
      {
        title: "Name",
        field: "name",
        sorting: false,
        render: this.renderName
      },
      { title: "Pods Status", field: "status", sorting: false, render: this.renderStatus },
      { title: "Restarts", name: "restarts", sorting: false, render: this.renderRestarts }
    ];
  }

  private getData = () => {
    const { component } = this.props;
    const data: RowData[] = [];

    component.get("pods").forEach((pod, index) => {
      const rowData = pod as RowData;
      rowData.index = index;
      data.push(rowData);
    });

    return data;
  };

  public render() {
    const { classes, component } = this.props;
    const { activeTab } = this.state;

    return (
      <div className={classes.root}>
        <div className={classes.topStatus}>
          {this.renderComponentStatus(component)}
          <span>{component.get("name")}</span>
        </div>
        <Paper square className={classes.paper}>
          <Tabs
            value={activeTab}
            indicatorColor="primary"
            textColor="primary"
            onChange={(_, index) => this.setState({ activeTab: index })}>
            <Tab label="Overview" {...a11yProps(0)} />
            <Tab label="Details" {...a11yProps(1)} />
            <Tab label="Revision History" disabled {...a11yProps(2)} />
            <Tab label="Events" disabled {...a11yProps(3)} />
          </Tabs>
        </Paper>
        <TabPanel value={activeTab} index={0}>
          <Paper className={classes.paper}>
            <Grid container spacing={2}>
              <Grid item md={6}>
                <BigCPULineChart data={component.get("metrics")?.get("cpu")} />
              </Grid>
              <Grid item md={6}>
                <BigMemoryLineChart data={component.get("metrics")?.get("memory")} />
              </Grid>
            </Grid>
          </Paper>
          <div className={classes.info}>
            <div className={classes.infoLabel}>Overview</div>
            <div className={classes.flexRow}>
              <span className={classes.label}>Image: </span>
              <span>{component.get("image")}</span>
            </div>
            <div className={classes.flexRow}>
              <span className={classes.label}>Resources: </span>
              <span>
                CPU {component.get("cpu")} Memory {component.get("memory")}
              </span>
            </div>
            <div className={classes.flexRow}>
              <span className={classes.label}>Restart Policy: </span>
              <span>{component.get("restartStrategy")}</span>
            </div>
            <div className={classes.flexRow}>
              <span className={classes.label}>DNS Policy: </span>
              <span>{component.get("dnsPolicy")}</span>
            </div>
            <div className={classes.flexRow}>
              <span className={classes.label}>Ports: </span>
              <span className={classes.flexColumn}>
                {component.get("ports")?.map((port, index) => {
                  return (
                    <span key={index}>
                      {port.get("name")} TCP {port.get("containerPort")}:{port.get("servicePort")}
                    </span>
                  );
                })}
              </span>
            </div>
            <div className={classes.flexRow}>
              <span className={classes.label}>Volumns: </span>
              <span className={classes.flexColumn}>
                {component.get("volumes")?.map((volume, index) => {
                  return (
                    <span key={index}>
                      Disk {volume.get("size")} {volume.get("type")} {volume.get("path")}
                    </span>
                  );
                })}
              </span>
            </div>
          </div>
          <div className={classes.tableList}>
            <div className={classes.tableLabel}>Pods</div>
            <MaterialTable
              options={{
                padding: "dense",
                draggable: false,
                toolbar: false,
                paging: false,
                rowStyle: {
                  verticalAlign: "baseline"
                },
                headerStyle: {
                  color: "black",
                  backgroundColor: grey[100],
                  fontSize: 12,
                  fontWeight: 400,
                  height: 20,
                  paddingTop: 0,
                  paddingBottom: 0
                }
              }}
              columns={this.getColumns()}
              data={this.getData()}
              title=""
            />
          </div>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <div className={classes.info}>
            <div className={classes.infoLabel}>Basic Info</div>
            <div className={classes.flexRow}>
              <span className={classes.label}>Workload Type: </span>
              <span>{component.get("workloadType")}</span>
            </div>
            <div className={classes.flexRow}>
              <span className={classes.label}>Image: </span>
              <span>{component.get("image")}</span>
            </div>
            <div className={classes.flexRow}>
              <span className={classes.label}>Command: </span>
              <span>{component.get("command")}</span>
            </div>
            <div className={classes.flexRow}>
              <span className={classes.label}>Environment Variables: </span>
              <span className={classes.flexColumn}>
                {component.get("env")?.map((e, index) => {
                  return (
                    <span key={index}>
                      {e.get("name")}:{e.get("value")}
                    </span>
                  );
                })}
              </span>
            </div>
            <div className={classes.flexRow}>
              <span className={classes.label}>Resources: </span>
              <span>
                CPU {component.get("cpu")} Memory {component.get("memory")}
              </span>
            </div>
            <div className={classes.flexRow}>
              <span className={classes.label}>Restart Policy: </span>
              <span>{component.get("restartStrategy")}</span>
            </div>
            <div className={classes.flexRow}>
              <span className={classes.label}>DNS Policy: </span>
              <span>{component.get("dnsPolicy")}</span>
            </div>
            <div className={classes.flexRow}>
              <span className={classes.label}>Termination Grace Period Seconds: </span>
              <span className={classes.flexColumn}>{component.get("terminationGracePeriodSeconds")}</span>
            </div>
            <div className={classes.flexRow}>
              <span className={classes.label}>Ports: </span>
              <span className={classes.flexColumn}>
                {component.get("ports")?.map((port, index) => {
                  return (
                    <span key={index}>
                      {port.get("name")} TCP {port.get("containerPort")}:{port.get("servicePort")}
                    </span>
                  );
                })}
              </span>
            </div>
            <div className={classes.flexRow}>
              <span className={classes.label}>Volumns: </span>
              <span className={classes.flexColumn}>
                {component.get("volumes")?.map((volume, index) => {
                  return (
                    <span key={index}>
                      Disk {volume.get("size")} {volume.get("type")} {volume.get("path")}
                    </span>
                  );
                })}
              </span>
            </div>
          </div>
        </TabPanel>
      </div>
    );
  }
}

export default withStyles(styles)(withNamespace(DetailsRaw));
