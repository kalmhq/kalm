import { Box, createStyles, Theme, WithStyles, withStyles } from "@material-ui/core";
import { Alert } from "@material-ui/lab";
import React from "react";
import { connect } from "react-redux";
import { deletePersistentVolumeAction, loadPersistentVolumesAction } from "../../actions/persistentVolume";
import { RootState } from "../../reducers";
import { TDispatchProp } from "../../types";
import { PersistentVolumeContent } from "../../types/persistentVolume";
import { BasePage } from "../BasePage";
import { setErrorNotificationAction } from "../../actions/notification";
import { ConfirmDialog } from "../../widgets/ConfirmDialog";
import { IconButtonWithTooltip } from "../../widgets/IconButtonWithTooltip";
import { primaryColor } from "../../theme";
import { DeleteIcon } from "../../widgets/Icon";
import { KTable } from "widgets/Table";
import { K8sApiPrefix } from "api/realApi";

const mapStateToProps = (state: RootState) => {
  return {
    persistentVolumes: state.get("persistentVolumes").get("persistentVolumes"),
  };
};

const styles = (theme: Theme) =>
  createStyles({
    root: {},
  });

interface States {
  loadPersistentVolumesError: boolean;
  loadingPersistentVolumes: boolean;
  isDeleteConfirmDialogOpen: boolean;
  deletingPersistentVolumeName?: string;
}

interface RowData extends PersistentVolumeContent {
  index: number;
}

type Props = ReturnType<typeof mapStateToProps> & TDispatchProp & WithStyles<typeof styles>;

export class VolumesRaw extends React.Component<Props, States> {
  constructor(props: Props) {
    super(props);
    this.state = {
      loadPersistentVolumesError: false,
      loadingPersistentVolumes: true,
      isDeleteConfirmDialogOpen: false,
      deletingPersistentVolumeName: undefined,
    };
  }

  private showDeleteConfirmDialog = (deletingPersistentVolumeName: string) => {
    this.setState({
      isDeleteConfirmDialogOpen: true,
      deletingPersistentVolumeName,
    });
  };

  private closeDeleteConfirmDialog = () => {
    this.setState({
      isDeleteConfirmDialogOpen: false,
      deletingPersistentVolumeName: undefined,
    });
  };

  private renderDeleteConfirmDialog = () => {
    const { isDeleteConfirmDialogOpen, deletingPersistentVolumeName } = this.state;

    return (
      <ConfirmDialog
        open={isDeleteConfirmDialogOpen}
        onClose={this.closeDeleteConfirmDialog}
        title={`Are you sure to delete this Persistent Volume(${deletingPersistentVolumeName})?`}
        content="You will lost this Persistent Volume, and this action is irrevocable."
        onAgree={this.confirmDelete}
      />
    );
  };

  private confirmDelete = async () => {
    const { dispatch } = this.props;
    try {
      const { deletingPersistentVolumeName } = this.state;
      if (deletingPersistentVolumeName) {
        await dispatch(deletePersistentVolumeAction(deletingPersistentVolumeName));
      }
    } catch {
      dispatch(setErrorNotificationAction());
    }
  };

  componentDidMount() {
    this.props
      .dispatch(loadPersistentVolumesAction())
      .catch((e) => {
        if (e.isAxiosError) {
          this.setState({ loadPersistentVolumesError: true });
        }
      })
      .finally(() => {
        this.setState({
          loadingPersistentVolumes: false,
        });
      });
  }

  getTableData = () => {
    const { persistentVolumes } = this.props;

    const data: RowData[] = [];
    persistentVolumes.forEach((pv, index) => {
      data.push({
        index: index,
        name: pv.get("name"),
        isInUse: pv.get("isInUse"),
        componentNamespace: pv.get("componentNamespace"),
        componentName: pv.get("componentName"),
        phase: pv.get("phase"),
        capacity: pv.get("capacity"),
      });
    });

    return data;
  };

  private renderActions = (rowData: RowData) => {
    return (
      <>
        <IconButtonWithTooltip
          disabled={rowData.isInUse}
          tooltipTitle={rowData.isInUse ? "This Persistent Volume can't be removed" : "Delete"}
          style={{ color: primaryColor }}
          onClick={() => {
            this.showDeleteConfirmDialog(rowData.name);
          }}
        >
          <DeleteIcon />
        </IconButtonWithTooltip>
      </>
    );
  };

  render() {
    const { loadPersistentVolumesError } = this.state;
    const tableData = this.getTableData();

    return (
      <BasePage secondHeaderRight="Volumes">
        {this.renderDeleteConfirmDialog()}
        <Box p={2}>
          {loadPersistentVolumesError ? (
            <Alert severity="error">
              <Box>
                Kapp fails to load persistentVolumes from current cluster with endpoint <strong>{K8sApiPrefix}</strong>.
                Please check your connection.
              </Box>
            </Alert>
          ) : null}

          <KTable
            options={{
              paging: tableData.length > 20,
            }}
            columns={[
              { title: "Name", field: "name", sorting: false },
              { title: "Is In Use", field: "isInUse", sorting: false },
              { title: "ComponentNamespace", field: "componentNamespace", sorting: false },
              { title: "ComponentName", field: "componentName", sorting: false },
              { title: "Phase", field: "phase", sorting: false },
              { title: "Capacity", field: "capacity", sorting: false },
              {
                title: "Actions",
                field: "action",
                sorting: false,
                searchable: false,
                render: this.renderActions,
              },
            ]}
            data={tableData}
            title=""
          />
        </Box>
      </BasePage>
    );
  }
}

export const Volumes = connect(mapStateToProps)(withStyles(styles)(VolumesRaw));
