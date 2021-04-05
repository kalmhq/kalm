import { Box, Grid } from "@material-ui/core";
import { FinalSelectField } from "forms/Final/select";
import { FinalTextField } from "forms/Final/textfield";
import React from "react";
import { Field } from "react-final-form";
import { FieldArray } from "react-final-form-arrays";
import { HttpRouteCondition } from "types/route";
import { AddButton } from "widgets/Button";
import { DeleteIcon } from "widgets/Icon";
import { IconButtonWithTooltip } from "widgets/IconButtonWithTooltip";
import { ValidatorRequired } from "../validator";

export const RenderHttpRouteConditions: React.FC = () => {
  //helper method to create an entry in the rules field
  const createField = (t: string) => ({
    type: t,
    operator: "equal",
    name: "",
    value: "",
  });

  return (
    <FieldArray<HttpRouteCondition, any>
      name="conditions"
      render={({ fields }) => (
        <div>
          <Box display="flex">
            <Box mt={2} mr={2} mb={2}>
              <AddButton
                onClick={() => {
                  fields.push(createField("header"));
                }}
              >
                Add Header Rule
              </AddButton>
            </Box>
            <Box mt={2} mr={2} mb={2}>
              <AddButton
                onClick={() => {
                  fields.push(createField("query"));
                }}
              >
                Add Query Rule
              </AddButton>
            </Box>
          </Box>
          {fields.value &&
            fields.value.map((condition, index) => (
              <Grid container spacing={1} key={index}>
                <Grid item md={2}>
                  <div style={{ padding: "12px 0" }}>{condition.type} Rule</div>
                </Grid>
                <Grid item md={2}>
                  <Field
                    name={`conditions.${index}.name`}
                    component={FinalTextField}
                    label="Name"
                    validate={ValidatorRequired}
                  />
                </Grid>
                <Grid item md={2}>
                  <Field
                    name={`conditions.${index}.operator`}
                    component={FinalSelectField}
                    label="operator"
                    options={[
                      { value: "equal", text: "Equal" },
                      { value: "withPrefix", text: "With Prefix" },
                      { value: "matchRegexp", text: "Match Regexp" },
                    ]}
                  ></Field>
                </Grid>
                <Grid item md={2}>
                  <Field
                    name={`conditions.${index}.value`}
                    component={FinalTextField}
                    label="Value"
                    validate={ValidatorRequired}
                  />
                </Grid>
                <Grid item md={2}>
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
            ))}
        </div>
      )}
    />
  );
};
