import React from "react";
import { connect } from "react-redux";
import { submit } from "redux-form";
import { TDispatch } from "../../types";
import { CustomizedButton } from "../../widgets/Button";
import { RootState } from "../../reducers";

const mapStateToProps = (state: RootState) => {
  return { isSubmittingApplication: state.get("applications").get("isSubmittingApplication") };
};

const RemoteSubmitApplication = ({
  dispatch,
  isSubmittingApplication
}: {
  dispatch: TDispatch;
  isSubmittingApplication: boolean;
}) => (
  <CustomizedButton
    variant="contained"
    color="primary"
    pending={isSubmittingApplication}
    onClick={() => dispatch(submit("application"))}>
    Save
  </CustomizedButton>
);

export default connect(mapStateToProps)(RemoteSubmitApplication);
