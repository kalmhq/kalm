import React from "react";
import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core/";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import MuiDialogTitle from "@material-ui/core/DialogTitle";
import MuiDialogContent from "@material-ui/core/DialogContent";
import MuiDialogActions from "@material-ui/core/DialogActions";
import IconButton from "@material-ui/core/IconButton";
import CloseIcon from "@material-ui/icons/Close";
import Typography from "@material-ui/core/Typography";

const styles = (theme: Theme) =>
  createStyles({
    root: {
      margin: 0,
      padding: theme.spacing(2)
    },
    closeButton: {
      position: "absolute",
      right: theme.spacing(1),
      top: theme.spacing(1),
      color: theme.palette.grey[500]
    }
  });

export interface DialogTitleProps extends WithStyles<typeof styles> {
  id: string;
  children: React.ReactNode;
  onClose: () => void;
}

const DialogTitle = withStyles(styles)((props: DialogTitleProps) => {
  const { children, classes, onClose, ...other } = props;
  return (
    <MuiDialogTitle disableTypography className={classes.root} {...other}>
      <Typography variant="h6">{children}</Typography>
      {onClose ? (
        <IconButton aria-label="close" color="default" className={classes.closeButton} onClick={onClose}>
          <CloseIcon />
        </IconButton>
      ) : null}
    </MuiDialogTitle>
  );
});

const DialogContent = withStyles((theme: Theme) => ({
  root: {
    padding: theme.spacing(2)
  }
}))(MuiDialogContent);

const DialogActions = withStyles((theme: Theme) => ({
  root: {
    margin: 0,
    padding: theme.spacing(1)
  }
}))(MuiDialogActions);

interface Props {
  open: boolean;
  title?: string;
  saveButtonText?: string;
  children?: React.ReactNode;
  handleClose: () => void;
  handleSave: () => void;
}

const dialogStyles = (theme: Theme) => ({
  paper: {
    backgroundColor: "#FAFAFA"
  }
});

const CustomizedDialogRaw = (props: Props & WithStyles<typeof dialogStyles>) => {
  const { open, handleClose, title, saveButtonText, children, handleSave, classes } = props;

  return (
    <div>
      <Dialog
        classes={classes}
        fullScreen
        onClose={handleClose}
        aria-labelledby="customized-dialog-title"
        open={open}
        maxWidth="md">
        <DialogTitle id="customized-dialog-title" onClose={handleClose}>
          {title}
        </DialogTitle>
        <DialogContent>{children}</DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="default" variant="contained">
            Cancel
          </Button>
          <Button onClick={handleSave} color="primary" variant="contained">
            {saveButtonText || "Save changes"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export const CustomizedDialog = withStyles(dialogStyles)(CustomizedDialogRaw);
