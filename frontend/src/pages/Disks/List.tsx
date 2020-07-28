import { Box, Button, createStyles, Popover, Theme, WithStyles, withStyles } from "@material-ui/core";
import { indigo } from "@material-ui/core/colors";
import { Alert } from "@material-ui/lab";
import { setErrorNotificationAction } from "actions/notification";
import { deletePersistentVolumeAction } from "actions/persistentVolume";
import { blinkTopProgressAction } from "actions/settings";
import { K8sApiPrefix } from "api/realApi";
import { push } from "connected-react-router";
import PopupState, { bindPopover, bindTrigger } from "material-ui-popup-state";
import { StorageType } from "pages/Disks/StorageType";
import React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { RootState } from "reducers";
import { primaryColor } from "theme/theme";
import { TDispatchProp } from "types";
import { Disk } from "types/disk";
import { CustomizedButton } from "widgets/Button";
import { ConfirmDialog } from "widgets/ConfirmDialog";
import { EmptyList } from "widgets/EmptyList";
import { DeleteIcon, KalmVolumeIcon } from "widgets/Icon";
import { IconButtonWithTooltip } from "widgets/IconButtonWithTooltip";
import { InfoBox } from "widgets/InfoBox";
import { KTable } from "widgets/Table";
import { BasePage } from "../BasePage";
import { sizeStringToGi } from "utils/sizeConv";
import { KTooltip } from "forms/Application/KTooltip";

const mapStateToProps = (state: RootState) => {
  return {
    persistentVolumes: state.get("persistentVolumes").get("persistentVolumes"),
    storageClasses: state.get("persistentVolumes").get("storageClasses"),
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
  deletingPersistentVolume?: Disk;
}

interface RowData extends Disk {
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

  private showDeleteConfirmDialog = (deletingPersistentVolume: Disk) => {
    this.setState({
      isDeleteConfirmDialogOpen: true,
      deletingPersistentVolume,
    });
  };

  private closeDeleteConfirmDialog = () => {
    this.setState({
      isDeleteConfirmDialogOpen: false,
    });
  };

  private renderDeleteConfirmDialog = () => {
    const { isDeleteConfirmDialogOpen, deletingPersistentVolume } = this.state;

    return (
      <ConfirmDialog
        open={isDeleteConfirmDialogOpen}
        onClose={this.closeDeleteConfirmDialog}
        title={`Are you sure to delete this Persistent Volume(${deletingPersistentVolume?.get("name")})?`}
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
            deletingPersistentVolume.get("componentNamespace") as string,
            deletingPersistentVolume.get("name"),
          ),
        );
      }
    } catch {
      dispatch(setErrorNotificationAction());
    }
  };

  getTableData = () => {
    const { persistentVolumes } = this.props;

    const dataList: RowData[] = [];
    persistentVolumes.forEach((pv, index) => {
      const data = pv as RowData;
      data.index = index;
      dataList.push(data);
    });

    return dataList;
  };

  private renderActions = (rowData: RowData) => {
    return (
      <>
        <IconButtonWithTooltip
          disabled={rowData.get("isInUse")}
          tooltipTitle={
            rowData.get("isInUse")
              ? "The disk must be unmounted(removed) from all associated components before it can be deleted"
              : "Delete"
          }
          onClick={() => {
            this.showDeleteConfirmDialog(rowData);
          }}
        >
          <DeleteIcon />
        </IconButtonWithTooltip>
      </>
    );
  };

  private renderDiskHelp() {
    return (
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
    );
  }

  private renderSecondHeaderRight() {
    return <>{/* <H6>Disks</H6>
        {this.renderDiskHelp()}
        <StorageType /> */}</>;
  }

  private renderApplication = (rowData: RowData) => {
    if (!rowData.get("isInUse")) {
      return (
        <KTooltip title={"Last used by"}>
          <Box>{rowData.get("componentNamespace")}</Box>
        </KTooltip>
      );
    }
    return (
      <Link
        style={{ color: primaryColor }}
        to={`/applications/${rowData.get("componentNamespace")}/components`}
        onClick={() => blinkTopProgressAction()}
      >
        {rowData.get("componentNamespace")}
      </Link>
    );
  };

  private renderComponent = (rowData: RowData) => {
    if (!rowData.get("isInUse")) {
      return (
        <KTooltip title={"Last used by"}>
          <Box> {rowData.get("componentName")}</Box>
        </KTooltip>
      );
    }
    return (
      <Link
        style={{ color: primaryColor }}
        to={`/applications/${rowData.get("componentNamespace")}/components/${rowData.get("componentName")}`}
        onClick={() => blinkTopProgressAction()}
      >
        {rowData.get("componentName")}
      </Link>
    );
  };

  private renderName = (rowData: RowData) => {
    return rowData.get("name");
  };

  private renderUse = (rowData: RowData) => {
    return rowData.get("isInUse") ? "Yes" : "No";
  };

  private renderCapacity = (rowData: RowData) => {
    return sizeStringToGi(rowData.get("capacity")) + " Gi";
  };

  private renderEmpty() {
    const { dispatch } = this.props;
    return (
      <EmptyList
        image={<KalmVolumeIcon style={{ height: 120, width: 120, color: indigo[200] }} />}
        title={"You don’t have any Disks."}
        content="Disks can be attached to Components to provide persistent storage. Disks can be created in the App Components page, and will show up here automatically."
        button={
          <CustomizedButton
            variant="contained"
            color="primary"
            onClick={() => {
              blinkTopProgressAction();
              dispatch(push(`/applications`));
            }}
          >
            View Applications
          </CustomizedButton>
        }
      />
    );
  }

  private renderInfoBox() {
    const { storageClasses } = this.props;

    const title = "Disk References";

    const options = [
      {
        title: "How to attach new disk?",
        content:
          "You don't need to apply disk manually. Disk will be created when you declare authentic disks in component form.",
      },
      {
        title: <StorageType storageClasses={storageClasses} />,
        content: "",
      },
    ];

    return <InfoBox title={title} options={options}></InfoBox>;
  }

  render() {
    const { persistentVolumes } = this.props;
    const { loadPersistentVolumesError } = this.state;
    const tableData = this.getTableData();

    return (
      <BasePage secondHeaderRight={this.renderSecondHeaderRight()}>
        {this.renderDeleteConfirmDialog()}
        <Box p={2}>
          {loadPersistentVolumesError ? (
            <Alert severity="error">
              <Box>
                Kalm fails to load persistentVolumes from current cluster with endpoint <strong>{K8sApiPrefix}</strong>.
                Please check your connection.
              </Box>
            </Alert>
          ) : null}

          {persistentVolumes.size > 0 ? (
            <KTable
              options={{
                paging: tableData.length > 20,
              }}
              columns={[
                { title: "Volume Name", field: "name", sorting: false, render: this.renderName },
                { title: "Mounted", field: "isInUse", sorting: false, render: this.renderUse },
                { title: "App", field: "componentNamespace", sorting: false, render: this.renderApplication },
                { title: "Component", field: "componentName", sorting: false, render: this.renderComponent },
                { title: "Size", field: "capacity", sorting: false, render: this.renderCapacity },
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
          ) : (
            this.renderEmpty()
          )}
        </Box>
        <Box p={2}>{this.renderInfoBox()}</Box>
      </BasePage>
    );
  }
}

export const DiskListPage = connect(mapStateToProps)(withStyles(styles)(VolumesRaw));
