import AddCircleIcon from "@material-ui/icons/AddCircle";
import Immutable from "immutable";
import MaterialTable, { EditComponentProps } from "material-table";
import React, { forwardRef } from "react";
import { connect, DispatchProp } from "react-redux";
import { arrayUnshift, change, WrappedFieldArrayProps } from "redux-form";
import { FieldArray } from "redux-form/immutable";
import { MaterialTableEditTextField } from "../Basic/text";
import { ConfigMount } from "../../types/componentTemplate";
import { MaterialTableEditConfigField } from "./Config";

interface FieldArrayComponentHackType {
  name: any;
  component: any;
}

interface FieldArrayProps extends DispatchProp {}

interface Props extends WrappedFieldArrayProps<ConfigMount>, FieldArrayComponentHackType, FieldArrayProps {}

interface RowData {
  paths: string[];
  mountPath: string;
  index: number;
}

class RenderConfigs extends React.PureComponent<Props> {
  private tableRef: React.RefObject<MaterialTable<RowData>>;

  constructor(props: Props) {
    super(props);
    this.tableRef = React.createRef();
  }

  private getTableData() {
    const { fields } = this.props;
    const data: RowData[] = [];

    fields.forEach((_, index) => {
      const config = fields.get(index);
      data.push({
        paths: config.get("paths").toArray(),
        mountPath: config.get("mountPath"),
        index
      });
    });
    return data;
  }

  private renderPathsColumn = (rowData: RowData) => rowData.paths.join(", ");
  private renderMountPathColumn = (rowData: RowData) => rowData.mountPath;

  private handleDelete = async (rowData: RowData) => {
    this.props.fields.remove(rowData.index);
  };

  private handleEdit = async (newRowData: RowData, oldRowData?: RowData) => {
    const { meta } = this.props;
    const formName = meta.form;
    const baseName = `${this.props.fields.name}[${newRowData.index}]`;

    const promises = [];
    if (!oldRowData || newRowData.paths !== oldRowData.paths) {
      promises.push(this.props.dispatch(change(formName, `${baseName}.paths`, Immutable.List(newRowData.paths))));
    }

    if (!oldRowData || newRowData.mountPath !== oldRowData.mountPath) {
      promises.push(this.props.dispatch(change(formName, `${baseName}.mountPath`, newRowData.mountPath)));
    }

    await Promise.all(promises);

    this.forceUpdate();
  };

  private handleAdd = async (newRowData: RowData) => {
    const { meta } = this.props;
    const formName = meta.form;

    const config: ConfigMount = Immutable.Map({
      paths: Immutable.List(newRowData.paths),
      mountPath: newRowData.mountPath
    });

    return this.props.dispatch(arrayUnshift(formName, `${this.props.fields.name}`, config));
  };

  private editPathsComponent = (props: EditComponentProps<RowData>) => {
    return <MaterialTableEditConfigField {...props} />;
  };

  private editMountPathComponent = (props: EditComponentProps<RowData>) => {
    return (
      <MaterialTableEditTextField textFieldProps={{ placeholder: "Mount Path", label: "Mount Path" }} {...props} />
    );
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
              title: "Paths",
              field: "paths",
              sorting: false,
              render: this.renderPathsColumn,
              editComponent: this.editPathsComponent
            },
            {
              title: "Mount Path",
              field: "mountPath",
              sorting: false,
              render: this.renderMountPathColumn,
              editComponent: this.editMountPathComponent
            }
          ]}
          editable={{
            onRowAdd: this.handleAdd,
            // onRowUpdate: this.handleEdit
            onRowDelete: this.handleDelete
          }}
          data={this.getTableData()}
          title=""
        />
      </div>
    );
  }
}

export const Configs = connect()((props: FieldArrayProps) => {
  return <FieldArray name="configs" component={RenderConfigs} {...props} />;
});
