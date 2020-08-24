import { Grid } from "@material-ui/core";
import { Field } from "formik";
import { ImmutableFieldArray } from "forms/Basic/kFieldArray";
import Immutable from "immutable";
import React from "react";
import { HttpRouteCondition } from "types/route";
import { DeleteIcon } from "widgets/Icon";
import { IconButtonWithTooltip } from "widgets/IconButtonWithTooltip";
import { RenderSelectField } from "../Basic/select";
import { KRenderDebounceTextField } from "../Basic/textfield";
import { ValidatorRequired } from "../validator";

export interface Props {
  conditions?: Immutable.List<HttpRouteCondition>;
}

export class RenderHttpRouteConditions extends React.PureComponent<Props> {
  public render() {
    const { conditions } = this.props;

    return (
      <ImmutableFieldArray
        name="conditions"
        render={(arrayHelpers) => (
          <div>
            {conditions &&
              conditions.map((condition, index) => (
                <Grid container spacing={1} key={index}>
                  <Grid item md={2}>
                    <div style={{ padding: "12px 0" }}>{condition.get("type")} Rule</div>
                  </Grid>
                  <Grid item md={2}>
                    <Field
                      name={`conditions.${index}.name`}
                      component={KRenderDebounceTextField}
                      label="Name"
                      validate={ValidatorRequired}
                    />
                  </Grid>
                  <Grid item md={2}>
                    <Field
                      name={`conditions.${index}.operator`}
                      component={RenderSelectField}
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
                      component={KRenderDebounceTextField}
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
