import { Box, Button, createStyles, Popover, Theme, WithStyles, withStyles } from "@material-ui/core";
import { Alert } from "@material-ui/lab";
import { K8sApiPrefix } from "api/realApi";
import PopupState, { bindPopover, bindTrigger } from "material-ui-popup-state";
import { StorageType } from "pages/Disks/StorageType";
import React from "react";
import { connect } from "react-redux";
import { DiskContent } from "types/disk";
import { H4 } from "widgets/Label";
import { KTable } from "widgets/Table";
import { setErrorNotificationAction } from "../../actions/notification";
import { deletePersistentVolumeAction, loadPersistentVolumesAction } from "../../actions/persistentVolume";
import { RootState } from "../../reducers";
import { primaryColor } from "../../theme";
import { TDispatchProp } from "../../types";
import { ConfirmDialog } from "../../widgets/ConfirmDialog";
import { DeleteIcon } from "../../widgets/Icon";
import { IconButtonWithTooltip } from "../../widgets/IconButtonWithTooltip";
import { BasePage } from "../BasePage";

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
  deletingPersistentVolume?: DiskContent;
}

interface RowData extends DiskContent {
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
      deletingPersistentVolume: undefined,
    };
  }

  private showDeleteConfirmDialog = (deletingPersistentVolume: DiskContent) => {
    this.setState({
      isDeleteConfirmDialogOpen: true,
      deletingPersistentVolume,
    });
  };

  private closeDeleteConfirmDialog = () => {
    this.setState({
      isDeleteConfirmDialogOpen: false,
      deletingPersistentVolume: undefined,
    });
  };

  private renderDeleteConfirmDialog = () => {
    const { isDeleteConfirmDialogOpen, deletingPersistentVolume } = this.state;

    return (
      <ConfirmDialog
        open={isDeleteConfirmDialogOpen}
        onClose={this.closeDeleteConfirmDialog}
        title={`Are you sure to delete this Persistent Volume(${deletingPersistentVolume?.name})?`}
        content="You will lost this Persistent Volume, and this action is irrevocable."
        onAgree={this.confirmDelete}
      />
    );
  };

  private confirmDelete = async () => {
    const { dispatch } = this.props;
    try {
      const { deletingPersistentVolume } = this.state;
      if (deletingPersistentVolume) {
        await dispatch(
          deletePersistentVolumeAction(
            deletingPersistentVolume.componentNamespace as string,
            deletingPersistentVolume.name,
          ),
        );
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
            this.showDeleteConfirmDialog(rowData);
          }}
        >
          <DeleteIcon />
        </IconButtonWithTooltip>
      </>
    );
  };

  private renderSecondHeaderRight() {
    return (
      <>
        <H4>Disks</H4>
        <PopupState variant="popover" popupId={"disks-creation-helper"}>
          {(popupState) => (
            <>
              <Button color="primary" size="small" variant="text" {...bindTrigger(popupState)}>
                How to attach new disk?
              </Button>
              <Popover
                {...bindPopover(popupState)}
                anchorOrigin={{
                  vertical: "bottom",
                  horizontal: "center",
                }}
                transformOrigin={{
                  vertical: "top",
                  horizontal: "center",
                }}
              >
                <Box p={2}>
                  You don't need to apply disk manually. Disk will be created when you declare authentic disks in
                  component form.
                </Box>
              </Popover>
            </>
          )}
        </PopupState>
        <StorageType />
      </>
    );
  }

  render() {
    const { loadPersistentVolumesError } = this.state;
    const tableData = this.getTableData();

    return (
      <BasePage secondHeaderRight={this.renderSecondHeaderRight()}>
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

export const DiskListPage = connect(mapStateToProps)(withStyles(styles)(VolumesRaw));
