import React from "react";
import ReactDOM from "react-dom";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  ThemeProvider,
} from "@material-ui/core";
import { theme } from "../theme";

const ConfirmDialog = ({
  message,
  unmount,
  callback,
}: {
  message: string;
  callback: (result: boolean) => void;
  unmount: () => void;
}) => {
  const [open, setOpen] = React.useState(true);

  const handleCloseWithResult = (result: boolean) => {
    setOpen(false);
    callback(result);
  };

  const [title, content] = message.split("|");

  return (
    <Dialog
      open={open}
      onClose={() => handleCloseWithResult(false)}
      onExited={unmount}
      aria-labelledby="responsive-dialog-title"
    >
      <DialogTitle id="responsive-dialog-title">{title}</DialogTitle>
      {!!content && (
        <DialogContent>
          <DialogContentText>{content}</DialogContentText>
        </DialogContent>
      )}
      <DialogActions>
        <Button onClick={() => handleCloseWithResult(false)} variant="contained">
          No, I will stay
        </Button>
        <Button autoFocus onClick={() => handleCloseWithResult(true)} color="primary" variant="contained">
          Yes, I'm leaving
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export const HistoryUserConfirmation = (message: string, callback: (result: boolean) => void) => {
  const node = document.getElementById("history-prompt-anchor");

  const unmount = () => {
    ReactDOM.unmountComponentAtNode(node!);
  };

  ReactDOM.render(
    <ThemeProvider theme={theme}>
      <ConfirmDialog message={message} callback={callback} unmount={unmount} />
    </ThemeProvider>,
    node,
  );
};
