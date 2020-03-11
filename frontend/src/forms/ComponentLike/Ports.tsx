import { Box, MenuItem } from "@material-ui/core";
import AddCircleIcon from "@material-ui/icons/AddCircle";
import Immutable from "immutable";
import MaterialTable, { EditComponentProps } from "material-table";
import React, { forwardRef } from "react";
import { connect, DispatchProp } from "react-redux";
import { arrayUnshift, change, WrappedFieldArrayProps } from "redux-form";
import { FieldArray } from "redux-form/immutable";
import { ComponentLikePort, portTypeTCP, portTypeUDP } from "../../actions";
import { MaterialTableEditSelectField } from "../Basic/select";
import { MaterialTableEditTextField } from "../Basic/text";
import { NormalizePort } from "../normalizer";

interface FieldArrayComponentHackType {
  name: any;
  component: any;
}

interface FieldArrayProps extends DispatchProp {}

interface Props extends WrappedFieldArrayProps<ComponentLikePort>, FieldArrayComponentHackType, FieldArrayProps {}

interface RowData {
  name: string;
  protocol: string;
  servicePort: string;
  containerPort: string;
  index: number;
}

class RenderPorts extends React.PureComponent<Props> {
  private tableRef: React.RefObject<MaterialTable<RowData>>;

  constructor(props: Props) {
    super(props);
    this.tableRef = React.createRef();
  }

  private getTableData() {
    const { fields } = this.props;
    const data: RowData[] = [];

    fields.forEach((_, index) => {
      const port = fields.get(index);
      data.push({
        name: port.get("name"),
        protocol: port.get("protocol"),
        servicePort: port.get("servicePort").toString(),
        containerPort: port.get("containerPort").toString(),
        index
      });
    });
    return data;
  }

  private renderNameColumn = (rowData: RowData) => rowData.name;
  private renderProtocolColumn = (rowData: RowData) => rowData.protocol;
  private renderContainerPort = (rowData: RowData) => rowData.containerPort;
  private renderServicePortColumn = (rowData: RowData) => (
    <Box style={{ wordBreak: "break-all" }}>{rowData.servicePort}</Box>
  );

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

    if (!oldRowData || newRowData.servicePort !== oldRowData.servicePort) {
      promises.push(this.props.dispatch(change(formName, `${baseName}.servicePort`, newRowData.servicePort)));
    }

    if (!oldRowData || newRowData.containerPort !== oldRowData.containerPort) {
      promises.push(this.props.dispatch(change(formName, `${baseName}.containerPort`, newRowData.containerPort)));
    }

    if (!oldRowData || newRowData.protocol !== oldRowData.protocol) {
      promises.push(this.props.dispatch(change(formName, `${baseName}.protocol`, newRowData.protocol)));
    }

    await Promise.all(promises);

    this.forceUpdate();
  };

  private handleAdd = async (newRowData: RowData) => {
    const { meta } = this.props;
    const formName = meta.form;

    const servicePort: ComponentLikePort = Immutable.Map({
      name: newRowData.name,
      protocol: newRowData.protocol,
      servicePort: NormalizePort(newRowData.servicePort),
      containerPort: NormalizePort(newRowData.containerPort)
    });

    return this.props.dispatch(arrayUnshift(formName, `${this.props.fields.name}`, servicePort));
  };

  private editNameComponent = (props: EditComponentProps<RowData>) => {
    return <MaterialTableEditTextField textFieldProps={{ placeholder: "Name", label: "Name" }} {...props} />;
  };

  private editServicePortComponent = (props: EditComponentProps<RowData>) => {
    return (
      <MaterialTableEditTextField textFieldProps={{ placeholder: "ServicePort", label: "ServicePort" }} {...props} />
    );
  };

  private editContainerPortComponent = (props: EditComponentProps<RowData>) => {
    return (
      <MaterialTableEditTextField
        textFieldProps={{ placeholder: "ContainerPort", label: "ContainerPort" }}
        {...props}
      />
    );
  };

  private editProtocolComponent = (props: EditComponentProps<RowData>) => {
    return (
      <MaterialTableEditSelectField {...props} selectProps={{ label: "Protocol" }}>
        <MenuItem value={portTypeUDP}>{portTypeUDP}</MenuItem>
        <MenuItem value={portTypeTCP}>{portTypeTCP}</MenuItem>
      </MaterialTableEditSelectField>
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
              title: "Name",
              field: "name",
              sorting: false,
              render: this.renderNameColumn,
              editComponent: this.editNameComponent
            },
            {
              title: "Protocol",
              field: "protocol",
              initialEditValue: portTypeTCP,
              sorting: false,
              render: this.renderProtocolColumn,
              editComponent: this.editProtocolComponent
            },
            {
              title: "ContainerPort",
              field: "containerPort",
              initialEditValue: "3000",
              sorting: false,
              render: this.renderContainerPort,
              editComponent: this.editContainerPortComponent
            },

            {
              title: "Value",
              field: "servicePort",
              initialEditValue: "80",
              sorting: false,
              render: this.renderServicePortColumn,
              editComponent: this.editServicePortComponent
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

export const Ports = connect()((props: FieldArrayProps) => {
  return <FieldArray name="ports" component={RenderPorts} {...props} />;
});
