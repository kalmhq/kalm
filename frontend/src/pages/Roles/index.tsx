import { Box, Chip, createStyles, IconButton, Theme, withStyles, WithStyles } from "@material-ui/core";
import DeleteIcon from "@material-ui/icons/Delete";
import VisibilityOffIcon from "@material-ui/icons/VisibilityOff";
import { closeDialogAction, openDialogAction } from "actions/dialog";
import { createRoleBindingsAction, deleteRoleBindingsAction, loadRoleBindingsAction } from "actions/user";
import { RoleBindingForm } from "forms/RoleBinding";
import Immutable from "immutable";
import MaterialTable from "material-table";
import React, { forwardRef } from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { submit } from "redux-form";
import { TDispatchProp } from "types";
import { RoleBindingsRequestBody } from "types/user";
import { FlexRowItemCenterBox } from "widgets/Box";
import { CustomizedButton } from "widgets/Button";
import { ControlledDialog } from "widgets/ControlledDialog";
import { ServiceAccountSecret } from "widgets/ServiceAccountSecret";
import { AdminDrawer } from "../../layout/AdminDrawer";
import { H4 } from "../../widgets/Label";
import { BasePage } from "../BasePage";

const dialogID = "rolebinding/add";
const serviceAccountSecretDialogID = "serviceAccountSecretDialogID";

const styles = (theme: Theme) =>
  createStyles({
    root: {
      // padding: theme.spacing(2)
    },
    roleChell: {
      "& .add-button": {
        display: "none"
      },
      "&:hover .add-button": {
        display: "inline-block"
      }
    },
    sencondHeaderRight: {
      height: "100%",
      width: "100%",
      display: "flex",
      alignItems: "center"
    },
    sencondHeaderRightItem: {
      marginLeft: 20
    }
  });

const mapStateToProps = (state: RootState) => {
  return {
    namespaces: state
      .get("applications")
      .get("applications")
      .map(application => application.get("name")),
    roleBindings: state.get("roles").get("roleBindings"),
    isFirstLoaded: state.get("roles").get("roleBindingsFirstLoaded"),
    isLoading: state.get("roles").get("roleBindingsLoading"),
    isCreating: state.get("roles").get("isRoleBindingCreating"),
    serviceAccountDialogData: state
      .get("dialogs")
      .get(serviceAccountSecretDialogID)
      ?.get("data"),
    dialogData: state
      .get("dialogs")
      .get(dialogID)
      ?.get("data")
  };
};

interface Props extends WithStyles<typeof styles>, ReturnType<typeof mapStateToProps>, TDispatchProp {}

interface State {}

interface RowData {
  name: string;
  kind: string;
  bindings: {
    roleName: string;
    namespace: string;
    name: string;
  }[];
}

