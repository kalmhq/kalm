import { Box, MenuItem } from "@material-ui/core";
import AddCircleIcon from "@material-ui/icons/AddCircle";
import Immutable from "immutable";
import MaterialTable, { EditComponentProps } from "material-table";
import React, { forwardRef } from "react";
import { connect, DispatchProp } from "react-redux";
import { arrayUnshift, change, WrappedFieldArrayProps } from "redux-form";
import { FieldArray } from "redux-form/immutable";
import { MaterialTableEditTextField } from "../Basic/text";
import { EnvTypeStatic, EnvTypeExternal, EnvTypeLinked } from "../../actions";
import { MaterialTableEditSelectField } from "../Basic/select";
import { SharedEnv } from "../../types/application";
interface FieldArrayComponentHackType {
  name: any;
  component: any;
}

interface FieldArrayProps extends DispatchProp {}

interface Props extends WrappedFieldArrayProps<SharedEnv>, FieldArrayComponentHackType, FieldArrayProps {}

interface RowData {
  name: string;
  value: string;
  type: string;
  index: number;
}

class RenderEnvs extends React.PureComponent<Props> {
  private tableRef: React.RefObject<MaterialTable<RowData>>;

  constructor(props: Props) {
    super(props);
    this.tableRef = React.createRef();
  }

  private getTableData() {
    const { fields } = this.props;
    const data: RowData[] = [];

    fields.forEach((_, index) => {
      const env = fields.get(index);
      data.push({
        name: env.get("name"),
        value: env.get("value"),
        type: env.get("type"),
        index
      });
    });

    return data;
  }

  private renderNameColumn = (rowData: RowData) => rowData.name;
  private renderTypeColumn = (rowData: RowData) => rowData.type;
  private renderValueColumn = (rowData: RowData) => <Box style={{ wordBreak: "break-all" }}>{rowData.value}</Box>;

  private handleDelete = async (rowData: RowData) => {
    this.props.fields.remove(rowData.index);
  };

  private handleEdit = async (newRowData: RowData, oldRowData?: RowData) => {
    const { meta } = this.props;
    const formName = meta.form;

    if (!oldRowData || newRowData.name !== oldRowData.name) {
      this.props.dispatch(change(formName, `${this.props.fields.name}[${newRowData.index}].name`, newRowData.name));
    }

    if (!oldRowData || newRowData.value !== oldRowData.value) {
      this.props.dispatch(change(formName, `${this.props.fields.name}[${newRowData.index}].value`, newRowData.value));
    }

    if (!oldRowData || newRowData.type !== oldRowData.type) {
      this.props.dispatch(change(formName, `${this.props.fields.name}[${newRowData.index}].type`, newRowData.type));
    }
  };

  private handleAdd = async (newRowData: RowData) => {
    const { meta } = this.props;
    const formName = meta.form;
    const value: SharedEnv = Immutable.Map({
      name: newRowData.name,
      value: newRowData.value,
      type: newRowData.type
    });
    return this.props.dispatch(arrayUnshift(formName, `${this.props.fields.name}`, value));
  };

  private editNameComponent = (props: EditComponentProps<RowData>) => {
    return <MaterialTableEditTextField textFieldProps={{ placeholder: "Name", label: "Name" }} {...props} />;
  };

  private editValueComponent = (props: EditComponentProps<RowData>) => {
    return <MaterialTableEditTextField textFieldProps={{ placeholder: "Value", label: "Value" }} {...props} />;
  };

  private editTypeComponent = (props: EditComponentProps<RowData>) => {
    return (
      <MaterialTableEditSelectField {...props} selectProps={{ label: "Type" }}>
        <MenuItem value={EnvTypeStatic}>Static</MenuItem>
        <MenuItem value={EnvTypeExternal}>External</MenuItem>
        <MenuItem value={EnvTypeLinked}>Linked</MenuItem>
      </MaterialTableEditSelectField>
    );
  };

  public render() {
    return (
      <div>
        <MaterialTable
          tableRef={this.tableRef}
          options={{
            search: false,
            paging: false,
            //   toolbar: false
            actionsColumnIndex: -1,
            addRowPosition: "first",
            draggable: false
          }}
          icons={{
            Add: forwardRef((props, ref) => <AddCircleIcon ref={ref} {...props} color="primary" />)
          }}
          components={{ Container: props => props.children }}
          columns={[
            {
              title: "Type",
              field: "type",
              sorting: false,
              initialEditValue: EnvTypeStatic,
              render: this.renderTypeColumn,
              editComponent: this.editTypeComponent
            },
            {
              title: "Name",
              field: "name",
              sorting: false,
              render: this.renderNameColumn,
              editComponent: this.editNameComponent
            },
            {
              title: "Value",
              field: "value",
              sorting: false,
              render: this.renderValueColumn,
              editComponent: this.editValueComponent
            }
          ]}
          editable={{
            onRowAdd: this.handleAdd,
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

export const Envs = connect()((props: FieldArrayProps) => {
  return <FieldArray name="env" component={RenderEnvs} {...props} />;
});
