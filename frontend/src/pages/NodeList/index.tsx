import React from "react";
import { connect } from "react-redux";
import { TDispatchProp } from "../../types";
import { loadNodesAction } from "../../actions/node";
import { K8sApiPrefix } from "../../actions/kubernetesApi";
import { RootState } from "../../reducers";
import { BasePage } from "../BasePage";
import { Alert } from "@material-ui/lab";
import { createStyles, Theme, WithStyles, withStyles, Box } from "@material-ui/core";
import MaterialTable from "material-table";

const mapStateToProps = (state: RootState) => {
  return {
    nodes: state.get("nodes").get("nodes")
  };
};

const styles = (theme: Theme) =>
  createStyles({
    root: {
      padding: theme.spacing(3)
    }
  });

interface States {
  loadNodesError: boolean;
  loadingNodes: boolean;
}

type Props = ReturnType<typeof mapStateToProps> & TDispatchProp & WithStyles<typeof styles>;

export class NodeListRaw extends React.Component<Props, States> {
  constructor(props: Props) {
    super(props);
    this.state = {
      loadNodesError: false,
      loadingNodes: true
    };
  }

  componentDidMount() {
    this.props
      .dispatch(loadNodesAction())
      .catch(e => {
        if (e.isAxiosError) {
          this.setState({ loadNodesError: true });
        }
      })
      .finally(() => {
        this.setState({
          loadingNodes: false
        });
      });
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
                } allocatable / max{" "}
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
    const { classes } = this.props;
    const { loadNodesError, loadingNodes } = this.state;

    return (
      <BasePage title="Cluster Nodes">
        <div className={classes.root}>
          {loadNodesError ? (
            <Alert severity="error">
              <Box>
                Kapp fails to load nodes from current cluster with endpoint <strong>{K8sApiPrefix}</strong>. Please
                check your connection.
              </Box>
            </Alert>
          ) : loadingNodes ? null : (
            <Alert severity="info">
              Node is an original concept of kubernetes. It's a worker machine in Kubernetes, previously known as a
              minion. A node may be a VM or physical machine, depending on the cluster.
            </Alert>
          )}

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
