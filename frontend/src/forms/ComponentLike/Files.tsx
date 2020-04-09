import AddCircleIcon from "@material-ui/icons/AddCircle";
import Immutable from "immutable";
import MaterialTable, { EditComponentProps } from "material-table";
import React, { forwardRef } from "react";
import { connect, DispatchProp } from "react-redux";
import { arrayUnshift, change, WrappedFieldArrayProps } from "redux-form";
import { FieldArray } from "redux-form/immutable";
import { MaterialTableEditTextField } from "../Basic/text";
import { Volume, VolumeTypeKappConfigs } from "../../types/componentTemplate";
import { MaterialTableEditVolumeConfigField } from "./VolumeConfig";

interface FieldArrayComponentHackType {
  name: any;
  component: any;
}

interface FieldArrayProps extends DispatchProp {}

interface Props extends WrappedFieldArrayProps<Volume>, FieldArrayComponentHackType, FieldArrayProps {}

interface RowData {
  path: string;
  size: string;
  kappConfigPath: string;
  index: number;
}

class RenderFiles extends React.PureComponent<Props> {
  private tableRef: React.RefObject<MaterialTable<RowData>>;

  constructor(props: Props) {
    super(props);
    this.tableRef = React.createRef();
  }

  private getTableData() {
    const { fields } = this.props;
    const data: RowData[] = [];

    fields.forEach((_, index) => {
      const volume = fields.get(index);
      if (volume.get("type") === VolumeTypeKappConfigs) {
        data.push({
          path: volume.get("path"),
          size: volume.get("size"),
          kappConfigPath: volume.get("kappConfigPath"),
          index
        });
      }
    });
    return data;
  }

  private renderPathColumn = (rowData: RowData) => rowData.path;
  private renderSizeColumn = (rowData: RowData) => rowData.size;
  private renderKappConfigPath = (rowData: RowData) => rowData.kappConfigPath;

  private handleDelete = async (rowData: RowData) => {
    this.props.fields.remove(rowData.index);
  };

  private handleEdit = async (newRowData: RowData, oldRowData?: RowData) => {
    const { meta } = this.props;
    const formName = meta.form;
    const baseName = `${this.props.fields.name}[${newRowData.index}]`;

    const promises = [];
    if (!oldRowData || newRowData.path !== oldRowData.path) {
      promises.push(this.props.dispatch(change(formName, `${baseName}.path`, newRowData.path)));
    }

    if (!oldRowData || newRowData.size !== oldRowData.size) {
      promises.push(this.props.dispatch(change(formName, `${baseName}.size`, newRowData.size)));
    }

    if (!oldRowData || newRowData.kappConfigPath !== oldRowData.kappConfigPath) {
      promises.push(this.props.dispatch(change(formName, `${baseName}.kappConfigPath`, newRowData.kappConfigPath)));
    }

    await Promise.all(promises);

    this.forceUpdate();
  };

  private handleAdd = async (newRowData: RowData) => {
    const { meta } = this.props;
    const formName = meta.form;

    const volume: Volume = Immutable.Map({
      type: VolumeTypeKappConfigs,
      path: newRowData.path,
      size: newRowData.size,
      kappConfigPath: newRowData.kappConfigPath
    });

    return this.props.dispatch(arrayUnshift(formName, `${this.props.fields.name}`, volume));
  };

  private editPathComponent = (props: EditComponentProps<RowData>) => {
    return (
      <MaterialTableEditTextField textFieldProps={{ placeholder: "Mount Path", label: "Mount Path" }} {...props} />
    );
  };

  private editKappConfigPathComponent = (props: EditComponentProps<RowData>) => {
    return <MaterialTableEditVolumeConfigField {...props} />;
  };

  private editSizeComponent = (props: EditComponentProps<RowData>) => {
    return <MaterialTableEditTextField textFieldProps={{ placeholder: "Size", label: "Size" }} {...props} />;
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
              title: "Path",
              field: "path",
              sorting: false,
              render: this.renderPathColumn,
              editComponent: this.editPathComponent
            },
            {
              title: "Size",
              field: "size",
              sorting: false,
              render: this.renderSizeColumn,
              editComponent: this.editSizeComponent
            },
            {
              title: "Kapp Config Path",
              field: "kappConfigPath",
              sorting: false,
              render: this.renderKappConfigPath,
              editComponent: this.editKappConfigPathComponent
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

export const Files = connect()((props: FieldArrayProps) => {
  return <FieldArray name="volumes" component={RenderFiles} {...props} />;
});
