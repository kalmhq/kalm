import { MenuItem, Button, Icon, Grid } from "@material-ui/core";
import Immutable from "immutable";
import React from "react";
import { connect, DispatchProp } from "react-redux";
import { WrappedFieldArrayProps, arrayPush } from "redux-form";
import { Field, FieldArray } from "redux-form/immutable";
import { EnvTypeExternal, EnvTypeLinked, EnvTypeStatic } from "../../types/common";
import { RenderAutoCompleteFreeSolo } from "../Basic/autoComplete";
import { FieldArrayWrapper } from "../Basic/FieldArrayWrapper";
import { ValidatorRequired } from "../validator";
import { SharedEnv } from "../../types/application";
import { RenderSelectField } from "../Basic/select";
import { KRenderTextField } from "../Basic/textfield";
import { IconButtonWithTooltip } from "widgets/IconButtonWithTooltip";
import { DeleteIcon } from "widgets/Icon";

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

  private renderAddButton = () => {
    const {
      meta: { form },
      dispatch
    } = this.props;
    return (
      <Button
        variant="outlined"
        color="primary"
        startIcon={<Icon>add</Icon>}
        size="small"
        onClick={() =>
          dispatch(
            arrayPush(
              form,
              "env",
              Immutable.Map({
                type: "static",
                name: "",
                value: ""
              })
            )
          )
        }>
        Add
      </Button>
    );
  };

  public render() {
    const { fields } = this.props;
    return (
      <>
        {this.renderAddButton()}
        {fields.map((field, index) => {
          return (
            <Grid container spacing={2}>
              <Grid item xs={3}>
                <Field
                  options={this.nameAutoCompleteOptions}
                  name={`${field}.name`}
                  label="Name"
                  component={RenderAutoCompleteFreeSolo}
                  margin
                  validate={[ValidatorRequired]}
                />
              </Grid>
              <Grid item xs={3}>
                <Field
                  name={`${field}.value`}
                  label="Value"
                  margin
                  validate={[ValidatorRequired]}
                  component={KRenderTextField}
                />
              </Grid>
              <Grid item xs={3}>
                <IconButtonWithTooltip
                  tooltipPlacement="top"
                  tooltipTitle="Delete"
                  aria-label="delete"
                  onClick={() => fields.remove(index)}>
                  <DeleteIcon />
                </IconButtonWithTooltip>
              </Grid>
            </Grid>
          );
        })}
      </>
    );
  }
}

export const Envs = connect()((props: FieldArrayProps) => {
  return <FieldArray name="env" component={RenderEnvs} {...props} />;
});
