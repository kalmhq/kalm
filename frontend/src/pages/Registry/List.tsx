import { createStyles, Theme, WithStyles, withStyles } from "@material-ui/core";
import { grey } from "@material-ui/core/colors";
import { deleteRegistryAction, loadRegistriesAction } from "actions/registries";
import MaterialTable from "material-table";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { TDispatchProp } from "types";
import { RegistryType } from "types/registry";
import { ErrorBadge, SuccessBadge } from "widgets/Badge";
import { IconButtonWithTooltip } from "widgets/IconButtonWithTooltip";
import { openDialogAction } from "../../actions/dialog";
import { setErrorNotificationAction } from "../../actions/notification";
import { blinkTopProgressAction } from "../../actions/settings";
import { primaryColor } from "../../theme";
import { CustomizedButton } from "../../widgets/Button";
import { ConfirmDialog } from "../../widgets/ConfirmDialog";
import { DeleteIcon, EditIcon } from "../../widgets/Icon";
import { H4 } from "../../widgets/Label";
import { BasePage } from "../BasePage";
import { RegistryNewModal, RegistryNewModalID } from "./New";
import { Loading } from "../../widgets/Loading";

const styles = (theme: Theme) =>
  createStyles({
    root: {},
    secondHeaderRight: {
      height: "100%",
      width: "100%",
      display: "flex",
      alignItems: "center",
    },
    secondHeaderRightItem: {
      marginLeft: 20,
    },
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
        title={`Are you sure to delete this Persistent Volume(${deletingItemName})?`}
        content="You will lost this Persistent Volume, and this action is irrevocable."
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

  componentDidMount() {
    this.props.dispatch(loadRegistriesAction());
  }

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
    const { classes, dispatch } = this.props;
    return (
      <div className={classes.secondHeaderRight}>
        <H4 className={classes.secondHeaderRightItem}>Registries</H4>
        <CustomizedButton
          color="primary"
          size="large"
          className={classes.secondHeaderRightItem}
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
      </div>
    );
  }

  public render() {
    const { isLoading, isFirstLoaded } = this.props;
    const { editingRegistry } = this.state;
    const tableData = this.getData();
    console.log("isEdit", !!editingRegistry);
    return (
      <BasePage secondHeaderRight={this.renderSecondHeaderRight()}>
        {this.renderDeleteConfirmDialog()}
        <RegistryNewModal isEdit={!!editingRegistry} registry={editingRegistry} />
        {isLoading && !isFirstLoaded ? (
          <Loading />
        ) : (
          <MaterialTable
            options={{
              pageSize: 20,
              paging: tableData.length > 20,
              padding: "dense",
              draggable: false,
              rowStyle: {
                verticalAlign: "baseline",
              },
              headerStyle: {
                color: "black",
                backgroundColor: grey[100],
                fontSize: 12,
                fontWeight: 400,
                height: 20,
                paddingTop: 0,
                paddingBottom: 0,
              },
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
              // {
              //   title: "Verified",
              //   field: "verified",
              //   sorting: false,
              //   render: this.renderVerified
              // },
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
      </BasePage>
    );
  }
}

export const RegistryListPage = withStyles(styles)(connect(mapStateToProps)(RegistryListPageRaw));
