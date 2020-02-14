import React from "react";
import { BasePage } from "../BasePage";
import ConfigForm from "../../forms/Config";
import { ConfigFormValues, Actions } from "../../actions";
import { connect, DispatchProp } from "react-redux";
import { createConfigAction } from "../../actions/config";
import { ThunkDispatch } from "redux-thunk";
import { RootState } from "../../reducers";
import { push } from "connected-react-router";

interface Props {
  dispatch: ThunkDispatch<RootState, undefined, Actions>;
}

class ConfigNew extends React.PureComponent<Props> {
  private submit = async (configFormValues: ConfigFormValues) => {
    const { dispatch } = this.props;
    await dispatch(createConfigAction(configFormValues));
    await dispatch(push("/components"));
  };

  public render() {
    return <BasePage title="New Config"></BasePage>;
  }
}

export default connect()(ConfigNew);
