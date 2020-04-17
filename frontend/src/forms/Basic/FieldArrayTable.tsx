import AddCircleIcon from "@material-ui/icons/AddCircle";
import Immutable from "immutable";
import MaterialTable, { EditComponentProps, Column } from "material-table";
import React, { forwardRef } from "react";
import { DispatchProp } from "react-redux";
import { arrayUnshift, change, WrappedFieldArrayProps } from "redux-form";

interface FieldArrayComponentHackType {
  name: any;
  component: any;
  columns: Column<RowData>[];
  tableData?: RowData[];

  isEditable?: boolean;
  isDeletable?: boolean;

  handleAdd?: ((newData: RowData) => Promise<any>) | undefined;
  handleUpdate?: ((newData: RowData, oldData?: RowData | undefined) => Promise<any>) | undefined;
  handleDelete?: ((oldData: RowData) => Promise<any>) | undefined;
}

interface FieldArrayProps extends DispatchProp {}

interface Props
  extends WrappedFieldArrayProps<Immutable.Map<string, any>>,
    FieldArrayComponentHackType,
    FieldArrayProps {}

interface RowData {
  index: number;
  [key: string]: any;
}

export class FieldArrayTable extends React.PureComponent<Props> {
  private tableRef: React.RefObject<MaterialTable<RowData>>;

  constructor(props: Props) {
    super(props);
    this.tableRef = React.createRef();
  }

  private getTableData() {
    const { fields, tableData } = this.props;
    if (tableData) {
      return tableData;
    }

    const data: RowData[] = [];

    fields.forEach((_, index) => {
      const row = fields.get(index);
      data.push({
        ...row.toJS(),
        index
      });
    });
    return data;
  }

  private getColumns() {
    const { columns } = this.props;

    const newColumns: Column<RowData>[] = columns.map(column => {
      if (!column.render) {
        column.render = (rowData: RowData) => rowData[column.field as string];
      }

      if (!column.editComponent) {
        column.editComponent = (props: EditComponentProps<RowData>) => {
          return (
            <MaterialTableEditTextField
              textFieldProps={{ placeholder: column.field as string, label: column.title }}
              {...props}
            />
          );
        };
      }

      return column;
    });

    return newColumns;
  }

  private getEditable() {
    const { handleAdd, handleUpdate, handleDelete, isEditable, isDeletable } = this.props;

    const editable: {
      onRowAdd?: ((newData: RowData) => Promise<any>) | undefined;
      onRowUpdate?: ((newData: RowData, oldData?: RowData | undefined) => Promise<any>) | undefined;
      onRowDelete?: ((oldData: RowData) => Promise<any>) | undefined;
    } = {};

    editable.onRowAdd = handleAdd || this.handleAdd;

    if (isEditable) {
      editable.onRowUpdate = handleUpdate || this.handleUpdate;
    }

    if (isDeletable) {
      editable.onRowDelete = handleDelete || this.handleDelete;
    }

    return editable;
  }

  private handleAdd = async (newRowData: RowData) => {
    const { meta } = this.props;
    const formName = meta.form;

    let copiedRowData = { ...newRowData };
    delete copiedRowData.index;

    const row: ComponentLikePort = Immutable.Map(copiedRowData);

    return this.props.dispatch(arrayUnshift(formName, `${this.props.fields.name}`, row));
  };

  private handleUpdate = async (newRowData: RowData, oldRowData?: RowData) => {
    const { meta } = this.props;
    const formName = meta.form;
    const baseName = `${this.props.fields.name}[${newRowData.index}]`;

    const promises = [];

    for (let rowDataKey in newRowData) {
      if (!oldRowData || newRowData[rowDataKey] !== oldRowData[rowDataKey]) {
        promises.push(this.props.dispatch(change(formName, `${baseName}.${rowDataKey}`, newRowData[rowDataKey])));
      }
    }

    await Promise.all(promises);

    this.forceUpdate();
  };

  private handleDelete = async (rowData: RowData) => {
    this.props.fields.remove(rowData.index);
  };

  public render() {
    return (
      <div>
        <MaterialTable
          tableRef={this.tableRef}
          options={{
            padding: "dense",
            search: false,
            paging: false,
            actionsColumnIndex: -1,
            addRowPosition: "first",
            draggable: false
          }}
          icons={{
            Add: forwardRef((props, ref) => <AddCircleIcon ref={ref} {...props} color="primary" />)
          }}
          components={{ Container: props => props.children }}
          columns={this.getColumns()}
          editable={this.getEditable()}
          data={this.getTableData()}
          title=""
        />
      </div>
    );
  }
}
