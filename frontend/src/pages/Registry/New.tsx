import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { submit } from "redux-form";
import { TDispatchProp } from "types";
import { closeDialogAction } from "../../actions/dialog";
import { createRegistryAction, updateRegistryAction } from "../../actions/registries";
import { RegistryForm } from "../../forms/Registry";
import { newEmptyRegistry, RegistryType } from "../../types/registry";
import { CustomizedButton } from "../../widgets/Button";
import { ControlledDialog } from "../../widgets/ControlledDialog";
import { REGISTRY_FORM_ID } from "../../forms/formIDs";

export const RegistryNewModalID = "RegistryNewModalID";

const styles = (theme: Theme) =>
  createStyles({
    root: {},
  });

const mapStateToProps = (state: RootState) => {
  return {
    isSubmittingRegistry: state.get("registries").get("isSubmittingRegistry"),
  };
};

interface Props extends WithStyles<typeof styles>, ReturnType<typeof mapStateToProps>, TDispatchProp {
  isEdit: boolean;
  registry?: RegistryType;
}

interface State {}

class RegistryNewModalRaw extends React.PureComponent<Props, State> {
  private submit = async (registryValue: RegistryType) => {
    const { dispatch, isEdit } = this.props;
    if (isEdit) {
      await dispatch(updateRegistryAction(registryValue));
    } else {
      await dispatch(createRegistryAction(registryValue));
    }
    dispatch(closeDialogAction(RegistryNewModalID));
  };

  private renderActions() {
    const { dispatch, isSubmittingRegistry } = this.props;
    return (
      <>
        <CustomizedButton onClick={() => dispatch(closeDialogAction(RegistryNewModalID))} color="primary">
          Cancel
        </CustomizedButton>
        <CustomizedButton
          disabled={isSubmittingRegistry}
          onClick={() => dispatch(submit(REGISTRY_FORM_ID))}
          color="primary"
        >
          Save
        </CustomizedButton>
      </>
    );
  }

  public render() {
    const { isEdit, registry } = this.props;
    return (
      <ControlledDialog
        dialogID={RegistryNewModalID}
        title={isEdit ? "Edit Registry" : "Add Registry"}
        actions={this.renderActions()}
        dialogProps={{
          fullWidth: true,
          maxWidth: "sm",
        }}
      >
        <RegistryForm isEdit={isEdit} onSubmit={this.submit} initialValues={registry || newEmptyRegistry()} />
      </ControlledDialog>
    );
  }
}

export const RegistryNewModal = withStyles(styles)(connect(mapStateToProps)(RegistryNewModalRaw));
