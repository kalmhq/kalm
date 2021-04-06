import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core/";
import Dialog, { DialogProps } from "@material-ui/core/Dialog";
import MuiDialogActions from "@material-ui/core/DialogActions";
import MuiDialogContent from "@material-ui/core/DialogContent";
import MuiDialogTitle from "@material-ui/core/DialogTitle";
import IconButton from "@material-ui/core/IconButton";
import Typography from "@material-ui/core/Typography";
import CloseIcon from "@material-ui/icons/Close";
import { clearDialogAction, closeDialogAction, destroyDialogAction, initDialogAction } from "actions/dialog";
import { RootState } from "configureStore";
import React from "react";
import { connect, DispatchProp } from "react-redux";
import ScrollContainer from "widgets/ScrollContainer";

const styles = (theme: Theme) =>
  createStyles({
    root: {
      margin: 0,
      padding: theme.spacing(2),
    },
    closeButton: {
      position: "absolute",
      right: theme.spacing(1),
      top: theme.spacing(1),
      color: theme.palette.grey[500],
    },
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
    padding: theme.spacing(2),
  },
}))(MuiDialogContent);

const DialogActions = withStyles((theme: Theme) => ({
  root: {
    margin: 0,
    padding: theme.spacing(1),
  },
}))(MuiDialogActions);

interface OwnProps {
  dialogID: string;
}

const dialogStyles = (theme: Theme) => ({
  paper: {
    // backgroundColor: "#FAFAFA",
    // minHeight: "80vh"
  },
});

const mapStateToProps = (state: RootState, ownProps: OwnProps) => {
  const { dialogID } = ownProps;
  const dialog = state.dialogs[dialogID];
  const open = !!dialog && (dialog.open || false);

  return { dialogID, open };
};

interface Props extends DispatchProp, OwnProps, ReturnType<typeof mapStateToProps> {
  title?: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  dialogProps?: Omit<DialogProps, "open">;
  closeCallback?: any;
}

class ControlledDialogRaw extends React.PureComponent<Props & WithStyles<typeof dialogStyles>> {
  public componentDidMount() {
    const { dispatch, dialogID } = this.props;
    dispatch(initDialogAction(dialogID));
  }

  public componentWillUnmount() {
    const { dispatch, dialogID } = this.props;
    dispatch(destroyDialogAction(dialogID));
  }

  private handleClose = () => {
    const { dispatch, dialogID, closeCallback } = this.props;
    if (closeCallback) {
      closeCallback();
    }
    dispatch(closeDialogAction(dialogID));
  };

  private handleClear = () => {
    const { dispatch, dialogID } = this.props;
    dispatch(clearDialogAction(dialogID));
  };

  public render() {
    const { dialogID, open, classes, dialogProps, title, actions, children } = this.props;

    return (
      <div>
        <Dialog
          transitionDuration={500}
          key={`Conrolled-Dialog-${dialogID}`}
          classes={classes}
          onClose={this.handleClose}
          aria-labelledby="customized-dialog-title"
          open={open}
          onExited={this.handleClear}
          maxWidth="md"
          {...dialogProps}
        >
          {title ? (
            <DialogTitle id="customized-dialog-title" onClose={this.handleClose}>
              {title}
            </DialogTitle>
          ) : null}

          {children ? (
            <ScrollContainer>
              <DialogContent>{children}</DialogContent>
            </ScrollContainer>
          ) : null}

          {actions ? <DialogActions>{actions}</DialogActions> : null}
        </Dialog>
      </div>
    );
  }
}

export const ControlledDialog = withStyles(dialogStyles)(connect(mapStateToProps)(ControlledDialogRaw));
