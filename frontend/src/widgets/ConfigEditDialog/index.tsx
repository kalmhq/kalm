import React from "react";
import Dialog from "@material-ui/core/Dialog";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import { TDispatch } from "../../types";
import ConfigForm from "../../forms/Config";
import { ConfigNode } from "../../types/config";
import { updateConfigAction } from "../../actions/config";

interface Props {
  open: boolean;
  onClose: () => void;
  dispatch: TDispatch;
  config: ConfigNode;
}

export const ConfigEditDialog = (props: Props) => {
  const { open, onClose, dispatch } = props;

  const handleClose = () => {
    onClose();
  };

  const handleSubmit = (config: ConfigNode) => {
    dispatch(updateConfigAction(config));
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
        <DialogTitle id="alert-dialog-title">Edit File</DialogTitle>
        <DialogContent>
          <ConfigForm onSubmit={handleSubmit} onClose={handleClose} formType="edit" configType="file" />
        </DialogContent>
      </Dialog>
    </div>
  );
};
