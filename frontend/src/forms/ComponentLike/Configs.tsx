import React from "react";
import { connect, DispatchProp } from "react-redux";
import { WrappedFieldArrayProps } from "redux-form";
import { Field, FieldArray } from "redux-form/immutable";
import { ConfigMount } from "../../types/componentTemplate";
import { KRenderTextField } from "../Basic/textfield";
import { FieldArrayWrapper } from "../Basic/FieldArrayWrapper";
import { NormalizePort } from "../normalizer";
import { ValidatorRequired } from "../validator";
import { RenderConfigField } from "./Config";

interface FieldArrayComponentHackType {
  name: any;
  component: any;
}

interface FieldArrayProps extends DispatchProp {}

interface Props extends WrappedFieldArrayProps<ConfigMount>, FieldArrayComponentHackType, FieldArrayProps {}

class RenderConfigs extends React.PureComponent<Props> {
  public getFieldComponents(member: string) {
    return [
      <Field name={`${member}.paths`} component={RenderConfigField} label="Paths" validate={[ValidatorRequired]} />,
      <Field
        name={`${member}.mountPath`}
        label="Mount Path"
        margin
        validate={[ValidatorRequired]}
        normalize={NormalizePort}
        component={KRenderTextField}
      />,
    ];
  }

  public render() {
    return (
      <FieldArrayWrapper
        getFieldComponents={(member: string) => this.getFieldComponents(member)}
        // onAdd={() => this.props.fields.push(Immutable.Map({}))}
        {...this.props}
      />
    );
  }
}

export const Configs = connect()((props: FieldArrayProps) => {
  return <FieldArray name="configs" component={RenderConfigs} {...props} />;
});
