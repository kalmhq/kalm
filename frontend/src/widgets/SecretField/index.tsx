import React from "react";
import { Theme, createStyles, withStyles, IconButton, WithStyles, TextField } from "@material-ui/core";
import VisibilityIcon from "@material-ui/icons/Visibility";
import VisibilityOffIcon from "@material-ui/icons/VisibilityOff";
import FileCopyIcon from "@material-ui/icons/FileCopy";
import { ID } from "../../utils";
import { TDispatch } from "../../types";
import { setSuccessNotificationAction } from "../../actions/notification";

const styles = (theme: Theme) =>
  createStyles({
    sercetField: {
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    },
    hidden: {
      display: "hidden"
    }
  });

interface Props extends WithStyles<typeof styles> {
  dispatch: TDispatch;
  content: string;
}

interface State {
  show: boolean;
}

class SercetFieldRaw extends React.PureComponent<Props, State> {
  private hiddenInputId: string;

  constructor(props: Props) {
    super(props);

    this.state = {
      show: false
    };

    this.hiddenInputId = "SercetField" + ID();
  }

  public render() {
    const { content, classes, dispatch } = this.props;
    const { show } = this.state;

    if (show) {
      return (
        <div className={classes.sercetField}>
          <TextField label="Token" variant="outlined" value={content} id={this.hiddenInputId} />
          <IconButton
            onClick={() => {
              let copyText = document.getElementById(this.hiddenInputId) as HTMLInputElement;

              if (copyText) {
                copyText.select();
                copyText!.setSelectionRange(0, 99999); /*For mobile devices*/

                document.execCommand("copy");

                dispatch(setSuccessNotificationAction("Copied successful!"));
              }
            }}>
            <FileCopyIcon />
          </IconButton>
          <IconButton onClick={() => this.setState({ show: false })}>
            <VisibilityOffIcon />
          </IconButton>
        </div>
      );
    }
    return (
      <div className={classes.sercetField}>
        ******
        <IconButton onClick={() => this.setState({ show: true })}>
          <VisibilityIcon />
        </IconButton>
      </div>
    );
  }
}

export const SercetField = withStyles(styles)(SercetFieldRaw);
