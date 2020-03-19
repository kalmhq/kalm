import React from "react";
import Dialog from "@material-ui/core/Dialog";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import { DispatchType } from "../../types";
import ConfigForm from "../../forms/Config";
import { ConfigNode } from "../../actions";
import { createConfigAction } from "../../actions/config";

interface Props {
  open: boolean;
  onClose: () => void;
  dispatch: DispatchType;
}

export function ConfigNewDialog(props: Props) {
  const { open, onClose, dispatch } = props;

  const handleClose = () => {
    onClose();
  };

  const handleSubmit = (config: ConfigNode) => {
    dispatch(createConfigAction(config));
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
        <DialogTitle id="alert-dialog-title">New Config</DialogTitle>
        <DialogContent>
          <ConfigForm onSubmit={handleSubmit} onClose={handleClose} formType="new" />
        </DialogContent>
      </Dialog>
    </div>
  );
}
