import { Box, Typography } from "@material-ui/core";
import AddCircleIcon from "@material-ui/icons/AddCircle";
import WarningIcon from "@material-ui/icons/Warning";
import Immutable from "immutable";
import MaterialTable, { EditComponentProps } from "material-table";
import React, { forwardRef } from "react";
import { connect, DispatchProp } from "react-redux";
import { arrayUnshift, change, WrappedFieldArrayProps } from "redux-form";
import { FieldArray } from "redux-form/immutable";
import { SharedEnv } from "../../actions";
import { getApplicationEnvStatus, getCurrentFormApplication } from "../../selectors/application";
import { MaterialTableEditAutoComplete } from "../Basic/autoComplete";
import { MaterialTableEditTextField } from "../Basic/text";
import { KappTooltip } from "./KappTooltip";

const mapStateToProps = () => {
  const application = getCurrentFormApplication();
  const envStatus = getApplicationEnvStatus(application);
  return { envStatus };
};

interface FieldArrayComponentHackType {
  name: any;
  component: any;
}

interface FieldArrayProps extends DispatchProp, ReturnType<typeof mapStateToProps> {}

interface Props extends WrappedFieldArrayProps<SharedEnv>, FieldArrayComponentHackType, FieldArrayProps {}

interface RowData {
  name: string;
  value: string;
  index: number;
}

class RenderSharedEnvs extends React.PureComponent<Props> {
  private nameAutoCompleteOptions: string[];
  private tableRef: React.RefObject<MaterialTable<RowData>>;

  constructor(props: Props) {
    super(props);
    this.nameAutoCompleteOptions = this.generateNameAutoCompleteOptionsFromProps(props);
    this.tableRef = React.createRef();
    window.debug = this.tableRef;
  }

  private generateNameAutoCompleteOptionsFromProps = (props: Props): string[] => {
    return Array.from(props.envStatus.notDefinedSharedEnvsSet);
  };

  public componentDidUpdate() {
    this.nameAutoCompleteOptions = this.generateNameAutoCompleteOptionsFromProps(this.props);
  }

  private getTableData() {
    const { fields } = this.props;
    const data: RowData[] = [];

    fields.forEach((_, index) => {
      const env = fields.get(index);
      data.push({
        name: env.get("name"),
        value: env.get("value"),
        index
      });
    });

    return data;
  }

  private renderNameColumn = (rowData: RowData) => {
    const { envStatus } = this.props;
    const notUsed = envStatus.notUsedSharedEnvsSet.has(rowData.name);

    if (notUsed) {
      return (
        <KappTooltip title={<Typography color="inherit">Not used by any component</Typography>} placement="right">
          <Box display="flex" alignItems="center" justifyContent="space-between" color="warning.main">
            <Box>{rowData.name}</Box>
            <WarningIcon fontSize="small" />
          </Box>
        </KappTooltip>
      );
    }

    return rowData.name;
  };

  private renderValueColumn = (rowData: RowData) => <Box style={{ wordBreak: "break-all" }}>{rowData.value}</Box>;

  private handleDelete = async (rowData: RowData) => {
    this.props.fields.remove(rowData.index);
  };

  private handleEdit = async (newRowData: RowData, oldRowData?: RowData) => {
    if (!oldRowData || newRowData.name !== oldRowData.name) {
      this.props.dispatch(
        change("application", `${this.props.fields.name}[${newRowData.index}].name`, newRowData.name)
      );
    }

    if (!oldRowData || newRowData.value !== oldRowData.value) {
      this.props.dispatch(
        change("application", `${this.props.fields.name}[${newRowData.index}].value`, newRowData.value)
      );
    }
  };

  private handleAdd = async (newRowData: RowData) => {
    const value: SharedEnv = Immutable.Map({
      name: newRowData.name,
      value: newRowData.value
    });
    return this.props.dispatch(arrayUnshift("application", `${this.props.fields.name}`, value));
  };

  private editNameComponent = (props: EditComponentProps<RowData>) => {
    return (
      <MaterialTableEditAutoComplete
        {...props}
        options={this.nameAutoCompleteOptions}
        textFieldProps={{ autoFocus: true, placeholder: "Name", label: "Name" }}
      />
    );
  };

  private editValueComponent = (props: EditComponentProps<RowData>) => {
    return <MaterialTableEditTextField textFieldProps={{ placeholder: "Value", label: "Value" }} {...props} />;
  };

  public render() {
    const missingVariables = Array.from(this.props.envStatus.notDefinedSharedEnvsSet);
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
        {missingVariables.length > 0 ? (
          <Box color="secondary.main" mt={2}>
            Still <strong>{missingVariables.length}</strong> Environment Variables are not defined.
            <br />
            <br />
            {missingVariables.map((x, index) => (
              <span key={x}>
                <strong>{x}</strong>
                {index < missingVariables.length - 1 ? <span>, </span> : null}
              </span>
            ))}
          </Box>
        ) : null}
      </div>
    );
  }
}

export const SharedEnvs = connect(mapStateToProps)((props: FieldArrayProps) => {
  return <FieldArray name="sharedEnv" component={RenderSharedEnvs} {...props} />;
});
