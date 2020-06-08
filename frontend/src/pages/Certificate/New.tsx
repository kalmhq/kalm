import React from "react";
import { withStyles, createStyles, Theme, WithStyles } from "@material-ui/core";
import { connect } from "react-redux";
import { TDispatchProp } from "types";
import { newEmptyCertificateForm, CertificateFormType } from "types/certificate";
import { createCertificateAction } from "actions/certificate";
import { CertificateForm } from "forms/Certificate";
import { ControlledDialog } from "widgets/ControlledDialog";
import { closeDialogAction } from "actions/dialog";

export const addCertificateDialogId = "certificate-dialog-id";

const styles = (theme: Theme) =>
  createStyles({
    root: {}
  });

interface Props extends WithStyles<typeof styles>, TDispatchProp {}

class CertificateNewRaw extends React.PureComponent<Props> {
  private submit = async (certificate: CertificateFormType) => {
    try {
      await this.props.dispatch(createCertificateAction(certificate));
      this.props.dispatch(closeDialogAction(addCertificateDialogId));
    } catch (e) {
      console.log(e);
    }
  };

  public render() {
    return (
      <ControlledDialog
        dialogID={addCertificateDialogId}
        title={"Add Certificate"}
        dialogProps={{
          fullWidth: true,
          maxWidth: "sm"
        }}>
        <CertificateForm onSubmit={this.submit} initialValues={newEmptyCertificateForm()} />
      </ControlledDialog>
    );
  }
}

export const NewModal = withStyles(styles)(connect()(CertificateNewRaw));
