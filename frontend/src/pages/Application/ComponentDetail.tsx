import { createStyles, Theme, Grid, withStyles, WithStyles, Tabs } from "@material-ui/core";
import { withNamespace, withNamespaceProps } from "permission/Namespace";
import React from "react";
import { ThunkDispatch } from "redux-thunk";
import { RootState } from "../../reducers";
import { Actions } from "../../types";
import { ApplicationDetails, PodStatus, ApplicationComponentDetails } from "../../types/application";
import { ErrorBadge, PendingBadge, SuccessBadge } from "../../widgets/Badge";
import { CheckCircleIcon } from "widgets/Icon";
import { Paper, Tab, Fade } from "@material-ui/core";
import { BigCPULineChart, BigMemoryLineChart } from "../../widgets/SmallLineChart";
import Typography from "@material-ui/core/Typography";
import { grey } from "@material-ui/core/colors";
import MaterialTable from "material-table";
import { Link } from "react-router-dom";

const styles = (theme: Theme) =>
  createStyles({
    root: {
      padding: theme.spacing(2)
    },
    topStatus: {
      display: "flex",
      alignItems: "center",
      "& > span": {
        marginLeft: 12
      }
    },
    paper: {
      boxShadow: "none",
      marginTop: 12
    },
    overview: {
      fontSize: 18,
      color: grey[600]
    },
    overviewLabel: {
      fontWeight: "bold"
    },
    label: {
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
  private renderName = (rowData: RowData) => {
    return <Link to={`/applications/${rowData.get("name")}`}>{rowData.get("name")}</Link>;
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
        break;
      }
      case "Failed": {
        return <ErrorBadge />;
      }
    }
  };

  private getColumns() {
    return [
      {
        title: "Name",
        field: "name",
        sorting: false,
        render: this.renderName
      },
      { title: "Pods Status", field: "status", sorting: false, render: this.renderStatus }
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
          <CheckCircleIcon />
          <span>paymentservice</span>
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
        <Fade in={activeTab === 0}>
          <TabPanel value={0} index={0}>
            <Paper className={classes.paper}>
              <Grid container spacing={2}>
                <Grid item md={4}>
                  <BigCPULineChart data={component.get("metrics")?.get("cpu")} />
                </Grid>
                <Grid item md={4}>
                  <BigMemoryLineChart data={component.get("metrics")?.get("memory")} />
                </Grid>
              </Grid>
            </Paper>
            <div className={classes.overview}>
              <div className={classes.overviewLabel}>Overview</div>
              <div>
                <span className={classes.label}>Image: </span>
                <span>{component.get("name")}</span>
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
        </Fade>
      </div>
    );
  }
}

export default withStyles(styles)(withNamespace(DetailsRaw));
