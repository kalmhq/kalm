import { Button, Grid, Icon, Box, Fade } from "@material-ui/core";
import Immutable from "immutable";
import React from "react";
import { connect, DispatchProp } from "react-redux";
import { arrayPush, WrappedFieldArrayProps } from "redux-form";
import { Field, FieldArray } from "redux-form/immutable";
import { DeleteIcon } from "widgets/Icon";
import { IconButtonWithTooltip } from "widgets/IconButtonWithTooltip";
import { SharedEnv } from "../../types/application";
import { RenderAutoCompleteFreeSolo } from "../Basic/autoComplete";
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

  private renderAddButton = () => {
    const {
      meta: { form },
      dispatch
    } = this.props;
    return (
      <Box mb={2}>
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
      </Box>
    );
  };

  public render() {
    const { fields } = this.props;
    return (
      <>
        {this.renderAddButton()}
        {fields.map((field, index) => {
          return (
            <Fade in>
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
            </Fade>
          );
        })}
      </>
    );
  }
}

export const Envs = connect()((props: FieldArrayProps) => {
  return <FieldArray name="env" component={RenderEnvs} {...props} />;
});
