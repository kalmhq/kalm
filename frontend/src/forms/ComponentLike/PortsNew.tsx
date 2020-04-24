import { MenuItem } from "@material-ui/core";
import React from "react";
import { connect, DispatchProp } from "react-redux";
import { WrappedFieldArrayProps } from "redux-form";
import { FieldArray, Field } from "redux-form/immutable";
import { NormalizePort } from "../normalizer";
import { ComponentLikePort } from "../../types/componentTemplate";
import { portTypeUDP, portTypeTCP } from "../../types/common";
import { CustomTextField, RenderSelectField } from "../Basic";
import { ValidatorRequired } from "../validator";
import { FieldArrayWrapper } from "../Basic/FieldArrayWrapper";

interface FieldArrayComponentHackType {
  name: any;
  component: any;
}

interface FieldArrayProps extends DispatchProp {}

interface Props extends WrappedFieldArrayProps<ComponentLikePort>, FieldArrayComponentHackType, FieldArrayProps {}

class RenderPorts extends React.PureComponent<Props> {
  public getFieldComponents(member: string) {
    return [
      <CustomTextField name={`${member}.name`} label="Name" margin validate={[ValidatorRequired]} />,
      <Field name={`${member}.protocol`} component={RenderSelectField} label="Protocol" validate={[ValidatorRequired]}>
        <MenuItem value={portTypeUDP}>{portTypeUDP}</MenuItem>
        <MenuItem value={portTypeTCP}>{portTypeTCP}</MenuItem>
      </Field>,
      <CustomTextField
        name={`${member}.containerPort`}
        label="ContainerPort"
        margin
        validate={[ValidatorRequired]}
        normalize={NormalizePort}
      />,
      <CustomTextField
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
