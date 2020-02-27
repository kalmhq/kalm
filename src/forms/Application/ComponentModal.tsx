import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core/";
import Dialog, { DialogProps } from "@material-ui/core/Dialog";
import MuiDialogActions from "@material-ui/core/DialogActions";
import MuiDialogContent from "@material-ui/core/DialogContent";
import MuiDialogTitle from "@material-ui/core/DialogTitle";
import IconButton from "@material-ui/core/IconButton";
import Typography from "@material-ui/core/Typography";
import CloseIcon from "@material-ui/icons/Close";
import React from "react";

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
  children?: React.ReactNode;
  handleClose: () => void;
  actions?: React.ReactNode;
  dialogProps?: Omit<DialogProps, "open">;
}

const dialogStyles = (theme: Theme) => ({
  paper: {
    backgroundColor: "#FAFAFA"
  }
});

const CustomizedDialogRaw = (props: Props & WithStyles<typeof dialogStyles>) => {
  const { open, handleClose, title, children, actions, classes, dialogProps } = props;

  return (
    <div>
      <Dialog
        classes={classes}
        onClose={handleClose}
        aria-labelledby="customized-dialog-title"
        open={open}
        maxWidth="md"
        {...dialogProps}>
        {title ? (
          <DialogTitle id="customized-dialog-title" onClose={handleClose}>
            {title}
          </DialogTitle>
        ) : null}

        {children ? <DialogContent>{children}</DialogContent> : null}

        {actions ? <DialogActions>{actions}</DialogActions> : null}
      </Dialog>
    </div>
  );
};

export const CustomizedDialog = withStyles(dialogStyles)(CustomizedDialogRaw);
