import React from "react";
import Dialog from "@material-ui/core/Dialog";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import { TDispatch } from "../../types";
import { Theme, createStyles, WithStyles, withStyles } from "@material-ui/core";
import ConfigUploadForm from "../../forms/Config/upload";

const styles = (theme: Theme) =>
  createStyles({
    root: {},
    buttons: {
      padding: "30px 0 20px"
    },
    cancelButton: {
      marginLeft: 15
    }
  });

interface Props extends WithStyles<typeof styles> {
  open: boolean;
  onClose: () => void;
  dispatch: TDispatch;
}

interface State {}

class ConfigUploadDialogRaw extends React.PureComponent<Props, State> {
  public render() {
    const { open, onClose, dispatch } = this.props;

    const handleClose = () => {
      onClose();
    };

    const handleSubmit = () => {
      onClose();
    };

    return (
      <div>
        <Dialog
          open={open}
          onClose={handleClose}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
          maxWidth={"md"}
          fullWidth={true}>
          <DialogTitle id="alert-dialog-title">Upload Configs</DialogTitle>
          <DialogContent>
            <ConfigUploadForm onSubmit={handleSubmit} onClose={handleClose} dispatch={dispatch} />
          </DialogContent>
        </Dialog>
      </div>
    );
  }
}

export const ConfigUploadDialog = withStyles(styles)(ConfigUploadDialogRaw);
