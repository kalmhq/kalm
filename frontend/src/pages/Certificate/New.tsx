import React from "react";
import { Modal, withStyles, createStyles, Theme, WithStyles } from "@material-ui/core";
import { RootState } from "reducers";
import { connect } from "react-redux";
import { TDispatchProp } from "types";
import { newEmptyCertificateForm, CertificateFormType } from "types/certificate";
import { createCertificateAction, setIsShowAddCertificateModal } from "actions/certificate";
import { CertificateForm } from "forms/Certificate";

const mapStateToProps = (state: RootState) => {
  return {
    isShowAddCertificateModal: state.get("certificates").get("isShowAddCertificateModal")
  };
};

const styles = (theme: Theme) =>
  createStyles({
    root: {},
    paper: {
      position: "absolute",
      width: 700,
      left: 0,
      right: 0,
      margin: "auto",
      backgroundColor: theme.palette.background.paper,
      border: "2px solid #000",
      boxShadow: theme.shadows[5],
      padding: theme.spacing(2, 4, 3)
    }
  });

interface Props extends WithStyles<typeof styles>, ReturnType<typeof mapStateToProps>, TDispatchProp {}

class CertificateNewRaw extends React.PureComponent<Props> {
  private submit = async (certificate: CertificateFormType) => {
    try {
      await this.props.dispatch(createCertificateAction(certificate));
      this.props.dispatch(setIsShowAddCertificateModal(false));
    } catch (e) {
      console.log(e);
    }
  };

  private handleClose = () => {
    this.props.dispatch(setIsShowAddCertificateModal(false));
  };

  public render() {
    const { isShowAddCertificateModal, classes } = this.props;
    return (
      <Modal
        aria-labelledby="spring-modal-title"
        aria-describedby="spring-modal-description"
        open={isShowAddCertificateModal}
        onClose={this.handleClose}
        closeAfterTransition
        BackdropProps={{
          invisible: true
        }}>
        <div className={classes.paper}>
          <CertificateForm onSubmit={this.submit} initialValues={newEmptyCertificateForm()} />
        </div>
      </Modal>
    );
  }
}

export const NewModal = withStyles(styles)(connect(mapStateToProps)(CertificateNewRaw));
