import { Box, Button, Fade, Grid } from "@material-ui/core";
import { FastField, FieldArray, FieldArrayRenderProps, getIn } from "formik";
import React from "react";
import { ComponentLikeEnv } from "types/componentTemplate";
import { AddIcon, DeleteIcon } from "widgets/Icon";
import { IconButtonWithTooltip } from "widgets/IconButtonWithTooltip";
import { ValidatorEnvName, ValidatorRequired } from "../validator";
import { KRenderDebounceFormikTextField } from "forms/Basic/textfield";

interface Props extends FieldArrayRenderProps {}

const nameValidators = (value: any) => {
  return ValidatorRequired(value) || ValidatorEnvName(value);
};

class RenderEnvs extends React.PureComponent<Props> {
  private renderAddButton = () => {
    const { push } = this.props;
    const handlePush = () => push({ type: "static", name: "", value: "" });
    return (
      <Box mb={2}>
        <Button variant="outlined" color="primary" startIcon={<AddIcon />} size="small" onClick={handlePush}>
          New Variable
        </Button>
      </Box>
    );
  };

  public render() {
    const {
      name,
      form: { values },
      remove,
    } = this.props;
    return (
      <>
        {/* {getIn(errors, name) ? (
          <Box mb={2}>
            <Alert severity="error">{getIn(errors, name)}</Alert>
          </Box>
        ) : null} */}
        {getIn(values, name) &&
          getIn(values, name).map((env: ComponentLikeEnv, index: number) => {
            const handleRemove = () => remove(index);
            return (
              <Fade in key={index}>
                <Grid container spacing={2}>
                  <Grid item xs={5}>
                    <FastField
                      name={`${name}.${index}.name`}
                      label="Name"
                      component={KRenderDebounceFormikTextField}
                      validate={nameValidators}
                    />
                  </Grid>
                  <Grid item xs={5}>
                    <FastField
                      name={`${name}.${index}.value`}
                      label="Value"
                      validate={ValidatorRequired}
                      component={KRenderDebounceFormikTextField}
                    />
                  </Grid>
                  <Grid item xs={2}>
                    <IconButtonWithTooltip
                      tooltipPlacement="top"
                      tooltipTitle="Delete"
                      aria-label="delete"
                      onClick={handleRemove}
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

// const ValidatorEnvs = (values: EnvItem[]) => {
//   if (!values) return undefined;
//   const names = new Set<string>();

//   for (let i = 0; i < values.length; i++) {
//     const env = values[i]!;
//     const name = env.name;
//     if (!names.has(name)) {
//       names.add(name);
//     } else if (name !== "") {
//       return "Env names should be unique.  " + name + "";
//     }
//   }
// };

export const Envs = (props: any) => {
  return <FieldArray name="env" component={RenderEnvs} {...props} />;
};
