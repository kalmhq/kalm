import { Box, createStyles, Theme, WithStyles, withStyles } from "@material-ui/core";
import { Alert } from "@material-ui/lab";
import MaterialTable from "material-table";
import React from "react";
import { connect } from "react-redux";
import { K8sApiPrefix } from "../../actions/kubernetesApi";
import { loadPersistentVolumes } from "../../actions/persistentVolume";
import { RootState } from "../../reducers";
import { TDispatchProp } from "../../types";
import { PersistentVolumeContent } from "../../types/persistentVolume";
import { BasePage } from "../BasePage";

const mapStateToProps = (state: RootState) => {
  return {
    persistentVolumes: state.get("persistentVolumes").get("persistentVolumes")
  };
};

const styles = (theme: Theme) =>
  createStyles({
    root: {
      // padding: theme.spacing(3)
    }
  });

interface States {
  loadNodesError: boolean;
  loadingNodes: boolean;
}

type Props = ReturnType<typeof mapStateToProps> & TDispatchProp & WithStyles<typeof styles>;

export class VolumesRaw extends React.Component<Props, States> {
  constructor(props: Props) {
    super(props);
    this.state = {
      loadNodesError: false,
      loadingNodes: true
    };
  }

  componentDidMount() {
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
    const { persistentVolumes } = this.props;

    const data: PersistentVolumeContent[] = [];
    persistentVolumes.forEach((pv, index) => {
      data.push({
        name: pv.get("name"),
        isAvailable: pv.get("isAvailable"),
        componentNamespace: pv.get("componentNamespace"),
        componentName: pv.get("componentName"),
        phase: pv.get("phase"),
        capacity: pv.get("capacity")
      });
    });

    return data;
  };

  render() {
    const { classes } = this.props;
    const { loadNodesError } = this.state;

    return (
      <BasePage secondHeaderRight="Volumes">
        <div className={classes.root}>
          {loadNodesError ? (
            <Alert severity="error">
              <Box>
                Kapp fails to load persistentVolumes from current cluster with endpoint <strong>{K8sApiPrefix}</strong>.
                Please check your connection.
              </Box>
            </Alert>
          ) : null}

          <MaterialTable
            options={{
              padding: "dense",
              pageSize: 20
            }}
            columns={[
              { title: "Name", field: "name", sorting: false },
              { title: "IsAvailable", field: "isAvailable", sorting: false },
              { title: "ComponentNamespace", field: "componentNamespace", sorting: false },
              { title: "ComponentName", field: "componentName", sorting: false },
              { title: "Phase", field: "phase", sorting: false },
              { title: "Capacity", field: "capacity", sorting: false }
            ]}
            data={this.getTableData()}
            title=""
          />
        </div>
      </BasePage>
    );
  }
}

export const Volumes = connect(mapStateToProps)(withStyles(styles)(VolumesRaw));
