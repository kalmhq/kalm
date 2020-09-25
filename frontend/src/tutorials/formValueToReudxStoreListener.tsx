import { setTutorialFormValues } from "actions/tutorial";
import React from "react";
import { FormSpy } from "react-final-form";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { TDispatchProp } from "types";

const mapStateToProps = (state: RootState) => {
  return {
    tutorialDrawerOpen: state.tutorial.drawerOpen,
  };
};

export interface Props extends ReturnType<typeof mapStateToProps>, TDispatchProp {
  form: string;
  values: any;
}

class FormValueToReudxStoreListenerRaw extends React.PureComponent<Props> {
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

const FormValueToReudxStoreListener = connect(mapStateToProps)(FormValueToReudxStoreListenerRaw);

export const FormTutorialHelper = (props: { form: string }) => (
  <FormSpy subscription={{ values: true }}>
    {({ values }) => {
      return <FormValueToReudxStoreListener values={values} form={props.form} />;
    }}
  </FormSpy>
);
