import React from "react";
import { RootState } from "../../reducers";
import { connect, DispatchProp } from "react-redux";
import { loadComponentTemplatesAction } from "../../actions/component";
import { ThunkDispatch } from "redux-thunk";
import { Actions } from "../../actions";

const mapStateToProps = (state: RootState) => {
  const componentTemplatesState = state.get("components");
  return {
    components: componentTemplatesState.get("components").toList(),
    isLoading: componentTemplatesState.get("isListLoading"),
    isFirstLoaded: componentTemplatesState.get("isListFirstLoaded")
  };
};

export interface WithComponentTemplatesDataProps
  extends ReturnType<typeof mapStateToProps> {
  dispatch: ThunkDispatch<RootState, undefined, Actions>;
}

export const ComponentTemplateDataWrapper = (
  WrappedComponent: React.ComponentType<any>
) => {
  const WithComponentTemplatesData: React.ComponentType<WithComponentTemplatesDataProps> = class extends React.Component<
    WithComponentTemplatesDataProps
  > {
    componentDidMount() {
      this.props.dispatch(loadComponentTemplatesAction());
    }

    render() {
      return <WrappedComponent {...this.props} />;
    }
  };

  WithComponentTemplatesData.displayName = `WithComponentTemplatesData(${getDisplayName(
    WrappedComponent
  )})`;

  return connect(mapStateToProps)(WithComponentTemplatesData);
};

function getDisplayName(WrappedComponent: React.ComponentType) {
  return WrappedComponent.displayName || WrappedComponent.name || "Component";
}
