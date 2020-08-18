import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { TDispatchProp } from "types";
import { setTutorialFormValues } from "actions/tutorial";

const mapStateToProps = (state: RootState) => {
  return {
    tutorialDrawerOpen: state.get("tutorial").get("drawerOpen"),
  };
};

export interface Props extends ReturnType<typeof mapStateToProps>, TDispatchProp {
  values: any;
}

class FormMidwareRaw extends React.PureComponent<Props> {
  componentDidMount() {
    const { dispatch, tutorialDrawerOpen, values } = this.props;
    if (tutorialDrawerOpen) {
      dispatch(setTutorialFormValues(values));
    }
  }
  componentDidUpdate(prevProps: Props) {
    const { dispatch, tutorialDrawerOpen, values } = this.props;
    if (tutorialDrawerOpen && prevProps.values !== values) {
      dispatch(setTutorialFormValues(values));
    }
  }

  render() {
    return null;
  }
}

export const FormMidware = connect(mapStateToProps)(FormMidwareRaw);
