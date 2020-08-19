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

  private confirmDelete = async (disk: Disk) => {
    const { dispatch } = this.props;
    try {
      await dispatch(deletePersistentVolumeAction(disk.get("componentNamespace") as string, disk.get("name")));
    } catch {
      dispatch(setErrorNotificationAction());
    }
  };

  private renderActions = (disk: Disk) => {
    return (
      <>
        {disk.get("isInUse") ? (
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
            confirmedAction={() => this.confirmDelete(disk)}
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

  private renderApplication = (disk: Disk) => {
    if (!disk.get("isInUse")) {
      return (
        <KTooltip title={"Last used by"}>
          <Box>{disk.get("componentNamespace")}</Box>
        </KTooltip>
      );
    }
    return (
      <KLink
        style={{ color: primaryColor }}
        to={`/applications/${disk.get("componentNamespace")}/components`}
        onClick={() => blinkTopProgressAction()}
      >
        {disk.get("componentNamespace")}
      </KLink>
    );
  };

  private renderComponent = (disk: Disk) => {
    if (!disk.get("isInUse")) {
      return (
        <KTooltip title={"Last used by"}>
          <Box> {disk.get("componentName")}</Box>
        </KTooltip>
      );
    }
    return (
      <KLink
        style={{ color: primaryColor }}
        to={`/applications/${disk.get("componentNamespace")}/components/${disk.get("componentName")}`}
        onClick={() => blinkTopProgressAction()}
      >
        {disk.get("componentName")}
      </KLink>
    );
  };

  private renderName = (disk: Disk) => {
    return disk.get("name");
  };

  private renderUse = (disk: Disk) => {
    return disk.get("isInUse") ? "Yes" : "No";
  };

  private renderCapacity = (disk: Disk) => {
    return sizeStringToGi(disk.get("capacity")) + " Gi";
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
        accessor: "actions",
      },
    ];
  }

  private getKRTableData() {
    const { persistentVolumes } = this.props;
    const data: any[] = [];

    persistentVolumes &&
      persistentVolumes.forEach((disk, index) => {
        data.push({
          name: this.renderName(disk),
          isInUse: this.renderUse(disk),
          componentNamespace: this.renderApplication(disk),
          componentName: this.renderComponent(disk),
          capacity: this.renderCapacity(disk),
          actions: this.renderActions(disk),
        });
      });

    return data;
  }

  private renderKRTable() {
    return <KRTable showTitle={true} title="Disks" columns={this.getKRTableColumns()} data={this.getKRTableData()} />;
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
