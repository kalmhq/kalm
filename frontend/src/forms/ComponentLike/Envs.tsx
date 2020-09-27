import { Box, Button, Fade, Grid } from "@material-ui/core";
import { Field } from "react-final-form";
import { FieldArray, FieldArrayRenderProps } from "react-final-form-arrays";
import React from "react";
import { ComponentLikeEnv } from "types/componentTemplate";
import { AddIcon, DeleteIcon } from "widgets/Icon";
import { IconButtonWithTooltip } from "widgets/IconButtonWithTooltip";
import { ValidatorEnvName, ValidatorStringRequired } from "../validator";
import { FinalTextField } from "forms/Final/textfield";
import { EnvItem } from "types/application";
import Alert from "@material-ui/lab/Alert";
import { trimParse } from "forms/normalizer";

interface Props extends FieldArrayRenderProps<ComponentLikeEnv, any> {}

class RenderEnvs extends React.PureComponent<Props> {
  private handlePush() {
    this.props.fields.push({ type: "static", name: "", value: "" });
  }

  private handleRemove(index: number) {
    this.props.fields.remove(index);
  }

  private renderAddButton = () => {
    return (
      <Box mb={2} mt={2}>
        <Button
          variant="outlined"
          color="primary"
          startIcon={<AddIcon />}
          size="small"
          onClick={this.handlePush.bind(this)}
        >
          New Variable
        </Button>
      </Box>
    );
  };

  public render() {
    const {
      fields,
      meta: { touched, error },
    } = this.props;
    const name = fields.name;
    return (
      <>
        {touched && error ? (
          <Box mb={2}>
            <Alert severity="error">{error}</Alert>
          </Box>
        ) : null}
        {fields.value &&
          fields.value.map((env: ComponentLikeEnv, index: number) => {
            return (
              <Fade in key={index}>
                <Grid container spacing={2}>
                  <Grid item xs={5}>
                    <Field
                      name={`${name}.${index}.name`}
                      label="Name"
                      component={FinalTextField}
                      validate={ValidatorEnvName}
                      parse={trimParse}
                    />
                  </Grid>
                  <Grid item xs={5}>
                    <Field
                      name={`${name}.${index}.value`}
                      label="Value"
                      validate={ValidatorStringRequired}
                      component={FinalTextField}
                    />
                  </Grid>
                  <Grid item xs={2}>
                    <IconButtonWithTooltip
                      tooltipPlacement="top"
                      tooltipTitle="Delete"
                      aria-label="delete"
                      onClick={this.handleRemove.bind(this, index)}
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

const ValidatorEnvs = (values: EnvItem[]) => {
  if (!values) return undefined;
  const names = new Set<string>();

  for (let i = 0; i < values.length; i++) {
    const env = values[i]!;
    const name = env.name;
    if (!names.has(name)) {
      names.add(name);
    } else if (name !== "") {
      return "Env names should be unique.  " + name + "";
    }
  }
};

export const Envs = () => {
  return <FieldArray name="env" component={RenderEnvs} validate={ValidatorEnvs} />;
};
