import React from "react";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";

interface Props {
  content: React.ReactNode;
  title: React.ReactNode;

  open: boolean;
  onClose: () => void;

  agreeText?: string;
  rejectText?: string;
  onAgree?: () => any;
  onReject?: () => any;
}

export function ConfirmDialog(props: Props) {
  const {
    title,
    content,
    agreeText,
    rejectText,
    onAgree,
    onReject,
    onClose,
    open
  } = props;

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
      >
        <DialogTitle id="alert-dialog-title">{title}</DialogTitle>
        <DialogContent>
          <DialogContentText>{content}</DialogContentText>
        </DialogContent>
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
