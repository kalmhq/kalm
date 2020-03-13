import { useSnackbar } from "notistack";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "../../reducers";

const mapStateToProps = (state: RootState) => {
  return {
    message: state.get("notification")
  };
};

interface Props extends ReturnType<typeof mapStateToProps> {}

const NotificationRaw = ({ message }: Props) => {
  const { enqueueSnackbar } = useSnackbar();
  // window.debug = enqueueSnackbar;

  React.useEffect(() => {
    if (!message.get("message")) {
      return;
    }

    enqueueSnackbar(message.get("message"), {
      variant: message.get("variant")
    });
  }, [enqueueSnackbar, message]);

  return null;
};

export const NotificationComponent = connect(mapStateToProps)(NotificationRaw);
