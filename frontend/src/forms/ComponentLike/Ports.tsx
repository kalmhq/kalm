import { MenuItem } from "@material-ui/core";
import React from "react";
import { connect, DispatchProp } from "react-redux";
import { WrappedFieldArrayProps } from "redux-form";
import { Field, FieldArray } from "redux-form/immutable";
import { portTypeTCP, portTypeUDP } from "../../types/common";
import { ComponentLikePort } from "../../types/componentTemplate";
import { FieldArrayWrapper } from "../Basic/FieldArrayWrapper";
import { RenderSelectField } from "../Basic/select";
import { KRenderTextField } from "../Basic/textfield";
import { NormalizePort } from "../normalizer";
import { ValidatorRequired } from "../validator";

interface FieldArrayComponentHackType {
  name: any;
  component: any;
}

interface FieldArrayProps extends DispatchProp {}

interface Props extends WrappedFieldArrayProps<ComponentLikePort>, FieldArrayComponentHackType, FieldArrayProps {}

class RenderPorts extends React.PureComponent<Props> {
  public getFieldComponents(member: string) {
    return [
      <Field component={KRenderTextField} name={`${member}.name`} label="Name" margin validate={[ValidatorRequired]} />,
      <Field
        name={`${member}.protocol`}
        component={RenderSelectField}
        label="Protocol"
        validate={[ValidatorRequired]}
        options={[
          { value: portTypeTCP, text: portTypeTCP },
          { value: portTypeUDP, text: portTypeUDP }
        ]}>
        <MenuItem value={portTypeUDP}>{portTypeUDP}</MenuItem>
        <MenuItem value={portTypeTCP}>{portTypeTCP}</MenuItem>
      </Field>,
      <Field
        component={KRenderTextField}
        name={`${member}.containerPort`}
        label="ContainerPort"
        margin
        validate={[ValidatorRequired]}
        normalize={NormalizePort}
      />,
      <Field
        component={KRenderTextField}
        name={`${member}.servicePort`}
        label="ServicePort"
        margin
        validate={[ValidatorRequired]}
        normalize={NormalizePort}
      />
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

export const Ports = connect()((props: FieldArrayProps) => {
  return <FieldArray name="ports" component={RenderPorts} {...props} />;
});
