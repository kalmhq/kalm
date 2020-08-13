import { Box, createStyles, Theme, WithStyles, withStyles } from "@material-ui/core";
import { indigo } from "@material-ui/core/colors";
import { Alert } from "@material-ui/lab";
import { setErrorNotificationAction } from "actions/notification";
import { deletePersistentVolumeAction } from "actions/persistentVolume";
import { blinkTopProgressAction } from "actions/settings";
import { K8sApiPrefix } from "api/realApi";
import { push } from "connected-react-router";
import { KTooltip } from "forms/Application/KTooltip";
import { StorageType } from "pages/Disks/StorageType";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { primaryColor } from "theme/theme";
import { TDispatchProp } from "types";
import { Disk } from "types/disk";
import { sizeStringToGi } from "utils/sizeConv";
import sc from "utils/stringConstants";
import { CustomizedButton } from "widgets/Button";
import { EmptyInfoBox } from "widgets/EmptyInfoBox";
import { DeleteIcon, KalmVolumeIcon } from "widgets/Icon";
import { IconButtonWithTooltip } from "widgets/IconButtonWithTooltip";
import { DeleteButtonWithConfirmPopover } from "widgets/IconWithPopover";
import { InfoBox } from "widgets/InfoBox";
import { KRTable } from "widgets/KRTable";
import { KLink } from "widgets/Link";
import { BasePage } from "../BasePage";

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

  // private renderDeleteConfirmDialog = () => {
  //   const { isDeleteConfirmDialogOpen, deletingPersistentVolume } = this.state;

  //   return (
  //     <ConfirmDialog
  //       open={isDeleteConfirmDialogOpen}
  //       onClose={this.closeDeleteConfirmDialog}
  //       title={`${sc.ARE_YOU_SURE_PREFIX} this Persistent Volume(${deletingPersistentVolume?.get("name")})?`}
  //       content="You will lost this Persistent Volume, and this action is irrevocable."
  //       onAgree={this.confirmDelete}
  //     />
  //   );
  // };

  private confirmDelete = async (rowData: RowData) => {
    const { dispatch } = this.props;
    try {
      await dispatch(deletePersistentVolumeAction(rowData.get("componentNamespace") as string, rowData.get("name")));
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
        {rowData.get("isInUse") ? (
          <IconButtonWithTooltip
            disabled
            tooltipTitle={"The disk must be unmounted(removed) from all associated components before it can be deleted"}
          >
            <DeleteIcon />
          </IconButtonWithTooltip>
        ) : (
          <DeleteButtonWithConfirmPopover
            popupId="delete-disk-popup"
            popupTitle="DELETE DISK?"
            confirmedAction={() => this.confirmDelete(rowData)}
          />
        )}
      </>
    );
  };

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
      <KLink
        style={{ color: primaryColor }}
        to={`/applications/${rowData.get("componentNamespace")}/components`}
        onClick={() => blinkTopProgressAction()}
      >
        {rowData.get("componentNamespace")}
      </KLink>
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
      <KLink
        style={{ color: primaryColor }}
        to={`/applications/${rowData.get("componentNamespace")}/components/${rowData.get("componentName")}`}
        onClick={() => blinkTopProgressAction()}
      >
        {rowData.get("componentName")}
      </KLink>
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

  private getKRTableColumns() {
    return [
      { Header: "Volume Name", accessor: "name" },
      { Header: "Mounted", accessor: "isInUse" },
      { Header: "App", accessor: "componentNamespace" },
      { Header: "Component", accessor: "componentName" },
      { Header: "Size", accessor: "capacity" },
      {
        Header: "Actions",
        accessor: "action",
      },
    ];
  }

  private getKRTableData() {
    const { persistentVolumes } = this.props;
    const data: any[] = [];

    persistentVolumes &&
      persistentVolumes.forEach((persistentVolume, index) => {
        const rowData = persistentVolume as RowData;
        data.push({
          name: this.renderName(rowData),
          isInUse: this.renderUse(rowData),
          componentNamespace: this.renderApplication(rowData),
          componentName: this.renderComponent(rowData),
          capacity: this.renderCapacity(rowData),
          actions: this.renderActions(rowData),
        });
      });

    return data;
  }

  private renderKRTable() {
    return <KRTable columns={this.getKRTableColumns()} data={this.getKRTableData()} />;
  }

  private renderEmpty() {
    const { dispatch } = this.props;
    return (
      <EmptyInfoBox
        image={<KalmVolumeIcon style={{ height: 120, width: 120, color: indigo[200] }} />}
        title={sc.EMPTY_VOLUME_TITLE}
        content={sc.EMPTY_VOLUME_SUBTITLE}
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
        title: "",
        content: sc.DISKS_INFOBOX_BOX1,
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

    return (
      <BasePage>
        {/* {this.renderDeleteConfirmDialog()} */}
        <Box p={2}>
          {loadPersistentVolumesError ? (
            <Alert severity="error">
              <Box>
                Kalm fails to load persistentVolumes from current cluster with endpoint <strong>{K8sApiPrefix}</strong>.
                Please check your connection.
              </Box>
            </Alert>
          ) : null}

          {persistentVolumes.size > 0 ? this.renderKRTable() : this.renderEmpty()}
        </Box>
        <Box p={2}>{this.renderInfoBox()}</Box>
      </BasePage>
    );
  }
}

export const DiskListPage = connect(mapStateToProps)(withStyles(styles)(VolumesRaw));
