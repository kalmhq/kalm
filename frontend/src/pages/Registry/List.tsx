import { Box, createStyles, Theme, WithStyles, withStyles, Link } from "@material-ui/core";
import { deleteRegistryAction } from "actions/registries";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { TDispatchProp } from "types";
import { RegistryType } from "types/registry";
import { ErrorBadge, SuccessBadge } from "widgets/Badge";
import { IconButtonWithTooltip } from "widgets/IconButtonWithTooltip";
import { KTable } from "widgets/Table";
import { openDialogAction } from "actions/dialog";
import { setErrorNotificationAction } from "actions/notification";
import { blinkTopProgressAction } from "actions/settings";
import { CustomizedButton } from "widgets/Button";
import { ConfirmDialog } from "widgets/ConfirmDialog";
import { DeleteIcon, EditIcon, KalmRegistryIcon } from "widgets/Icon";
import { Loading } from "widgets/Loading";
import { BasePage } from "../BasePage";
import { RegistryNewModal, RegistryNewModalID } from "./New";
import { EmptyList } from "widgets/EmptyList";
import { indigo } from "@material-ui/core/colors";
import { InfoBox } from "widgets/InfoBox";

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
        {/* <H4>Private Docker Registries</H4> */}
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
          Add Private Docker Registrie
        </CustomizedButton>
      </>
    );
  }

  private renderEmpty() {
    const { dispatch } = this.props;

    return (
      <EmptyList
        image={<KalmRegistryIcon style={{ height: 120, width: 120, color: indigo[200] }} />}
        title={"You don’t have any Private Image Registries."}
        content="To pull images from Private registries such as gcr or aws, you must setup the corresponding permissions here. Public registries such as dockerhub can be used without any additional setup."
        button={
          <CustomizedButton
            variant="contained"
            color="primary"
            onClick={() => {
              this.setState({
                editingRegistry: undefined,
              });
              blinkTopProgressAction();
              dispatch(openDialogAction(RegistryNewModalID));
            }}
          >
            Add Registry
          </CustomizedButton>
        }
      />
    );
  }

  private renderInfoBox() {
    const title = "Load Balancer References";

    const options = [
      {
        title: (
          <Link href="#" target="_blank">
            Link to docks
          </Link>
        ),
        content: "",
      },
      {
        title: (
          <Link href="#" target="_blank">
            Link to tutorial
          </Link>
        ),
        content: "",
      },
    ];

    return <InfoBox title={title} options={options}></InfoBox>;
  }

  public render() {
    const { isLoading, isFirstLoaded, registries } = this.props;
    const { editingRegistry } = this.state;
    const tableData = this.getData();

    return (
      <BasePage secondHeaderRight={this.renderSecondHeaderRight()}>
        {this.renderDeleteConfirmDialog()}
        <RegistryNewModal isEdit={!!editingRegistry} registry={editingRegistry} />
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
