import { Button } from "@material-ui/core";
import MaterialTable from "material-table";
import React from "react";
import { connect, DispatchProp } from "react-redux";
import { change, submit, WrappedFieldArrayProps } from "redux-form";
import { FieldArray } from "redux-form/immutable";
import { newEmptyPlugin, Plugin, portTypeTCP } from "../../actions";
import { closeDialogAction, openDialogAction } from "../../actions/dialog";
import { RootState } from "../../reducers";
import { ControlledDialog } from "../../widgets/ControlledDialog";
import { PluginForm } from "../Plugin";
import SyntaxHighlighter from "react-syntax-highlighter/dist/cjs/default-highlight";
import { monokai } from "react-syntax-highlighter/dist/esm/styles/hljs";

interface FieldArrayComponentHackType {
  name: any;
  component: any;
}

interface FieldArrayProps extends DispatchProp, ReturnType<typeof mapStateToProps> {}

interface Props extends WrappedFieldArrayProps<Plugin>, FieldArrayComponentHackType, FieldArrayProps {}

interface RowData {
  name: string;
  config: {};
  index: number;
}

const dialogID = "plugin";

const mapStateToProps = (state: RootState) => {
  const dialog = state.get("dialogs").get(dialogID);

  return {
    dialogData: dialog ? dialog.get("data") : {}
  };
};

class RenderPlugins extends React.PureComponent<Props> {
  private tableRef: React.RefObject<MaterialTable<RowData>>;

  constructor(props: Props) {
    super(props);
    this.tableRef = React.createRef();
  }

  private getTableData() {
    const { fields } = this.props;
    const data: RowData[] = [];

    fields.forEach((_, index) => {
      const plugin = fields.get(index);
      data.push({
        name: plugin.get("name"),
        config: plugin.toJS(),
        index
      });
    });
    return data;
  }

  private renderNameColumn = (rowData: RowData) => rowData.name;
  private renderConfigColumn = (rowData: RowData) => {
    switch (rowData.name) {
      case "ingress": {
        return (
          <SyntaxHighlighter language="json" style={monokai} showLineNumbers>
            {JSON.stringify(rowData.config, undefined, 2)}
          </SyntaxHighlighter>
        );
      }
      default: {
        return null;
      }
    }
  };

  private handleDelete = async (rowData: RowData) => {
    this.props.fields.remove(rowData.index);
  };

  private addPlugins = (values: Plugin) => {
    const { fields, dispatch, dialogData, meta } = this.props;
    if (dialogData.isAdding) {
      fields.push(values);
    } else {
      const index = dialogData.index;
      this.props.dispatch(change(meta.form, `${fields.name}[${index}]`, values));
    }

    dispatch(closeDialogAction(dialogID));
  };

  private renderAddPluginControlledDialog() {
    const { dialogData, fields } = this.props;
    let initialValues: Plugin;

    if (dialogData.isEditing) {
      initialValues = fields.get(dialogData.index);
    } else {
      initialValues = newEmptyPlugin();
    }

    return (
      <ControlledDialog
        dialogID={dialogID}
        title={dialogData.isAdding ? "Add plugin" : "Edit plugin"}
        dialogProps={{
          fullWidth: true,
          maxWidth: "sm"
        }}
        actions={
          <>
            <Button
              onClick={() => this.props.dispatch(closeDialogAction(dialogID))}
              color="default"
              variant="contained">
              Cancel
            </Button>
            <Button onClick={() => this.props.dispatch(submit("plugin"))} color="primary" variant="contained">
              {dialogData.isAdding ? "Add" : "Update"}
            </Button>
          </>
        }>
        <PluginForm form="plugin" initialValues={initialValues} onSubmit={this.addPlugins} />
      </ControlledDialog>
    );
  }

  public render() {
    return (
      <div>
        {this.renderAddPluginControlledDialog()}
        <MaterialTable
          tableRef={this.tableRef}
          options={{
            padding: "dense",
            search: false,
            paging: false,
            //   toolbar: false
            actionsColumnIndex: -1,
            addRowPosition: "first",
            draggable: false
          }}
          actions={[
            {
              icon: "edit",
              onClick: (_event: any, rowData: RowData | RowData[]) => {
                this.props.dispatch(
                  openDialogAction(dialogID, {
                    isEditing: true,
                    index: (rowData as RowData).index
                  })
                );
              }
            },
            {
              icon: "add_circle",
              iconProps: {
                color: "primary"
              },
              onClick: (...args) => {
                this.props.dispatch(
                  openDialogAction(dialogID, {
                    isAdding: true
                  })
                );
              },
              isFreeAction: true
            }
          ]}
          components={{ Container: props => props.children }}
          columns={[
            {
              title: "Name",
              field: "name",
              sorting: false,
              render: this.renderNameColumn
            },
            {
              title: "Config",
              field: "config",
              initialEditValue: portTypeTCP,
              sorting: false,
              render: this.renderConfigColumn
            }
          ]}
          editable={{
            onRowDelete: this.handleDelete
          }}
          data={this.getTableData()}
          title=""
        />
      </div>
    );
  }
}

export const Plugins = connect(mapStateToProps)((props: FieldArrayProps) => {
  return <FieldArray name="plugins" component={RenderPlugins} {...props} />;
});
