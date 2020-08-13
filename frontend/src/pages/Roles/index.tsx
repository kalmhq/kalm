import { Box, Chip, createStyles, IconButton, Theme, withStyles, WithStyles } from "@material-ui/core";
import VisibilityOffIcon from "@material-ui/icons/VisibilityOff";
import { closeDialogAction, openDialogAction } from "actions/dialog";
import { blinkTopProgressAction } from "actions/settings";
import { createRoleBindingsAction, deleteRoleBindingsAction } from "actions/user";
import { RoleBindingForm } from "forms/RoleBinding";
import Immutable from "immutable";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { submit } from "redux-form";
import { TDispatchProp } from "types";
import { RoleBindingsRequestBody } from "types/user";
import { FlexRowItemCenterBox } from "widgets/Box";
import { CustomizedButton } from "widgets/Button";
import { ControlledDialog } from "widgets/ControlledDialog";
import { KRTable } from "widgets/KRTable";
import { H6 } from "widgets/Label";
import { ServiceAccountSecret } from "widgets/ServiceAccountSecret";
import { AdminDrawer } from "../../layout/AdminDrawer";
import { BasePage } from "../BasePage";

const dialogID = "rolebinding/add";
const serviceAccountSecretDialogID = "serviceAccountSecretDialogID";

const styles = (theme: Theme) =>
  createStyles({
    root: {},
    roleChell: {
      "& .add-button": {
        display: "none",
      },
      "&:hover .add-button": {
        display: "inline-block",
      },
    },
  });

const mapStateToProps = (state: RootState) => {
  return {
    namespaces: state
      .get("applications")
      .get("applications")
      .map((application) => application.get("name")),
    roleBindings: state.get("roles").get("roleBindings"),
    isFirstLoaded: state.get("roles").get("roleBindingsFirstLoaded"),
    isLoading: state.get("roles").get("roleBindingsLoading"),
    isCreating: state.get("roles").get("isRoleBindingCreating"),
    serviceAccountDialogData: state.get("dialogs").get(serviceAccountSecretDialogID)?.get("data"),
    dialogData: state.get("dialogs").get(dialogID)?.get("data"),
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
  constructor(props: Props) {
    super(props);
    this.state = {};
  }

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
            }
          >
            <VisibilityOffIcon />
          </IconButton>
        ) : null}
      </FlexRowItemCenterBox>
    );
  };

  private handleDelete = async (rowData: RowData) => {
    await Promise.all(
      rowData.bindings.map((binding) => {
        return this.props.dispatch(deleteRoleBindingsAction(binding.namespace, binding.name));
      }),
    );
  };

  private renderAddForm() {
    const formID = "rolebinding";
    const { isCreating, dialogData } = this.props;
    const initialValues = Immutable.Map({
      kind: dialogData ? dialogData.kind : "User",
      name: dialogData ? dialogData.name : "",
      namespace: dialogData ? dialogData.namespace : "",
      roles: [],
    });

    return (
      <ControlledDialog
        dialogID={dialogID}
        title="Create Role Binding"
        dialogProps={{
          fullWidth: true,
          maxWidth: "sm",
        }}
        actions={
          <>
            <CustomizedButton onClick={() => this.props.dispatch(closeDialogAction(dialogID))} color="primary">
              Cancel
            </CustomizedButton>
            <CustomizedButton
              onClick={() => this.props.dispatch(submit(formID))}
              color="primary"
              pending={isCreating}
              disabled={isCreating}
            >
              {isCreating ? "Creating" : "Create"}
            </CustomizedButton>
          </>
        }
      >
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

  private columnRenderGeneator = (namespace: string, rowData: RowData) => {
    const bindings = rowData.bindings.filter((binding) => binding.namespace === namespace);
    return (
      <div className={this.props.classes.roleChell}>
        {bindings.map((binding) => {
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
                namespace: namespace,
              });
            }}
          />
        ) : null}
      </div>
    );
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
          maxWidth: "sm",
        }}
        actions={
          <>
            <CustomizedButton
              onClick={() => this.props.dispatch(closeDialogAction(serviceAccountSecretDialogID))}
              color="default"
              variant="contained"
            >
              Cancel
            </CustomizedButton>
          </>
        }
      >
        <ServiceAccountSecret serviceAccountName={serviceAccountName} />
      </ControlledDialog>
    );
  }

  private renderSecondHeaderRight() {
    return (
      <>
        <H6>Roles & Permissions</H6>
        <CustomizedButton
          color="primary"
          variant="outlined"
          size="small"
          onClick={() => {
            blinkTopProgressAction();
            this.openAddModal();
          }}
        >
          Add
        </CustomizedButton>
      </>
    );
  }

  private getKRTableColumns() {
    const { namespaces } = this.props;

    return ([
      {
        Header: "Entity",
        accessor: "entity",
      },
    ] as any).concat(
      namespaces
        .map((namespace) => ({
          Header: namespace,
          accessor: namespace,
        }))
        .toArray(),
    );
  }

  private getKRTableData() {
    const { namespaces } = this.props;

    const rowDatas = (this.props.roleBindings.map((x) => x.toJS()).toArray() as RowData[]).sort((a, b) =>
      a.kind > b.kind ? 1 : a.kind === b.kind ? (a.name > b.name ? 1 : -1) : -1,
    );
    const data: any[] = [];

    rowDatas.forEach((rowData, index) => {
      const item: any = {
        entity: this.renderEntity(rowData),
      };
      namespaces.forEach((namespace) => {
        item[namespace] = this.columnRenderGeneator(namespace, rowData);
      });
      data.push();
    });

    return data;
  }

  private renderKRTable() {
    return <KRTable columns={this.getKRTableColumns()} data={this.getKRTableData()} />;
  }

  private getData = (): RowData[] => {
    return (this.props.roleBindings.map((x) => x.toJS()).toArray() as RowData[]).sort((a, b) =>
      a.kind > b.kind ? 1 : a.kind === b.kind ? (a.name > b.name ? 1 : -1) : -1,
    );
  };

  public render() {
    return (
      <BasePage
        leftDrawer={<AdminDrawer />}
        secondHeaderLeft={"Admin"}
        secondHeaderRight={this.renderSecondHeaderRight()}
      >
        <Box p={2}>
          {this.renderAddForm()}
          {this.renderShowServiceAccountSecretDialog()}
          {this.renderKRTable()}
        </Box>
      </BasePage>
    );
  }
}

export const RoleListPage = withStyles(styles)(connect(mapStateToProps)(RolesPageRaw));
