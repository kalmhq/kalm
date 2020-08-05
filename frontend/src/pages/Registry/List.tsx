import { Box, createStyles, Theme, withStyles, WithStyles, Typography, Button, Tooltip } from "@material-ui/core";
import { deleteRegistryAction } from "actions/registries";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { TDispatchProp } from "types";
import { RegistryType } from "types/registry";
import { SuccessBadge } from "widgets/Badge";
import { IconLinkWithToolTip } from "widgets/IconButtonWithTooltip";
import { KTable } from "widgets/Table";
import { setErrorNotificationAction } from "actions/notification";
import { EditIcon, KalmRegistryIcon, ErrorIcon } from "widgets/Icon";
import { Loading } from "widgets/Loading";
import { BasePage } from "../BasePage";
import { EmptyInfoBox } from "widgets/EmptyInfoBox";
import { indigo } from "@material-ui/core/colors";
import { InfoBox } from "widgets/InfoBox";
import sc from "utils/stringConstants";
import { Link } from "react-router-dom";
import { DeleteButtonWithConfirmPopover } from "widgets/IconWithPopover";

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

  private getData = () => {
    const { registries } = this.props;
    const data: RowData[] = [];

    registries.forEach((registry, index) => {
      const rowData = registry as RowData;
      rowData.index = index;
      data.push(rowData);
    });

    return data;
  };

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
    const tableData = this.getData();

    return (
      <BasePage secondHeaderRight={this.renderSecondHeaderRight()}>
        {/* {this.renderDeleteConfirmDialog()} */}
        <Box p={2}>
          {isLoading && !isFirstLoaded ? (
            <Loading />
          ) : registries.size > 0 ? (
            <KTable
              options={{
                paging: tableData.length > 20,
              }}
              columns={[
                {
                  title: "Name",
                  field: "name",
                  sorting: false,
                  render: this.renderName,
                },
                {
                  title: "Host",
                  field: "host",
                  sorting: false,
                  render: this.renderHost,
                },
                {
                  title: "Username",
                  field: "username",
                  sorting: false,
                  render: this.renderUsername,
                },
                {
                  title: "Password",
                  field: "password",
                  sorting: false,
                  render: this.renderPassword,
                },
                {
                  title: "Verified",
                  field: "verified",
                  sorting: false,
                  render: this.renderVerified,
                },

                {
                  title: "Actions",
                  field: "action",
                  sorting: false,
                  searchable: false,
                  render: (row) => this.renderActions(row),
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

export const RegistryListPage = withStyles(styles)(connect(mapStateToProps)(RegistryListPageRaw));
