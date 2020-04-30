import { MenuItem } from "@material-ui/core";
import Immutable from "immutable";
import React from "react";
import { connect, DispatchProp } from "react-redux";
import { WrappedFieldArrayProps } from "redux-form";
import { Field, FieldArray } from "redux-form/immutable";
import { SharedEnv } from "../../types/application";
import { EnvTypeExternal, EnvTypeLinked, EnvTypeStatic } from "../../types/common";
import { ComponentLikePort } from "../../types/componentTemplate";
import { CustomTextField, RenderAutoCompleteFreeSolo, RenderSelectField } from "../Basic";
import { FieldArrayWrapper } from "../Basic/FieldArrayWrapper";
import { ValidatorRequired } from "../validator";

interface FieldArrayComponentHackType {
  name: any;
  component: any;
}

interface FieldArrayProps extends DispatchProp {
  sharedEnv?: Immutable.List<SharedEnv>;
}

interface Props extends WrappedFieldArrayProps<ComponentLikePort>, FieldArrayComponentHackType, FieldArrayProps {}

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
      <Field name={`${member}.type`} component={RenderSelectField} label="Type" validate={[ValidatorRequired]}>
        <MenuItem value={EnvTypeStatic}>Static</MenuItem>
        <MenuItem value={EnvTypeExternal}>External</MenuItem>
        <MenuItem value={EnvTypeLinked}>Linked</MenuItem>
      </Field>,
      <Field
        options={this.nameAutoCompleteOptions}
        name={`${member}.name`}
        label="Name"
        component={RenderAutoCompleteFreeSolo}
        margin
        validate={[ValidatorRequired]}
      />,
      <CustomTextField name={`${member}.value`} label="Value" margin validate={[ValidatorRequired]} />
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

export const Envs = connect()((props: FieldArrayProps) => {
  return <FieldArray name="env" component={RenderEnvs} {...props} />;
});
