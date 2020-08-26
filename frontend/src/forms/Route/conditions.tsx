import { Box, Button, Grid } from "@material-ui/core";
import { Field, FieldArray } from "formik";
import React from "react";
import { HttpRouteConditionContent } from "types/route";
import { AddIcon, DeleteIcon } from "widgets/Icon";
import { IconButtonWithTooltip } from "widgets/IconButtonWithTooltip";
import { RenderFormikSelectField } from "../Basic/select";
import { KRenderFormikTextField } from "../Basic/textfield";
import { ValidatorRequired } from "../validator";

export interface Props {
  conditions?: HttpRouteConditionContent[];
}

export class RenderHttpRouteConditions extends React.PureComponent<Props> {
  public render() {
    const { conditions } = this.props;

    return (
      <FieldArray
        name="conditions"
        render={(arrayHelpers) => (
          <div>
            <Box display="flex">
              <Box mt={2} mr={2} mb={2}>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<AddIcon />}
                  size="small"
                  onClick={() => {
                    arrayHelpers.push({
                      type: "header",
                      operator: "equal",
                      name: "",
                      value: "",
                    });
                  }}
                >
                  Add Header Rule
                </Button>
              </Box>
              <Box mt={2} mr={2} mb={2}>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<AddIcon />}
                  size="small"
                  onClick={() => {
                    arrayHelpers.push({
                      type: "query",
                      operator: "equal",
                      name: "",
                      value: "",
                    });
                  }}
                >
                  Add Query Rule
                </Button>
              </Box>
            </Box>
            {conditions &&
              conditions.map((condition, index) => (
                <Grid container spacing={1} key={index}>
                  <Grid item md={2}>
                    <div style={{ padding: "12px 0" }}>{condition.type} Rule</div>
                  </Grid>
                  <Grid item md={2}>
                    <Field
                      name={`conditions.${index}.name`}
                      component={KRenderFormikTextField}
                      label="Name"
                      validate={ValidatorRequired}
                    />
                  </Grid>
                  <Grid item md={2}>
                    <Field
                      name={`conditions.${index}.operator`}
                      component={RenderFormikSelectField}
                      label="operator"
                      validate={ValidatorRequired}
                      options={[
                        { value: "equal", text: "Equal" },
                        { value: "withPrifix", text: "With Prifix" },
                        { value: "matchRegexp", text: "Match Regexp" },
                      ]}
                    ></Field>
                  </Grid>
                  <Grid item md={2}>
                    <Field
                      name={`conditions.${index}.value`}
                      component={KRenderFormikTextField}
                      label="Value"
                      validate={ValidatorRequired}
                    />
                  </Grid>
                  <Grid item md={2}>
                    <IconButtonWithTooltip
                      tooltipPlacement="top"
                      tooltipTitle="Delete"
                      aria-label="delete"
                      onClick={() => arrayHelpers.remove(index)}
                    >
                      <DeleteIcon />
                    </IconButtonWithTooltip>
                  </Grid>
                </Grid>
              ))}
          </div>
        )}
      />
    );
  }
}
