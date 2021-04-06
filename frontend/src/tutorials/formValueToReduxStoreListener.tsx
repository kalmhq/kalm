import { setTutorialFormValues } from "actions/tutorial";
import React from "react";
import { FormSpy } from "react-final-form";
import { connect } from "react-redux";
import { RootState } from "store";
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

class FormValueToReduxStoreListenerRaw extends React.PureComponent<Props> {
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

const FormValueToReduxStoreListener = connect(mapStateToProps)(FormValueToReduxStoreListenerRaw);

export const FormTutorialHelper = (props: { form: string }) => (
  <FormSpy subscription={{ values: true }}>
    {({ values }) => {
      return <FormValueToReduxStoreListener values={values} form={props.form} />;
    }}
  </FormSpy>
);
