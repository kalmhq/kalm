import React from "react";
import { connect, DispatchProp } from "react-redux";
import { WrappedFieldArrayProps } from "redux-form";
import { Field, FieldArray } from "redux-form/immutable";
import { getApplicationEnvStatus, getCurrentFormApplication } from "../../selectors/application";
import { SharedEnv } from "../../types/application";
import { RenderAutoCompleteFreeSolo } from "../Basic/autoComplete";
import { FieldArrayWrapper } from "../Basic/FieldArrayWrapper";
import { ValidatorRequired } from "../validator";
import { KRenderTextField } from "../Basic/textfield";

const mapStateToProps = () => {
  const application = getCurrentFormApplication();
  const envStatus = getApplicationEnvStatus(application);
  return { envStatus };
};

interface FieldArrayComponentHackType {
  name: any;
  component: any;
}

interface FieldArrayProps extends DispatchProp, ReturnType<typeof mapStateToProps> {}

interface Props extends WrappedFieldArrayProps<SharedEnv>, FieldArrayComponentHackType, FieldArrayProps {}

class RenderSharedEnvs extends React.PureComponent<Props> {
  private nameAutoCompleteOptions: string[];

  constructor(props: Props) {
    super(props);

    this.nameAutoCompleteOptions = this.generateNameAutoCompleteOptionsFromProps(props);
  }

  private generateNameAutoCompleteOptionsFromProps = (props: Props): string[] => {
    return Array.from(props.envStatus.notDefinedSharedEnvsSet);
  };

  public componentDidUpdate() {
    this.nameAutoCompleteOptions = this.generateNameAutoCompleteOptionsFromProps(this.props);
  }

  public getFieldComponents(member: string) {
    return [
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

export const SharedEnvs = connect(mapStateToProps)((props: FieldArrayProps) => {
  return <FieldArray name="sharedEnvs" component={RenderSharedEnvs} {...props} />;
});
