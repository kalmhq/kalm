import { Button } from "@material-ui/core";
import AddCircleIcon from "@material-ui/icons/AddCircle";
import Immutable from "immutable";
import MaterialTable from "material-table";
import React, { forwardRef } from "react";
import { connect, DispatchProp } from "react-redux";
import { arrayUnshift, change, submit, WrappedFieldArrayProps } from "redux-form";
import { FieldArray } from "redux-form/immutable";
import { closeDialogAction, openDialogAction } from "../../actions/dialog";
import { RootState } from "../../reducers";
import {
  newEmptyVolume,
  Volume,
  VolumeTypePersistentVolumeClaim,
  VolumeTypePersistentVolumeClaimExisting,
  VolumeTypePersistentVolumeClaimNew,
  VolumeTypeTemporaryDisk,
  VolumeTypeTemporaryMemory,
  VolumeContent
} from "../../types/componentTemplate";
import { ControlledDialog } from "../../widgets/ControlledDialog";
import { VolumeForm } from "../Volume";

interface FieldArrayComponentHackType {
  name: any;
  component: any;
}

const mapStateToProps = (state: RootState) => {
  const dialog = state.get("dialogs").get(dialogID);

  return {
    dialogData: dialog ? dialog.get("data") : {}
  };
};

interface FieldArrayProps extends DispatchProp, ReturnType<typeof mapStateToProps> {}

const dialogID = "volume";

interface RowData extends VolumeContent {
  index: number;
}

interface Props extends WrappedFieldArrayProps<Volume>, FieldArrayComponentHackType, FieldArrayProps {}

class RenderVolumes extends React.PureComponent<Props> {
  private getTableData() {
    const { fields } = this.props;
    const data: RowData[] = [];

    fields.forEach((_, index) => {
      const rowData = fields.get(index).toJS() as RowData;
      rowData.index = index;
      data.push(rowData);
    });

    return data;
  }

  private renderTypeColumn = (rowData: RowData) => {
    switch (rowData.type) {
      case VolumeTypePersistentVolumeClaim:
        return "Disk";
      case VolumeTypeTemporaryDisk:
        return "Temporary Disk";
      case VolumeTypeTemporaryMemory:
        return "Temporary memory Disk";
      default:
        return "";
    }
  };

  private renderSizeColumn = (rowData: RowData) => (rowData.size === "0" ? "-" : rowData.size);
  private renderMountPath = (rowData: RowData) => rowData.path;

  private handleAdd = async (_newRowData: RowData) => {
    const { meta } = this.props;
    const formName = meta.form;
    const value: Volume = Immutable.Map({
      type: "",
      path: "",
      size: "",
      kappConfigPath: "",
      storageClassName: "",
      persistentVolumeClaimName: ""
    });
    return this.props.dispatch(arrayUnshift(formName, `${this.props.fields.name}`, value));
  };

  private addVolume = (values: Volume) => {
    const { fields, dispatch, dialogData, meta } = this.props;

    // fix the type
    if (
      values.get("type") === VolumeTypePersistentVolumeClaimExisting ||
      values.get("type") === VolumeTypePersistentVolumeClaimNew
    ) {
      values = values.set("type", VolumeTypePersistentVolumeClaim);
    }

    if (dialogData.isAdding) {
      fields.push(values);
    } else {
      const index = dialogData.index;
      this.props.dispatch(change(meta.form, `${fields.name}[${index}]`, values));
    }

    dispatch(closeDialogAction(dialogID));
  };

  private renderAddVolumeControlledDialog() {
    const { dialogData, fields } = this.props;
    let initialValues: Volume;

    if (dialogData.isEditing) {
      initialValues = fields.get(dialogData.index);
    } else {
      initialValues = newEmptyVolume();
    }

    return (
      <ControlledDialog
        dialogID={dialogID}
        title={dialogData.isAdding ? "Add Volume" : "Edit volume"}
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
            <Button onClick={() => this.props.dispatch(submit("volume"))} color="primary" variant="contained">
              {dialogData.isAdding ? "Add" : "Update"}
            </Button>
          </>
        }>
        <VolumeForm form="volume" initialValues={initialValues} onSubmit={this.addVolume} />
      </ControlledDialog>
    );
  }

  private handleDelete = async (rowData: RowData) => {
    this.props.fields.remove(rowData.index);
  };

  public render() {
    return (
      <>
        {this.renderAddVolumeControlledDialog()}
        <MaterialTable
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
          actions={[
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
              title: "Type",
              field: "type",
              sorting: false,
              // initialEditValue: VolumeTypePersistentVolumeClaim,
              render: this.renderTypeColumn
              // editComponent: this.editTypeComponent
            },
            {
              title: "Mount Path",
              field: "mountPath",
              sorting: false,
              // initialEditValue: VolumeTypePersistentVolumeClaim,
              render: this.renderMountPath
              // editComponent: this.editTypeComponent
            },
            {
              title: "Size",
              field: "size",
              sorting: false,
              render: this.renderSizeColumn
              // editComponent: this.editNameComponent
            }
            // {
            //   title: "Value",
            //   field: "value",
            //   sorting: false,
            //   render: this.renderValueColumn
            //   // editComponent: this.editValueComponent
            // }
          ]}
          editable={{ onRowDelete: this.handleDelete }}
          data={this.getTableData()}
          title=""
        />
      </>
    );
  }
}

export const Volumes = connect(mapStateToProps)((props: FieldArrayProps) => {
  return <FieldArray name="volumes" component={RenderVolumes} {...props} />;
});
