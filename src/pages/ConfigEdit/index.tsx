import React from "react";
import { BasePage } from "../BasePage";
import ConfigForm from "../../forms/Config";
import { ConfigFormValues, Actions } from "../../actions";
import { connect, DispatchProp } from "react-redux";
import { updateConfigAction } from "../../actions/config";
import { ThunkDispatch } from "redux-thunk";
import { RootState } from "../../reducers";
import { push } from "connected-react-router";
import { match } from "react-router-dom";

const mapStateToProps = (
  state: RootState,
  ownProps: { match: match<{ configId: string }> }
) => {};

type StateProps = ReturnType<typeof mapStateToProps>;

interface Props {
  dispatch: ThunkDispatch<RootState, undefined, Actions>;
}

class ConfigEdit extends React.PureComponent<Props> {
  // private submit = async (configFormValues: ConfigFormValues) => {
  //   const { dispatch, configId } = this.props;
  //   await dispatch(updateConfigAction(configId, configFormValues));
  //   await dispatch(push("/configs"));
  // };

  public render() {
    return (
      <BasePage title={`Edit Config {config.name}`}>
        {/* <ConfigForm onSubmit={this.submit} initialValues={config} /> */}
      </BasePage>
    );
  }
}

export default connect(mapStateToProps)(ConfigEdit);
