import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import AddCircleIcon from "@material-ui/icons/AddCircle";
import DeleteIcon from "@material-ui/icons/Delete";
import { closeDialogAction, openDialogAction } from "actions/dialog";
import { NamespaceForm } from "forms/Namespace";
import MaterialTable from "material-table";
import React, { forwardRef } from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { submit } from "redux-form";
import { TDispatchProp } from "types";
import { CustomizedButton } from "widgets/Button";
import { ControlledDialog } from "widgets/ControlledDialog";
import { createNamespaceAction, deleteNamespaceAction, loadNamespacesAction } from "actions/namespaces";

const dialogID = "admin/namespace/add";

const styles = (theme: Theme) =>
  createStyles({
    root: {
      padding: theme.spacing(2)
    }
  });

const mapStateToProps = (state: RootState) => {
  return {
    namespaces: state.get("namespaces").get("namespaces"),
    isCreating: state.get("namespaces").get("isCreating")
  };
};

interface Props extends WithStyles<typeof styles>, ReturnType<typeof mapStateToProps>, TDispatchProp {}

interface State {}

interface RowData {
  name: string;
}

class AdminNamespacesRaw extends React.PureComponent<Props, State> {
  private tableRef: React.RefObject<MaterialTable<RowData>> = React.createRef();

  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    // TODO use admin api
    this.props.dispatch(loadNamespacesAction());
  }

  private getData = (): RowData[] => {
    return this.props.namespaces
      .map(x => {
        return {
          name: x.get("name")
        };
      })
      .toArray();
  };

  private renderName(rowData: RowData) {
    return rowData.name;
  }

  private renderAppCount(rowData: RowData) {
    return "TODO";
  }

  private renderCreatedAt = (rowData: RowData) => {
    return "TODO";
  };

  private handleAdd = async (rowData: RowData) => {
    console.log("create namespace", rowData);
  };

  private handleDelete = async (rowData: RowData) => {
    this.props.dispatch(deleteNamespaceAction(rowData.name));
  };

  private renderAddForm() {
    const formID = "namespace";
    const { isCreating } = this.props;
    return (
      <ControlledDialog
        dialogID={dialogID}
        title="Create Namespace"
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
        <NamespaceForm
          form={formID}
          onSubmit={async namespace => {
            const success = await this.props.dispatch(createNamespaceAction(namespace.get("name")));
            if (success) {
              this.props.dispatch(closeDialogAction(dialogID));
            }
          }}
        />
      </ControlledDialog>
    );
  }

  private openAddModal = () => {
    this.props.dispatch(openDialogAction(dialogID));
  };

  public render() {
    const { classes } = this.props;
    return (
      <div className={classes.root}>
        {this.renderAddForm()}
        <MaterialTable
          tableRef={this.tableRef}
          icons={{
            Delete: forwardRef((props, ref) => <DeleteIcon ref={ref} {...props} color="secondary" />)
          }}
          actions={[
            {
              isFreeAction: true,
              icon: () => <AddCircleIcon color="primary" />,
              onClick: this.openAddModal
            }
          ]}
          localization={{
            body: {
              editRow: {
                saveTooltip: "Save",
                cancelTooltip: "Cancel",
                deleteText: "Are you sure you want to delete this namespace?"
              }
            }
          }}
          options={{
            draggable: false,
            search: false,
            // padding: "dense",
            paging: false,
            //   toolbar: false
            actionsColumnIndex: -1,
            addRowPosition: "first"
          }}
          columns={[
            {
              title: "Name",
              field: "name",
              sorting: false,
              render: this.renderName
            },
            { title: "App Count", field: "components", sorting: false, render: this.renderAppCount, editable: "never" },
            { title: "Created At", field: "createdAt", sorting: false, render: this.renderCreatedAt, editable: "never" }
          ]}
          data={this.getData()}
          title="Namespaces"
          editable={{
            onRowDelete: this.handleDelete
          }}
        />
      </div>
    );
  }
}

export const AdminNamespaces = withStyles(styles)(connect(mapStateToProps)(AdminNamespacesRaw));
