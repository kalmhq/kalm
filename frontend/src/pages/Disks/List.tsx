import { Box, createStyles, Theme, WithStyles, withStyles } from "@material-ui/core";
import { blue } from "@material-ui/core/colors";
import { Alert } from "@material-ui/lab";
import { setErrorNotificationAction } from "actions/notification";
import { deletePersistentVolumeAction } from "actions/persistentVolume";
import { blinkTopProgressAction } from "actions/settings";
import { K8sApiPrefix } from "api/api";
import { push } from "connected-react-router";
import { withUserAuth, WithUserAuthProps } from "hoc/withUserAuth";
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
import { KTooltip } from "widgets/KTooltip";
import { KLink } from "widgets/Link";
import { BasePage } from "../BasePage";

const mapStateToProps = (state: RootState) => {
  return {
    persistentVolumes: state.persistentVolumes.persistentVolumes,
    storageClasses: state.persistentVolumes.storageClasses,
    componentsMap: state.components.components,
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

type Props = ReturnType<typeof mapStateToProps> & TDispatchProp & WithStyles<typeof styles> & WithUserAuthProps;

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

  private confirmDelete = async (disk: Disk) => {
    const { dispatch } = this.props;
    try {
      await dispatch(deletePersistentVolumeAction(disk.componentNamespace as string, disk.name));
    } catch {
      dispatch(setErrorNotificationAction());
    }
  };

  private isInUseAndHasComponent = (disk: Disk) => {
    if (!disk.isInUse) {
      return false;
    }

    const { componentsMap } = this.props;

    const components = componentsMap[disk.componentNamespace as string];
    if (!components || components.length === 0) {
      return false;
    }

    const componentIndex = components.findIndex((c) => c.name === disk.componentName);
    if (componentIndex === -1) {
      return false;
    }

    return true;
  };

  private renderActions = (disk: Disk) => {
    const { canEditCluster } = this.props;
    return canEditCluster() ? (
      <>
        {this.isInUseAndHasComponent(disk) ? (
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
    ) : null;
  };

  private renderSecondHeaderRight() {
    return <>{/* <H6>Disks</H6>
        {this.renderDiskHelp()}
        <StorageType /> */}</>;
  }

  private renderApplication = (disk: Disk) => {
    if (!this.isInUseAndHasComponent(disk)) {
      return (
        <KTooltip title={"Last used by"}>
          <Box>{disk.componentNamespace}</Box>
        </KTooltip>
      );
    }
    return (
      <KLink
        style={{ color: primaryColor }}
        to={`/applications/${disk.componentNamespace}/components`}
        onClick={() => blinkTopProgressAction()}
      >
        {disk.componentNamespace}
      </KLink>
    );
  };

  private renderComponent = (disk: Disk) => {
    if (!this.isInUseAndHasComponent(disk)) {
      return (
        <KTooltip title={"Last used by"}>
          <Box> {disk.componentName}</Box>
        </KTooltip>
      );
    }
    return (
      <KLink
        style={{ color: primaryColor }}
        to={`/applications/${disk.componentNamespace}/components/${disk.componentName}`}
        onClick={() => blinkTopProgressAction()}
      >
        {disk.componentName}
      </KLink>
    );
  };

  private renderName = (disk: Disk) => {
    return disk.name;
  };

  private renderUse = (disk: Disk) => {
    return this.isInUseAndHasComponent(disk) ? "Yes" : "No";
  };

  private renderCapacity = (disk: Disk) => {
    return sizeStringToGi(disk.capacity) + " Gi";
  };

  private getKRTableColumns() {
    const { canEditCluster } = this.props;

    const columns = [
      { Header: "Volume Name", accessor: "name" },
      { Header: "Mounted", accessor: "isInUse" },
      { Header: "App", accessor: "componentNamespace" },
      { Header: "Component", accessor: "componentName" },
      { Header: "Size", accessor: "capacity" },
    ];

    if (canEditCluster()) {
      columns.push({
        Header: "Actions",
        accessor: "actions",
      });
    }

    return columns;
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
        image={<KalmVolumeIcon style={{ height: 120, width: 120, color: blue[200] }} />}
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

          {persistentVolumes.length > 0 ? this.renderKRTable() : this.renderEmpty()}
        </Box>
        {/* <Box p={2}>{this.renderInfoBox()}</Box> */}
      </BasePage>
    );
  }
}

export const DiskListPage = withUserAuth(connect(mapStateToProps)(withStyles(styles)(VolumesRaw)));
