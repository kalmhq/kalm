import { Box, Button, Fade, Grid, Icon } from "@material-ui/core";
import Immutable from "immutable";
import React from "react";
import { connect, DispatchProp } from "react-redux";
import { arrayPush, WrappedFieldArrayProps } from "redux-form";
import { Field, FieldArray } from "redux-form/immutable";
import { DeleteIcon } from "widgets/Icon";
import { IconButtonWithTooltip } from "widgets/IconButtonWithTooltip";
import { EnvItem, SharedEnv } from "types/application";
import { RenderAutoCompleteFreeSolo } from "../Basic/autoComplete";
import { KRenderDebounceTextField } from "../Basic/textfield";
import { ValidatorEnvName, ValidatorRequired } from "../validator";
import { Alert } from "@material-ui/lab";

interface FieldArrayComponentHackType {
  name: any;
  component: any;
  validate: any;
}

interface FieldArrayProps extends DispatchProp {
  sharedEnv?: Immutable.List<SharedEnv>;
}

interface Props extends WrappedFieldArrayProps<SharedEnv>, FieldArrayComponentHackType, FieldArrayProps {}

const nameValidators = [ValidatorRequired, ValidatorEnvName];

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

    const sharedEnvNamesSet = new Set(sharedEnv ? sharedEnv.map((x) => x.get("name")).toArray() : []);
    const fieldsEnvNamesSet = new Set<string>();

    fields.forEach((_, index) => {
      const env = fields.get(index);
      fieldsEnvNamesSet.add(env.get("name"));
    });

    return Array.from(sharedEnvNamesSet).filter((x) => !fieldsEnvNamesSet.has(x));
  };

  public componentDidUpdate() {
    this.nameAutoCompleteOptions = this.generateNameAutoCompleteOptionsFromProps(this.props);
  }

  private renderAddButton = () => {
    const {
      meta: { form },
      dispatch,
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
                  value: "",
                }),
              ),
            )
          }
        >
          New Variable
        </Button>
      </Box>
    );
  };

  public render() {
    const {
      fields,
      meta: { error },
    } = this.props;
    return (
      <>
        {error ? (
          <Box mb={2}>
            <Alert severity="error">{error}</Alert>
          </Box>
        ) : null}
        {fields.map((field, index) => {
          return (
            <Fade in key={field}>
              <Grid container spacing={2}>
                <Grid item xs={5}>
                  <Field
                    options={this.nameAutoCompleteOptions}
                    name={`${field}.name`}
                    label="Name"
                    component={RenderAutoCompleteFreeSolo}
                    margin
                    validate={nameValidators}
                  />
                </Grid>
                <Grid item xs={5}>
                  <Field
                    name={`${field}.value`}
                    label="Value"
                    margin
                    validate={ValidatorRequired}
                    component={KRenderDebounceTextField}
                  />
                </Grid>
                <Grid item xs={2}>
                  <IconButtonWithTooltip
                    tooltipPlacement="top"
                    tooltipTitle="Delete"
                    aria-label="delete"
                    onClick={() => fields.remove(index)}
                  >
                    <DeleteIcon />
                  </IconButtonWithTooltip>
                </Grid>
              </Grid>
            </Fade>
          );
        })}
        {this.renderAddButton()}
      </>
    );
  }
}

const ValidatorEnvs = (values: Immutable.List<EnvItem>, _allValues?: any, _props?: any, _name?: any) => {
  if (!values) return undefined;
  const names = new Set<string>();

  for (let i = 0; i < values.size; i++) {
    const env = values.get(i)!;
    const name = env.get("name");
    if (!names.has(name)) {
      names.add(name);
    } else if (name !== "") {
      return "Env names should be unique.  " + name + "";
    }
  }
};

export const Envs = connect()((props: FieldArrayProps) => {
  return <FieldArray name="env" component={RenderEnvs} validate={ValidatorEnvs} {...props} />;
});
