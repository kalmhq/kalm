import React from "react";
import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import { connect } from "react-redux";
import { TDispatchProp } from "types";
import { CertificateFormType, newEmptyCertificateForm, selfManaged } from "types/certificate";
import { createCertificateAction, setEditCertificateModalAction } from "actions/certificate";
import { CertificateForm } from "forms/Certificate";
import { ControlledDialog } from "widgets/ControlledDialog";
import { closeDialogAction } from "actions/dialog";
import { RootState } from "reducers";
import Immutable from "immutable";

export const addCertificateDialogId = "certificate-dialog-id";
const mapStateToProps = (state: RootState) => {
  const editingCertificate = state.get("certificates").get("editingCertificate");
  const isEdit = !!editingCertificate;
  return {
    isEdit,
    editingCertificate,
    initialValues: editingCertificate
      ? Immutable.fromJS({
          name: editingCertificate.get("name"),
          managedType: selfManaged,
        })
      : newEmptyCertificateForm,
  };
};

const styles = (theme: Theme) =>
  createStyles({
    root: {},
  });

export interface Props extends WithStyles<typeof styles>, TDispatchProp, ReturnType<typeof mapStateToProps> {}

class CertificateNewRaw extends React.PureComponent<Props> {
  private submit = async (certificate: CertificateFormType) => {
    try {
      const { isEdit, dispatch } = this.props;
      await dispatch(createCertificateAction(certificate, isEdit));
      dispatch(closeDialogAction(addCertificateDialogId));
      dispatch(setEditCertificateModalAction(null));
    } catch (e) {
      console.log(e);
    }
  };

  public render() {
    const { isEdit, initialValues } = this.props;
    return (
      <ControlledDialog
        dialogID={addCertificateDialogId}
        title={isEdit ? "Edit Certificate" : "Add Certificate"}
        dialogProps={{
          fullWidth: true,
          maxWidth: "sm",
        }}
      >
        <CertificateForm isEdit={isEdit} onSubmit={this.submit} initialValues={initialValues} />
      </ControlledDialog>
    );
  }
}

export const NewModal = withStyles(styles)(connect(mapStateToProps)(CertificateNewRaw));
