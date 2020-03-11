import React from "react";
import { connect } from "react-redux";
import { submit } from "redux-form";
import { DispatchType } from "../../types";
import { Button } from "@material-ui/core";

const RemoteSubmitApplication = ({ dispatch }: { dispatch: DispatchType }) => (
  <Button variant="contained" color="primary" onClick={() => dispatch(submit("application"))}>
    Save
  </Button>
);

export default connect()(RemoteSubmitApplication);
