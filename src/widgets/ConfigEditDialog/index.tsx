import React from "react";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import { DispatchType } from "../../types";
import ConfigForm from "../../forms/Config";
import { Config } from "../../actions";

interface Props {
  open: boolean;
  onClose: () => void;
  dispatch: DispatchType;
  config: Config;
}

export function ConfigEditDialog(props: Props) {
  const { open, onClose } = props;

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
        fullWidth={true}
      >
        <DialogTitle id="alert-dialog-title">Edit Config</DialogTitle>
        <DialogContent>
          <ConfigForm onSubmit={handleSubmit} onClose={handleClose} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
