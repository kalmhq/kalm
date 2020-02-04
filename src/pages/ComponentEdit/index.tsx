import React from "react";
import { BasePage } from "../BasePage";
import ComponentForm from "../../forms/Component";
import { ComponentFormValues, Actions } from "../../actions";
import { connect, DispatchProp } from "react-redux";
import { updateComponentAction } from "../../actions/component";
import { ThunkDispatch } from "redux-thunk";
import { RootState } from "../../reducers";
import { push } from "connected-react-router";
import { match } from "react-router-dom";

const mapStateToProps = (
  state: RootState,
  ownProps: { match: match<{ componentId: string }> }
) => {
  const componentId = ownProps.match.params.componentId;
  const component = state.components.get("components").get(componentId);

  return { componentId, component };
};

type StateProps = ReturnType<typeof mapStateToProps>;

interface Props extends StateProps {
  dispatch: ThunkDispatch<RootState, undefined, Actions>;
}

class ComponentEdit extends React.PureComponent<Props> {
  private submit = async (componentFormValues: ComponentFormValues) => {
    const { dispatch, componentId } = this.props;
    await dispatch(updateComponentAction(componentId, componentFormValues));
    await dispatch(push("/components"));
  };

  public render() {
    const { component } = this.props;
    return (
      <BasePage title={`Edit Component {component.name}`}>
        <ComponentForm onSubmit={this.submit} initialValues={component} />
      </BasePage>
    );
  }
}

export default connect(mapStateToProps)(ComponentEdit);
