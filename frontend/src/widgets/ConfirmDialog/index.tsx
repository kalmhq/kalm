import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import { TransitionHandlerProps } from "@material-ui/core/transitions";
import React from "react";

interface ConfirmDialogProps extends TransitionHandlerProps {
  content: React.ReactNode;
  title: React.ReactNode;

  open: boolean;
  onClose: () => void;

  agreeText?: string;
  rejectText?: string;
  onAgree?: () => any;
  onReject?: () => any;
}

export function ConfirmDialog(props: ConfirmDialogProps) {
  const { title, content, agreeText, rejectText, onAgree, onReject, onClose, open } = props;

  const handleClose = () => {
    onClose();
  };

  const handleAgree = () => {
    onAgree && onAgree();
    onClose();
  };

  const handleReject = () => {
    onClose();
    onReject && onReject();
  };

  return (
    <div>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        onEnter={props.onEnter}
        onEntering={props.onEntering}
        onEntered={props.onEntered}
        onExit={props.onExit}
        onExiting={props.onExiting}
        onExited={props.onExited}
      >
        <DialogTitle id="alert-dialog-title">{title}</DialogTitle>
        <DialogContent>{content}</DialogContent>
        <DialogActions>
          <Button onClick={handleReject} color="primary">
            {rejectText || "Close"}
          </Button>
          <Button onClick={handleAgree} color="primary" autoFocus>
            {agreeText || "OK"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
