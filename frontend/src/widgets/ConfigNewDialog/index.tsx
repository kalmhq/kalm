import React from "react";
import Dialog from "@material-ui/core/Dialog";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import { TDispatch } from "../../types";
import ConfigForm from "../../forms/Config";
import { ConfigNode, ConfigNodeType } from "../../types/config";
import { createConfigAction } from "../../actions/config";

interface Props {
  open: boolean;
  onClose: () => void;
  dispatch: TDispatch;
  configType: ConfigNodeType;
}

export const ConfigNewDialog = (props: Props) => {
  const { open, onClose, dispatch, configType } = props;

  const handleClose = () => {
    onClose();
  };

  const handleSubmit = (config: ConfigNode) => {
    // console.log("config", config.toJS());
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
        fullWidth={true}
      >
        <DialogTitle id="alert-dialog-title">{`New ${configType}`}</DialogTitle>
        <DialogContent>
          <ConfigForm onSubmit={handleSubmit} onClose={handleClose} formType="new" configType={configType} />
        </DialogContent>
      </Dialog>
    </div>
  );
};
