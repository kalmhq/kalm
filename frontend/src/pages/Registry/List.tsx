import { Box, Button, createStyles, Theme, Tooltip, Typography, withStyles, WithStyles } from "@material-ui/core";
import { indigo } from "@material-ui/core/colors";
import { setErrorNotificationAction } from "actions/notification";
import { deleteRegistryAction } from "actions/registries";
import React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { RootState } from "reducers";
import { TDispatchProp } from "types";
import { RegistryType } from "types/registry";
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
  const registriesState = state.get("registries");
  return {
    isFirstLoaded: registriesState.get("isFirstLoaded"),
    isLoading: registriesState.get("isLoading"),
    registries: registriesState.get("registries"),
  };
};

const pageObjectName: string = "Private Registry";

interface Props extends WithStyles<typeof styles>, ReturnType<typeof mapStateToProps>, TDispatchProp {}

interface State {
  isDeleteConfirmDialogOpen: boolean;
  deletingItemName?: string;
}

interface RowData extends RegistryType {
  index: number;
}

class RegistryListPageRaw extends React.PureComponent<Props, State> {
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

  private confirmDelete = async (rowData: RowData) => {
    const { dispatch } = this.props;
    try {
      await dispatch(deleteRegistryAction(rowData.get("name")));
    } catch {
      dispatch(setErrorNotificationAction());
    }
  };

  private renderName(row: RowData) {
    return <Typography variant="subtitle2">{row.get("name")}</Typography>;
  }

  private renderHost(row: RowData) {
    return row.get("host") || "DockerHub";
  }

  private renderUsername(row: RowData) {
    return row.get("username");
  }

  private renderPassword(row: RowData) {
    return "******";
  }

  private renderVerified(row: RowData) {
    if (row.get("authenticationVerified")) {
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

  private renderRepositories(row: RowData) {
    return row
      .get("repositories")
      ?.map((x) => x.get("name"))
      .join(",");
  }

  private renderActions(row: RowData) {
    return (
      <>
        <IconLinkWithToolTip tooltipTitle={"Edit"} to={`/cluster/registries/${row.get("name")}/edit`}>
          <EditIcon />
        </IconLinkWithToolTip>
        <DeleteButtonWithConfirmPopover
          popupId="delete-registry-popup"
          popupTitle="DELETE REGISTRY?"
          confirmedAction={() => this.confirmDelete(row)}
        />
        {/* <IconButtonWithTooltip
          tooltipTitle={"Delete"}
          onClick={() => {
            this.showDeleteConfirmDialog(row.get("name"));
          }}
        >
          <DeleteIcon />
        </IconButtonWithTooltip> */}
      </>
    );
  }

  private getKRTableColumns() {
    return [
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

      {
        Header: "Actions",
        accessor: "actions",
      },
    ];
  }

  private getKRTableData() {
    const { registries } = this.props;
    const data: any[] = [];

    registries &&
      registries.forEach((registry, index) => {
        const rowData = registry as RowData;
        data.push({
          name: this.renderName(rowData),
          host: this.renderHost(rowData),
          username: this.renderUsername(rowData),
          password: this.renderPassword(rowData),
          verified: this.renderVerified(rowData),
          actions: this.renderActions(rowData),
        });
      });

    return data;
  }

  private renderKRTable() {
    return <KRTable columns={this.getKRTableColumns()} data={this.getKRTableData()} />;
  }

  private renderSecondHeaderRight() {
    return (
      <>
        {/* <H6>Private Docker Registries</H6> */}
        <Button
          color="primary"
          variant="outlined"
          size="small"
          component={Link}
          tutorial-anchor-id="add-certificate"
          to="/cluster/registries/new"
        >
          New {pageObjectName}
        </Button>
      </>
    );
  }

  private renderEmpty() {
    return (
      <EmptyInfoBox
        image={<KalmRegistryIcon style={{ height: 120, width: 120, color: indigo[200] }} />}
        title={sc.EMPTY_REGISTRY_TITLE}
        content={sc.EMPTY_REGISTRY_SUBTITLE}
        button={
          <Button
            color="primary"
            variant="contained"
            size="small"
            component={Link}
            tutorial-anchor-id="add-certificate"
            to="/cluster/registries/new"
          >
            New {pageObjectName}
          </Button>
        }
      />
    );
  }

  private renderInfoBox() {
    return <InfoBox title={pageObjectName} options={[]} guideLink={"https://kalm.dev/docs/registry"}></InfoBox>;
  }

  public render() {
    const { isLoading, isFirstLoaded, registries } = this.props;

    return (
      <BasePage secondHeaderRight={this.renderSecondHeaderRight()}>
        <Box p={2}>
          {isLoading && !isFirstLoaded ? <Loading /> : registries.size > 0 ? this.renderKRTable() : this.renderEmpty()}
        </Box>
        <Box p={2}>{this.renderInfoBox()}</Box>
      </BasePage>
    );
  }
}

export const RegistryListPage = withStyles(styles)(connect(mapStateToProps)(RegistryListPageRaw));
