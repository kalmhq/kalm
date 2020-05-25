import { Grid } from "@material-ui/core";
import { Warning } from "@material-ui/icons";
import { Alert } from "@material-ui/lab";
import { KFreeSoloAutoCompleteSingleValue } from "forms/Basic/autoComplete";
import { KRenderSlider } from "forms/Basic/slider";
import React from "react";
import { WrappedFieldArrayProps } from "redux-form";
import { Field } from "redux-form/immutable";
import { DeleteIcon } from "widgets/Icon";
import { IconButtonWithTooltip } from "widgets/IconButtonWithTooltip";
import { HttpRouteDestination } from "../../types/route";
import { ValidatorRequired } from "../validator";

interface FieldArrayComponentHackType {
  name: any;
  component: any;
  rerenderOnEveryChange: any;
  validate: any;
}

interface Props extends WrappedFieldArrayProps<HttpRouteDestination>, FieldArrayComponentHackType {}

export class RenderHttpRouteDestinations extends React.PureComponent<Props> {
  private renderRows() {
    const { fields } = this.props;

    return fields.map((member, index) => {
      const target = fields.get(index);
      return (
        <Grid container spacing={1} key={index} alignItems="center">
          <Grid item md={4}>
            <Field
              name={`${member}.host`}
              component={KFreeSoloAutoCompleteSingleValue}
              label="Target"
              validate={[ValidatorRequired]}
              options={[
                {
                  label: "server-v2:80",
                  value: "server-v2:80",
                  group: "Service"
                },
                {
                  label: "server-v1:80",
                  value: "server-v1:80",
                  group: "Service"
                }
              ]}
            />
          </Grid>
          {fields.length > 1 ? (
            <Grid item md={2}>
              <Field
                name={`${member}.weight`}
                component={KRenderSlider}
                label="Weight"
                step={1}
                min={0}
                max={10}
                disabled={fields.length <= 1}
              />
            </Grid>
          ) : null}
          <Grid item md={1}>
            <IconButtonWithTooltip
              tooltipPlacement="top"
              tooltipTitle="Delete"
              aria-label="delete"
              onClick={() => fields.remove(index)}>
              <DeleteIcon />
            </IconButtonWithTooltip>
          </Grid>
          {target.get("weight") === 0 ? (
            <Grid item md={5}>
              <Warning /> Requests won't go into this target since it has 0 weight.
            </Grid>
          ) : null}
        </Grid>
      );
    });
  }
  public render() {
    const {
      meta: { error, dirty, submitFailed }
    } = this.props;

    return (
      <div>
        {!!error && (dirty || submitFailed) ? (
          <Alert className={"alert"} severity="error">
            {error}
          </Alert>
        ) : null}
        {this.renderRows()}
      </div>
    );
  }
}
