import { MenuItem, Button } from "@material-ui/core";
import Immutable from "immutable";
import MaterialTable, { EditComponentProps } from "material-table";
import React from "react";
import { connect, DispatchProp } from "react-redux";
import { arrayUnshift, change, WrappedFieldArrayProps, submit } from "redux-form";
import { FieldArray } from "redux-form/immutable";
import { Plugin, portTypeTCP, portTypeUDP } from "../../actions";
import { MaterialTableEditSelectField } from "../Basic/select";
import { MaterialTableEditTextField } from "../Basic/text";
import { ControlledDialog } from "../../widgets/ControlledDialog";
import { openDialogAction, closeDialogAction } from "../../actions/dialog";
import { PluginForm } from "../Plugin";

interface FieldArrayComponentHackType {
  name: any;
  component: any;
}

interface FieldArrayProps extends DispatchProp {}

interface Props extends WrappedFieldArrayProps<Plugin>, FieldArrayComponentHackType, FieldArrayProps {}

interface RowData {
  name: string;
  config: {};
  index: number;
}

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
        config: plugin.get("config"),
        index
      });
    });
    return data;
  }

  private renderNameColumn = (rowData: RowData) => rowData.name;
  private renderConfigColumn = (rowData: RowData) => rowData.config;

  private handleDelete = async (rowData: RowData) => {
    this.props.fields.remove(rowData.index);
  };

  private handleEdit = async (newRowData: RowData, oldRowData?: RowData) => {
    const { meta } = this.props;
    const formName = meta.form;
    const baseName = `${this.props.fields.name}[${newRowData.index}]`;

    const promises = [];
    if (!oldRowData || newRowData.name !== oldRowData.name) {
      promises.push(this.props.dispatch(change(formName, `${baseName}.name`, newRowData.name)));
    }

    if (!oldRowData || newRowData.config !== oldRowData.config) {
      promises.push(this.props.dispatch(change(formName, `${baseName}.config`, newRowData.config)));
    }

    await Promise.all(promises);

    this.forceUpdate();
  };

  private handleAdd = async (newRowData: RowData) => {
    const { meta } = this.props;
    const formName = meta.form;

    const plugin: Plugin = Immutable.Map({
      name: newRowData.name,
      config: newRowData.config
    });

    return this.props.dispatch(arrayUnshift(formName, `${this.props.fields.name}`, plugin));
  };

  private editNameComponent = (props: EditComponentProps<RowData>) => {
    return <MaterialTableEditTextField textFieldProps={{ placeholder: "Name", label: "Name" }} {...props} />;
  };

  private editConfigComponent = (props: EditComponentProps<RowData>) => {
    return (
      <MaterialTableEditSelectField {...props} selectProps={{ label: "Protocol" }}>
        <MenuItem value={portTypeUDP}>{portTypeUDP}</MenuItem>
        <MenuItem value={portTypeTCP}>{portTypeTCP}</MenuItem>
      </MaterialTableEditSelectField>
    );
  };

  private renderAddPluginControlledDialog() {
    return (
      <ControlledDialog
        dialogID="AddPlugin"
        title="Add Plugin"
        dialogProps={{
          fullWidth: true,
          maxWidth: "sm"
        }}
        actions={
          <>
            <Button
              onClick={() => this.props.dispatch(closeDialogAction("AddPlugin"))}
              color="default"
              variant="contained">
              Cancel
            </Button>
            <Button onClick={() => this.props.dispatch(submit("plugin"))} color="primary" variant="contained">
              Add
            </Button>
          </>
        }>
        <PluginForm form="plugin" onSubmit={console.log} />
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
              icon: "add_circle",
              iconProps: {
                color: "primary"
              },
              onClick: (...args) => {
                //   this.openComponentFormDialog(-1);
                this.props.dispatch(openDialogAction("AddPlugin", {}));
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
              render: this.renderNameColumn,
              editComponent: this.editNameComponent
            },
            {
              title: "Config",
              field: "config",
              initialEditValue: portTypeTCP,
              sorting: false,
              render: this.renderConfigColumn,
              editComponent: this.editConfigComponent
            }
          ]}
          editable={{
            onRowUpdate: this.handleEdit,
            onRowDelete: this.handleDelete
          }}
          data={this.getTableData()}
          title=""
        />
      </div>
    );
  }
}

export const Plugins = connect()((props: FieldArrayProps) => {
  return <FieldArray name="plugins" component={RenderPlugins} {...props} />;
});
