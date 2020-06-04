import Immutable from "immutable";
import React from "react";
import { connect, DispatchProp } from "react-redux";
import { WrappedFieldArrayProps } from "redux-form";
import { Field, FieldArray } from "redux-form/immutable";
import { SharedEnv } from "../../types/application";
import { EnvTypeExternal, EnvTypeLinked, EnvTypeStatic } from "../../types/common";
import { RenderAutoCompleteFreeSolo } from "../Basic/autoComplete";
import { FieldArrayWrapper } from "../Basic/FieldArrayWrapper";
import { RenderSelectField } from "../Basic/select";
import { KRenderTextField } from "../Basic/textfield";
import { ValidatorRequired } from "../validator";

interface FieldArrayComponentHackType {
  name: any;
  component: any;
}

interface FieldArrayProps extends DispatchProp {
  sharedEnv?: Immutable.List<SharedEnv>;
}

interface Props extends WrappedFieldArrayProps<SharedEnv>, FieldArrayComponentHackType, FieldArrayProps {}

class RenderEnvs extends React.PureComponent<Props> {
  private nameAutoCompleteOptions: string[];

  constructor(props: Props) {
    super(props);
    this.nameAutoCompleteOptions = this.generateNameAutoCompleteOptionsFromProps(props);
  }

  private generateNameAutoCompleteOptionsFromProps = (props: Props): string[] => {
    const { sharedEnv, fields } = props;
    if (!sharedEnv) {
      return [];
    }

    const sharedEnvNamesSet = new Set(sharedEnv ? sharedEnv.map(x => x.get("name")).toArray() : []);
    const fieldsEnvNamesSet = new Set<string>();

    fields.forEach((_, index) => {
      const env = fields.get(index);
      fieldsEnvNamesSet.add(env.get("name"));
    });

    return Array.from(sharedEnvNamesSet).filter(x => !fieldsEnvNamesSet.has(x));
  };

  public componentDidUpdate() {
    this.nameAutoCompleteOptions = this.generateNameAutoCompleteOptionsFromProps(this.props);
  }

  public getFieldComponents(member: string) {
    return [
      <Field
        name={`${member}.type`}
        component={RenderSelectField}
        label="Type"
        validate={[ValidatorRequired]}
        options={[
          { value: EnvTypeStatic, text: "Static" },
          { value: EnvTypeExternal, text: "External" },
          { value: EnvTypeLinked, text: "Linked" }
        ]}></Field>,
      <Field
        options={this.nameAutoCompleteOptions}
        name={`${member}.name`}
        label="Name"
        component={RenderAutoCompleteFreeSolo}
        margin
        validate={[ValidatorRequired]}
      />,
      <Field
        name={`${member}.value`}
        label="Value"
        margin
        validate={[ValidatorRequired]}
        component={KRenderTextField}
      />
    ];
  }

  public render() {
    return (
      <FieldArrayWrapper getFieldComponents={(member: string) => this.getFieldComponents(member)} {...this.props} />
    );
  }
}

export const Envs = connect()((props: FieldArrayProps) => {
  return <FieldArray name="env" component={RenderEnvs} {...props} />;
});
