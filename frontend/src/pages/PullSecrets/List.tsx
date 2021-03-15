import { Box, createStyles, Theme, Tooltip, Typography, withStyles, WithStyles } from "@material-ui/core";
import { grey } from "@material-ui/core/colors";
import { setErrorNotificationAction } from "actions/notification";
import { deleteRegistryAction } from "actions/registries";
import { withUserAuth, WithUserAuthProps } from "hoc/withUserAuth";
import React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { RootState } from "reducers";
import CustomButton from "theme/Button";
import { TDispatchProp } from "types";
import { Registry } from "types/registry";
import sc from "utils/stringConstants";
import { SuccessBadge } from "widgets/Badge";
import { EmptyInfoBox } from "widgets/EmptyInfoBox";
import { EditIcon, ErrorIcon, KalmRegistryIcon } from "widgets/Icon";
import { IconLinkWithToolTip } from "widgets/IconButtonWithTooltip";
import { DeleteButtonWithConfirmPopover } from "widgets/IconWithPopover";
import { InfoBox } from "widgets/InfoBox";
import { KRTable } from "widgets/KRTable";
import { Loading } from "widgets/Loading";
import { BasePage } from "../BasePage";

const styles = (theme: Theme) =>
  createStyles({
    root: {},
  });

const mapStateToProps = (state: RootState) => {
  const registriesState = state.registries;
  return {
    isFirstLoaded: registriesState.isFirstLoaded,
    isLoading: registriesState.isLoading,
    registries: registriesState.registries,
  };
};

const pageObjectName: string = "Private Registry";

interface Props
  extends WithStyles<typeof styles>,
    ReturnType<typeof mapStateToProps>,
    TDispatchProp,
    WithUserAuthProps {}

interface State {
  isDeleteConfirmDialogOpen: boolean;
  deletingItemName?: string;
}

class PullSecretsListPageRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      isDeleteConfirmDialogOpen: false,
      deletingItemName: undefined,
    };
  }

  private showDeleteConfirmDialog = (deletingItemName: string) => {
    this.setState({
      isDeleteConfirmDialogOpen: true,
      deletingItemName,
    });
  };

  private closeDeleteConfirmDialog = () => {
    this.setState({
      isDeleteConfirmDialogOpen: false,
    });
  };

  // private renderDeleteConfirmDialog = () => {
  //   const { isDeleteConfirmDialogOpen, deletingItemName } = this.state;

  //   return (
  //     <ConfirmDialog
  //       open={isDeleteConfirmDialogOpen}
  //       onClose={this.closeDeleteConfirmDialog}
  //       title={`${sc.ARE_YOU_SURE_PREFIX} this registry(${deletingItemName})?`}
  //       content="You will lost this registry, and this action is irrevocable."
  //       onAgree={this.confirmDelete}
  //     />
  //   );
  // };

  private confirmDelete = async (registry: Registry) => {
    const { dispatch } = this.props;
    try {
      await dispatch(deleteRegistryAction(registry.name));
    } catch {
      dispatch(setErrorNotificationAction());
    }
  };

  private renderName(row: Registry) {
    return <Typography variant="subtitle2">{row.name}</Typography>;
  }

  private renderHost(row: Registry) {
    return row.host || "DockerHub";
  }

  private renderUsername(row: Registry) {
    return row.username;
  }

  private renderPassword(row: Registry) {
    return "******";
  }

  private renderVerified(row: Registry) {
    if (row.authenticationVerified) {
      return <SuccessBadge />;
    } else {
      return (
        <Tooltip title={sc.REGISTRY_VERIFIED_ERROR} placement="left" arrow>
          <div>
            <ErrorIcon />
          </div>
        </Tooltip>
      );
    }
  }

  private renderActions(row: Registry) {
    const { canEditCluster } = this.props;
    return canEditCluster() ? (
      <>
        <IconLinkWithToolTip tooltipTitle={"Edit"} to={`/cluster/pull-secrets/${row.name}/edit`}>
          <EditIcon />
        </IconLinkWithToolTip>
        <DeleteButtonWithConfirmPopover
          popupId="delete-registry-popup"
          popupTitle="DELETE REGISTRY?"
          targetText={row.name}
          confirmedAction={() => this.confirmDelete(row)}
        />
      </>
    ) : null;
  }

  private getKRTableColumns() {
    const { canEditCluster } = this.props;

    const columns = [
      {
        Header: "Name",
        accessor: "name",
      },
      {
        Header: "Host",
        accessor: "host",
      },
      {
        Header: "Username",
        accessor: "username",
      },
      {
        Header: "Password",
        accessor: "password",
      },
      {
        Header: "Verified",
        accessor: "verified",
      },
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
    const { registries } = this.props;
    const data: any[] = [];

    registries &&
      registries.forEach((registry, index) => {
        data.push({
          name: this.renderName(registry),
          host: this.renderHost(registry),
          username: this.renderUsername(registry),
          password: this.renderPassword(registry),
          verified: this.renderVerified(registry),
          actions: this.renderActions(registry),
        });
      });

    return data;
  }

  private renderKRTable() {
    return (
      <KRTable showTitle={true} title="Registries" columns={this.getKRTableColumns()} data={this.getKRTableData()} />
    );
  }

  private renderSecondHeaderRight() {
    return (
      <>
        {/* <H6>Private Docker Registries</H6> */}
        <CustomButton
          color="primary"
          variant="contained"
          size="small"
          component={Link}
          tutorial-anchor-id="add-certificate"
          to="/cluster/pull-secrets/new"
        >
          New {pageObjectName}
        </CustomButton>
      </>
    );
  }

  private renderEmpty() {
    const { canEditCluster } = this.props;
    return canEditCluster() ? (
      <EmptyInfoBox
        image={<KalmRegistryIcon style={{ height: 120, width: 120, color: grey[300] }} />}
        title={sc.EMPTY_REGISTRY_TITLE}
        content={sc.EMPTY_REGISTRY_SUBTITLE}
        button={
          <CustomButton
            color="primary"
            variant="contained"
            size="small"
            component={Link}
            tutorial-anchor-id="add-certificate"
            to="/cluster/pull-secrets/new"
          >
            Add {pageObjectName}
          </CustomButton>
        }
      />
    ) : null;
  }

  private renderInfoBox() {
    return <InfoBox title={pageObjectName} options={[]} guideLink={"https://docs.kalm.dev/registry"} />;
  }

  public render() {
    const { isLoading, isFirstLoaded, registries, canEditCluster } = this.props;
    return (
      <BasePage secondHeaderRight={canEditCluster() ? this.renderSecondHeaderRight() : null}>
        <Box p={2}>
          {isLoading && !isFirstLoaded ? (
            <Loading />
          ) : registries.length > 0 ? (
            this.renderKRTable()
          ) : (
            this.renderEmpty()
          )}
        </Box>
        <Box p={2}>{this.renderInfoBox()}</Box>
      </BasePage>
    );
  }
}

export const PullSecretsListPage = withUserAuth(withStyles(styles)(connect(mapStateToProps)(PullSecretsListPageRaw)));