class RolesPageRaw extends React.PureComponent<Props, State> {
  private tableRef: React.RefObject<MaterialTable<RowData>> = React.createRef();

  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    this.props.dispatch(loadRoleBindingsAction());
    // this.props.dispatch(loadNamespacesAction());
  }

  private getData = (): RowData[] => {
    return (this.props.roleBindings.map(x => x.toJS()).toArray() as RowData[]).sort((a, b) =>
      a.kind > b.kind ? 1 : a.kind === b.kind ? (a.name > b.name ? 1 : -1) : -1
    );
  };

  private renderEntity = (rowData: RowData): React.ReactNode => {
    return (
      <FlexRowItemCenterBox>
        <strong>{rowData.kind}</strong>
        <Box display="inline" ml={1} mr={1}>
          {rowData.name}
        </Box>
        {rowData.kind === "ServiceAccount" ? (
          <IconButton
            size="small"
            onClick={() =>
              this.props.dispatch(openDialogAction(serviceAccountSecretDialogID, { serviceAccountName: rowData.name }))
            }>
            <VisibilityOffIcon />
          </IconButton>
        ) : null}
      </FlexRowItemCenterBox>
    );
  };

  private handleDelete = async (rowData: RowData) => {
    await Promise.all(
      rowData.bindings.map(binding => {
        return this.props.dispatch(deleteRoleBindingsAction(binding.namespace, binding.name));
      })
    );
  };

  private renderAddForm() {
    const formID = "rolebinding";
    const { isCreating, dialogData } = this.props;
    const initialValues = Immutable.Map({
      kind: dialogData ? dialogData.kind : "User",
      name: dialogData ? dialogData.name : "",
      namespace: dialogData ? dialogData.namespace : "",
      roles: []
    });

    return (
      <ControlledDialog
        dialogID={dialogID}
        title="Create Role Binding"
        dialogProps={{
          fullWidth: true,
          maxWidth: "sm"
        }}
        actions={
          <>
            <CustomizedButton
              onClick={() => this.props.dispatch(closeDialogAction(dialogID))}
              color="default"
              variant="contained">
              Cancel
            </CustomizedButton>
            <CustomizedButton
              onClick={() => this.props.dispatch(submit(formID))}
              color="primary"
              variant="contained"
              pending={isCreating}
              disabled={isCreating}>
              {isCreating ? "Creating" : "Create"}
            </CustomizedButton>
          </>
        }>
        <RoleBindingForm
          form={formID}
          onSubmit={async (attributes: RoleBindingsRequestBody) => {
            await this.props.dispatch(createRoleBindingsAction(attributes));
            this.props.dispatch(closeDialogAction(dialogID));
          }}
          initialValues={initialValues}
        />
      </ControlledDialog>
    );
  }

  private openAddModal = (data?: any) => {
    if (this.props.namespaces.size === 0) {
      return;
    }
    this.props.dispatch(openDialogAction(dialogID, data));
  };

  private columnRenderGeneator = (namespace: string) => {
    return (rowData: RowData) => {
      const bindings = rowData.bindings.filter(binding => binding.namespace === namespace);
      return (
        <div className={this.props.classes.roleChell}>
          {bindings.map(binding => {
            return (
              <Box mr={1} display="inline-block" key={binding.name}>
                <Chip
                  color="primary"
                  label={binding.roleName}
                  key={binding.roleName}
                  size="small"
                  onDelete={() => {
                    this.props.dispatch(deleteRoleBindingsAction(binding.namespace, binding.name));
                  }}
                />
              </Box>
            );
          })}

          {bindings.length < 2 ? (
            <Chip
              color="primary"
              variant="outlined"
              label="Add"
              size="small"
              clickable
              onClick={() => {
                this.openAddModal({
                  kind: rowData.kind,
                  name: rowData.name,
                  namespace: namespace
                });
              }}
            />
          ) : null}
        </div>
      );
    };
  };

  private renderShowServiceAccountSecretDialog() {
    const { serviceAccountDialogData } = this.props;
    const serviceAccountName = serviceAccountDialogData ? serviceAccountDialogData.serviceAccountName : "";

    return (
      <ControlledDialog
        dialogID={serviceAccountSecretDialogID}
        title={"ServiceAccount " + serviceAccountName + " Secret"}
        dialogProps={{
          fullWidth: true,
          maxWidth: "sm"
        }}
        actions={
          <>
            <CustomizedButton
              onClick={() => this.props.dispatch(closeDialogAction(serviceAccountSecretDialogID))}
              color="default"
              variant="contained">
              Cancel
            </CustomizedButton>
          </>
        }>
        <ServiceAccountSecret serviceAccountName={serviceAccountName} />
      </ControlledDialog>
    );
  }

  private renderSecondHeaderRight() {
    const { classes } = this.props;
    return (
      <div className={classes.sencondHeaderRight}>
        <H4 className={classes.sencondHeaderRightItem}>Roles & Permissions</H4>
        <CustomizedButton
          color="primary"
          className={classes.sencondHeaderRightItem}
          onClick={() => {
            this.openAddModal();
          }}>
          Add
        </CustomizedButton>
      </div>
    );
  }

  public render() {
    const { classes, namespaces } = this.props;

    return (
      <BasePage
        leftDrawer={<AdminDrawer />}
        secondHeaderLeft={"Admin"}
        secondHeaderRight={this.renderSecondHeaderRight()}>
        <div className={classes.root}>
          {this.renderAddForm()}
          {this.renderShowServiceAccountSecretDialog()}
          <MaterialTable
            tableRef={this.tableRef}
            icons={{
              Delete: forwardRef((props, ref) => <DeleteIcon ref={ref} {...props} color="secondary" />)
            }}
            localization={{
              body: {
                editRow: {
                  saveTooltip: "Save",
                  cancelTooltip: "Cancel",
                  deleteText: "Are you sure you want to revoke all roles for this user/group/service account?"
                }
              }
            }}
            options={{
              pageSize: 20,
              draggable: false,
              search: true,
              paging: false,
              padding: "dense",
              //   toolbar: false
              actionsColumnIndex: -1,
              addRowPosition: "first",
              headerStyle: {
                // backgroundColor: "#01579b",
                // color: "#FFF"
              }
            }}
            columns={([
              {
                title: "Entity",
                field: "entity",
                render: this.renderEntity,
                cellStyle: {
                  // backgroundColor: "#039be5",
                  // color: "#FFF"
                }
              }
            ] as any).concat(
              namespaces
                .map(namespace => ({
                  title: namespace,
                  field: namespace,
                  render: this.columnRenderGeneator(namespace),
                  cellStyle: {
                    // backgroundColor: "white",
                    // color: "black"
                    border: "1px solid rgba(224, 224, 224, 1)"
                  }
                }))
                .toArray()
            )}
            data={this.getData()}
            title=""
            editable={{
              onRowDelete: this.handleDelete
            }}
          />
        </div>
      </BasePage>
    );
  }
}

export const RolesPage = withStyles(styles)(connect(mapStateToProps)(RolesPageRaw));
