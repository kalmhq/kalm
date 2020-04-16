import { Box, createStyles, Theme, WithStyles, withStyles, Grid } from "@material-ui/core";
import MaterialTable from "material-table";
import React from "react";
import { connect } from "react-redux";
import { SmallCPULineChart, SmallMemoryLineChart, BigCPULineChart, BigMemoryLineChart } from "widgets/SmallLineChart";
import { loadNodesAction } from "../../actions/node";
import { RootState } from "../../reducers";
import { TDispatchProp } from "../../types";
import { BasePage } from "../BasePage";

const mapStateToProps = (state: RootState) => {
  return {
    nodes: state.get("nodes").get("nodes"),
    metrics: state.get("nodes").get("metrics")
  };
};

const styles = (theme: Theme) =>
  createStyles({
    root: {
      padding: theme.spacing(3)
    }
  });

interface States {}

type Props = ReturnType<typeof mapStateToProps> & TDispatchProp & WithStyles<typeof styles>;

export class NodeListRaw extends React.Component<Props, States> {
  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    this.props.dispatch(loadNodesAction());
  }

  getTableData = () => {
    const { nodes } = this.props;
    const data = nodes
      .map((node, index) => {
        const addresses = node
          .get("status")
          .get("addresses")
          .map((address, index) => {
            return (
              <div key={index}>
                {address.get("type")}: {address.get("address")}
              </div>
            );
          })
          .toArray();

        return {
          name: node.get("name"),
          info: (
            <>
              <Box>
                Kernel:{" "}
                {node
                  .get("status")
                  .get("nodeInfo")
                  .get("kernelVersion")}
              </Box>
              <Box>
                osImage:{" "}
                {node
                  .get("status")
                  .get("nodeInfo")
                  .get("osImage")}
              </Box>
              <Box>
                containerRuntimeVersion:{" "}
                {node
                  .get("status")
                  .get("nodeInfo")
                  .get("containerRuntimeVersion")}
              </Box>
            </>
          ),
          addresses,
          cpu: <SmallCPULineChart data={node.get("metrics").get("cpu")} />,
          memory: <SmallMemoryLineChart data={node.get("metrics").get("memory")} />,
          resources: (
            <>
              <Box>
                Cpu:{" "}
                {node
                  .get("status")
                  .get("allocatable")
                  .get("cpu")}{" "}
                allocatable / max{" "}
                {node
                  .get("status")
                  .get("capacity")
                  .get("cpu")}
              </Box>
              <Box>
                Memory:{" "}
                {node
                  .get("status")
                  .get("allocatable")
                  .get("memory")}
                allocatable / max{" "}
                {node
                  .get("status")
                  .get("capacity")
                  .get("memory")}
              </Box>
            </>
          )
        };
      })
      .toArray();

    return data;
  };

  render() {
    const { classes, metrics } = this.props;

    return (
      <BasePage title="Cluster Nodes">
        <div className={classes.root}>
          <Grid container spacing={2}>
            <Grid item md={6}>
              <BigCPULineChart data={metrics.get("cpu")} />
            </Grid>
            <Grid item md={6}>
              <BigMemoryLineChart data={metrics.get("memory")} />
            </Grid>
          </Grid>
          <Box mt={3}>
            <MaterialTable
              options={{
                padding: "dense",
                pageSize: 20
              }}
              columns={[
                { title: "Name", field: "name", sorting: false },
                { title: "Info", field: "info", sorting: false },
                { title: "Address", field: "addresses", sorting: false },
                { title: "Resources", field: "resources", sorting: false },
                { title: "CPU", field: "cpu", sorting: false },
                { title: "Memory", field: "memory", sorting: false },
                { title: "Alerts", field: "components", sorting: false }
              ]}
              data={this.getTableData()}
              title=""
            />
          </Box>
        </div>
      </BasePage>
    );
  }
}

export const NodeListPage = connect(mapStateToProps)(withStyles(styles)(NodeListRaw));
