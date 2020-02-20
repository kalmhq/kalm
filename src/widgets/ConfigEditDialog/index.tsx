import React from "react";
import Dialog from "@material-ui/core/Dialog";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import { DispatchType } from "../../types";
import ConfigForm from "../../forms/Config";
import { Config } from "../../actions";
import { updateConfigAction } from "../../actions/config";

interface Props {
  open: boolean;
  onClose: () => void;
  dispatch: DispatchType;
  config: Config;
}

export function ConfigEditDialog(props: Props) {
  const { open, onClose, dispatch } = props;

  const handleClose = () => {
    onClose();
  };

  const handleSubmit = (config: Config) => {
    console.log("ConfigEditDialog update config", config.toJS());
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
        fullWidth={true}
      >
        <DialogTitle id="alert-dialog-title">Edit Config</DialogTitle>
        <DialogContent>
          <ConfigForm
            onSubmit={handleSubmit}
            onClose={handleClose}
            formType="edit"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
