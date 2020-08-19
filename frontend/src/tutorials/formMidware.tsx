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
  form: string;
  values: any;
}

class FormMidwareRaw extends React.PureComponent<Props> {
  componentDidMount() {
    const { dispatch, tutorialDrawerOpen, values, form } = this.props;
    if (tutorialDrawerOpen) {
      dispatch(setTutorialFormValues(form, values));
    }
  }
  componentDidUpdate(prevProps: Props) {
    const { dispatch, tutorialDrawerOpen, values, form } = this.props;
    if (tutorialDrawerOpen && prevProps.values !== values) {
      dispatch(setTutorialFormValues(form, values));
    }
  }

  render() {
    return null;
  }
}

export const FormMidware = connect(mapStateToProps)(FormMidwareRaw);
