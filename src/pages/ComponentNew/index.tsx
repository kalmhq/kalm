import React from "react";
import { BasePage } from "../BasePage";
import ComponentForm from "../../forms/Component";
import { ComponentFormValues, Actions } from "../../actions";
import { connect, DispatchProp } from "react-redux";
import { createComponentAction } from "../../actions/component";
import { ThunkDispatch } from "redux-thunk";
import { RootState } from "../../reducers";
import { push } from "connected-react-router";

interface Props {
  dispatch: ThunkDispatch<RootState, undefined, Actions>;
}

class ComponentNew extends React.PureComponent<Props> {
  private submit = async (componentFormValues: ComponentFormValues) => {
    const { dispatch } = this.props;
    await dispatch(createComponentAction(componentFormValues));
    await dispatch(push("/components"));
  };

  public render() {
    return (
      <BasePage title="New Component">
        <ComponentForm onSubmit={this.submit} />
      </BasePage>
    );
  }
}

export default connect()(ComponentNew);
