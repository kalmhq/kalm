import React from "react";
import { withStyles, createStyles, Theme, WithStyles } from "@material-ui/core";
import { connect } from "react-redux";
import { TDispatchProp } from "types";
import { newEmptyCertificateForm, CertificateFormType, selfManaged } from "types/certificate";
import { createCertificateAction, setEditCertificateModal } from "actions/certificate";
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
    editingCertificate
  };
};

const styles = (theme: Theme) =>
  createStyles({
    root: {},
    fileInput: {},
    label: {
      fontSize: 12,
      marginBottom: 18,
      display: "block"
    },
    editBtn: {
      marginLeft: 8
    }
  });

export interface Props extends WithStyles<typeof styles>, TDispatchProp, ReturnType<typeof mapStateToProps> {}

class CertificateNewRaw extends React.PureComponent<Props> {
  private submit = async (certificate: CertificateFormType) => {
    try {
      const { isEdit, dispatch } = this.props;
      await dispatch(createCertificateAction(certificate, isEdit));
      dispatch(closeDialogAction(addCertificateDialogId));
      dispatch(setEditCertificateModal(null));
    } catch (e) {
      console.log(e);
    }
  };

  private generateCertificateForm = () => {
    const { editingCertificate } = this.props;
    if (editingCertificate) {
      return Immutable.fromJS({
        name: editingCertificate.get("name"),
        managedType: selfManaged
      });
    } else {
      return newEmptyCertificateForm();
    }
  };

  public render() {
    const { isEdit } = this.props;
    return (
      <ControlledDialog
        dialogID={addCertificateDialogId}
        title={isEdit ? "Edit Certificate" : "Add Certificate"}
        dialogProps={{
          fullWidth: true,
          maxWidth: "sm"
        }}>
        <CertificateForm isEdit={isEdit} onSubmit={this.submit} initialValues={this.generateCertificateForm()} />
      </ControlledDialog>
    );
  }
}

export const NewModal = withStyles(styles)(connect(mapStateToProps)(CertificateNewRaw));
