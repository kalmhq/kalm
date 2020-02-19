import React from "react";
import { connect } from "react-redux";
import { TDispatchProp } from "../../actions";
import { loadNodesAction } from "../../actions/node";
import { K8sApiPerfix } from "../../actions/kubernetesApi";
import { RootState } from "../../reducers";
import { BasePage } from "../BasePage";
import { Alert } from "@material-ui/lab";
import {
  createStyles,
  Theme,
  WithStyles,
  withStyles,
  Box
} from "@material-ui/core";
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

type Props = ReturnType<typeof mapStateToProps> &
  TDispatchProp &
  WithStyles<typeof styles>;

export class NodeListRaw extends React.Component<Props, States> {
  constructor(props: Props) {
    super(props);
    this.state = {
      loadNodesError: false,
      loadingNodes: true
    };
  }

  componentWillMount() {
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
    console.log(nodes);
    const data = nodes.map((node, index) => {
      // const handleChange = () => {
      //   this.showSwitchingIsEnabledDialog(application.get("id"));
      // };

      // const onDeleteClick = () => {
      //   this.setDeletingApplicationAndConfirm(application.get("id"));
      // };

      // let status = null;

      // switch (application.get("status").get("status")) {
      //   case StatusTypePending:
      //     status = <StatusPending />;
      //     break;
      //   case StatusTypeRunning:
      //     status = <CheckCircleIcon color="primary" />;
      //     break;
      //   case StatusTypeError:
      //     status = <CheckCircleIcon color="primary" />;
      //     break;
      // }

      return {
        name: node.metadata!.name,
        info: (
          <>
            <Box>Kernel: {node.status!.nodeInfo!.kernelVersion}</Box>
            <Box>osImage: {node.status!.nodeInfo!.osImage}</Box>
            <Box>
              containerRuntimeVersion:{" "}
              {node.status!.nodeInfo!.containerRuntimeVersion}
            </Box>
          </>
        ),
        addresses: node.status!.addresses!.map(x => (
          <Box mr={1}>{x.address}</Box>
        )),
        conditions: node.status!.conditions!.map(x => (
          <Box mr={1}>
            {x.type} {x.status}
          </Box>
        )),
        resources: (
          <>
            <Box>
              Cpu: {node.status!.allocatable!.cpu} allocatable / max{" "}
              {node.status!.capacity!.cpu}
            </Box>
            <Box>
              Memory: {node.status!.allocatable!.memory} allocatable / max{" "}
              {node.status!.capacity!.memory}
            </Box>
          </>
        )
      };
    });

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
                Kapp fails to load nodes from current cluster with endpoint{" "}
                <strong>{K8sApiPerfix}</strong>. Please check your connection.
              </Box>
            </Alert>
          ) : loadingNodes ? null : (
            <Alert severity="info">
              Node is an original concept of kubernetes. It's a worker machine
              in Kubernetes, previously known as a minion. A node may be a VM or
              physical machine, depending on the cluster.
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
                { title: "Conditions", field: "conditions", sorting: false },
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

export const NodeList = connect(mapStateToProps)(
  withStyles(styles)(NodeListRaw)
);
