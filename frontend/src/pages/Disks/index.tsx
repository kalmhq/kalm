import { Box, createStyles, Theme, WithStyles, withStyles } from "@material-ui/core";
import { Alert } from "@material-ui/lab";
import MaterialTable from "material-table";
import React from "react";
import { connect } from "react-redux";
import { TDispatchProp } from "../../types";
import { K8sApiPrefix } from "../../actions/kubernetesApi";
import { loadPersistentVolumes } from "../../actions/persistentVolumn";
import { RootState } from "../../reducers";
import { BasePage } from "../BasePage";
import { Link } from "react-router-dom";

const mapStateToProps = (state: RootState) => {
  return {
    persistentVolumns: state.get("persistentVolumns").get("persistentVolumns")
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

export class DisksRaw extends React.Component<Props, States> {
  constructor(props: Props) {
    super(props);
    this.state = {
      loadNodesError: false,
      loadingNodes: true
    };
  }

  componentWillMount() {
    this.props
      .dispatch(loadPersistentVolumes())
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
    const { persistentVolumns } = this.props;

    const data = persistentVolumns.map((pv, index) => {
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
        name: pv.metadata!.name,
        size: pv.spec!.capacity!.storage,
        accessModes: pv.spec!.accessModes!.join(", "),
        status: pv.status!.phase,
        cost: "$5 / month",
        ref: <Link to="/applications/1/edit"> application #1 </Link>
        // info: (
        //   <>
        //     <Box>Kernel: {pv.status.nodeInfo.kernelVersion}</Box>
        //     <Box>osImage: {pv.status.nodeInfo.osImage}</Box>
        //     <Box>
        //       containerRuntimeVersion:{" "}
        //       {pv.status.nodeInfo.containerRuntimeVersion}
        //     </Box>
        //   </>
        // ),
        // addresses: pv.status.addresses.map(x => <Box mr={1}>{x.address}</Box>),
        // conditions: pv.status.conditions.map(x => (
        //   <Box mr={1}>
        //     {x.type} {x.status}
        //   </Box>
        // )),
        // resources: (
        //   <>
        //     <Box>
        //       Cpu: {pv.status.allocatable.cpu} allocatable / max{" "}
        //       {pv.status.capacity.cpu}
        //     </Box>
        //     <Box>
        //       Memory: {pv.status.allocatable.memory} allocatable / max{" "}
        //       {pv.status.capacity.memory}
        //     </Box>
        //   </>
        // )
      };
    });

    return data;
  };

  render() {
    const { classes } = this.props;
    const { loadNodesError } = this.state;

    return (
      <BasePage title="Cluster Nodes">
        <div className={classes.root}>
          {loadNodesError ? (
            <Alert severity="error">
              <Box>
                Kapp fails to load persistentVolumns from current cluster with endpoint <strong>{K8sApiPrefix}</strong>.
                Please check your connection.
              </Box>
            </Alert>
          ) : null}

          <Box mt={3}>
            <MaterialTable
              options={{
                padding: "dense",
                pageSize: 20
              }}
              columns={[
                { title: "Name", field: "name", sorting: false },
                { title: "Size", field: "size", sorting: false },
                { title: "AccessModes", field: "accessModes", sorting: false },
                { title: "Status", field: "status", sorting: false },
                { title: "Cost", field: "cost", sorting: false },
                { title: "Ref", field: "ref", sorting: false }
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

export const Disks = connect(mapStateToProps)(withStyles(styles)(DisksRaw));
