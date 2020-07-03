import { Box, createStyles, Theme, WithStyles, withStyles } from "@material-ui/core";
import { deleteRegistryAction } from "actions/registries";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { TDispatchProp } from "types";
import { RegistryType } from "types/registry";
import { ErrorBadge, SuccessBadge } from "widgets/Badge";
import { IconButtonWithTooltip } from "widgets/IconButtonWithTooltip";
import { KTable } from "widgets/Table";
import { openDialogAction } from "../../actions/dialog";
import { setErrorNotificationAction } from "../../actions/notification";
import { blinkTopProgressAction } from "../../actions/settings";
import { primaryColor } from "../../theme";
import { CustomizedButton } from "../../widgets/Button";
import { ConfirmDialog } from "../../widgets/ConfirmDialog";
import { DeleteIcon, EditIcon } from "../../widgets/Icon";
import { H4 } from "../../widgets/Label";
import { Loading } from "../../widgets/Loading";
import { BasePage } from "../BasePage";
import { RegistryNewModal, RegistryNewModalID } from "./New";

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

interface Props extends WithStyles<typeof styles>, ReturnType<typeof mapStateToProps>, TDispatchProp {}

interface State {
  isDeleteConfirmDialogOpen: boolean;
  deletingItemName?: string;
  editingRegistry?: RegistryType;
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
      editingRegistry: undefined,
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
      deletingItemName: undefined,
    });
  };

  private renderDeleteConfirmDialog = () => {
    const { isDeleteConfirmDialogOpen, deletingItemName } = this.state;

    return (
      <ConfirmDialog
        open={isDeleteConfirmDialogOpen}
        onClose={this.closeDeleteConfirmDialog}
        title={`Are you sure to delete this registry(${deletingItemName})?`}
        content="You will lost this registry, and this action is irrevocable."
        onAgree={this.confirmDelete}
      />
    );
  };

  private confirmDelete = async () => {
    const { dispatch } = this.props;
    try {
      const { deletingItemName } = this.state;
      if (deletingItemName) {
        await dispatch(deleteRegistryAction(deletingItemName));
      }
    } catch {
      dispatch(setErrorNotificationAction());
    }
  };

  private renderName(row: RowData) {
    return row.get("name");
  }

  private renderHost(row: RowData) {
    return row.get("host");
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
      return <ErrorBadge />;
    }
  }

  private renderRepositories(row: RowData) {
    return row
      .get("repositories")
      ?.map((x) => x.get("name"))
      .join(",");
  }

  private renderActions(row: RowData) {
    const { registries, dispatch } = this.props;
    return (
      <>
        <IconButtonWithTooltip
          tooltipTitle={"Edit"}
          size="small"
          style={{ color: primaryColor }}
          onClick={() => {
            const registry = registries.find((r) => r.get("name") === row.get("name"));
            this.setState({
              editingRegistry: registry,
            });
            dispatch(openDialogAction(RegistryNewModalID));
          }}
        >
          <EditIcon />
        </IconButtonWithTooltip>
        <IconButtonWithTooltip
          size="small"
          tooltipTitle={"Delete"}
          style={{ color: primaryColor }}
          onClick={() => {
            this.showDeleteConfirmDialog(row.get("name"));
          }}
        >
          <DeleteIcon />
        </IconButtonWithTooltip>
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
    const { dispatch } = this.props;
    return (
      <>
        <H4>Private Docker Registries</H4>
        <CustomizedButton
          color="primary"
          variant="outlined"
          size="small"
          onClick={() => {
            this.setState({
              editingRegistry: undefined,
            });
            blinkTopProgressAction();
            dispatch(openDialogAction(RegistryNewModalID));
          }}
        >
          Add
        </CustomizedButton>
      </>
    );
  }

  public render() {
    const { isLoading, isFirstLoaded } = this.props;
    const { editingRegistry } = this.state;
    const tableData = this.getData();

    return (
      <BasePage secondHeaderRight={this.renderSecondHeaderRight()}>
        {this.renderDeleteConfirmDialog()}
        <RegistryNewModal isEdit={!!editingRegistry} registry={editingRegistry} />
        <Box p={2}>
          {isLoading && !isFirstLoaded ? (
            <Loading />
          ) : (
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
                // {
                //   title: "Repositories",
                //   field: "repositories",
                //   sorting: false,
                //   render: this.renderRepositories
                // },
                {
                  title: "Actions",
                  field: "action",
                  sorting: false,
                  searchable: false,
                  render: (row) => this.renderActions(row),
                },
              ]}
              // detailPanel={this.renderDetails}
              // onRowClick={(_event, _rowData, togglePanel) => {
              //   togglePanel!();
              //   console.log(_event);
              // }}
              data={tableData}
              title=""
            />
          )}
        </Box>
      </BasePage>
    );
  }
}

export const RegistryListPage = withStyles(styles)(connect(mapStateToProps)(RegistryListPageRaw));
