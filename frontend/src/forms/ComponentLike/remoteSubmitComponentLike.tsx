import React from "react";
import { connect } from "react-redux";
import { submit } from "redux-form";
import { TDispatch } from "../../types";
import { Button } from "@material-ui/core";

const RemoteSubmitComponentLike = ({ dispatch }: { dispatch: TDispatch }) => (
  <Button variant="contained" color="primary" onClick={() => dispatch(submit("componentLike"))}>
    Save
  </Button>
);

export default connect()(RemoteSubmitComponentLike);
