import { Grid } from "@material-ui/core";
import { Warning } from "@material-ui/icons";
import { Alert, AlertTitle } from "@material-ui/lab";
import { KAutoCompleteOption, KAutoCompleteSingleValue } from "forms/Basic/autoComplete";
import { KRenderSlider } from "forms/Basic/slider";
import React from "react";
import { WrappedFieldArrayProps } from "redux-form";
import { Field } from "redux-form/immutable";
import { DeleteIcon } from "widgets/Icon";
import { IconButtonWithTooltip } from "widgets/IconButtonWithTooltip";
import { HttpRouteDestination } from "../../types/route";
import { ValidatorRequired } from "../validator";
import { RootState } from "../../reducers";
import { connect } from "react-redux";
import Typography from "@material-ui/core/Typography";

interface FieldArrayComponentHackType {
  name: any;
  component: any;
  rerenderOnEveryChange: any;
  validate: any;
}

const mapStateToProps = (state: RootState) => {
  return {
    activeNamespace: state.get("namespaces").get("active"),
    services: state.get("services").get("services")
  };
};

interface Props
  extends WrappedFieldArrayProps<HttpRouteDestination>,
    FieldArrayComponentHackType,
    ReturnType<typeof mapStateToProps> {}

class RenderHttpRouteDestinationsRaw extends React.PureComponent<Props> {
  private renderRows() {
    const { fields, services, activeNamespace } = this.props;

    const options: KAutoCompleteOption[] = services
      .filter(x => {
        const ns = x.get("namespace");

        // TODO should we ignore the system namespaces??
        return (
          ns !== "kapp-system" &&
          ns !== "kube-system" &&
          ns !== "istio-system" &&
          ns !== "cert-manager" &&
          ns !== "istio-operator"
        );
      })
      .sort((a, b): number => {
        const aNamespace = a.get("namespace");
        if (aNamespace === activeNamespace) {
          return -1;
        }

        const bNamespace = b.get("namespace");
        if (bNamespace === activeNamespace) {
          return 1;
        }

        if (aNamespace === bNamespace) {
          return a.get("name").localeCompare(b.get("name"));
        } else {
          return aNamespace.localeCompare(bNamespace);
        }
      })
      .map(x => {
        const option: KAutoCompleteOption = {
          value: x.get("name") + `.${x.get("namespace")}.svc.cluster.local`,
          label: x.get("name"),
          group: x.get("namespace") === activeNamespace ? `${x.get("namespace")} (Current)` : x.get("namespace")
        };

        return option;
      })
      .toArray();

    return fields.map((member, index) => {
      const target = fields.get(index);
      return (
        <Grid container spacing={1} key={index} alignItems="center">
          <Grid item md={4}>
            <Field
              name={`${member}.host`}
              component={KAutoCompleteSingleValue}
              label="Choose a target"
              validate={[ValidatorRequired]}
              options={options}
              noOptionsText={
                <Alert severity="warning">
                  <AlertTitle>No valid targets found.</AlertTitle>
                  <Typography>
                    If you can't find the target you want, please check if you have configured ports on the component.
                    Only components that have ports will appear in the options.
                  </Typography>
                </Alert>
              }
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
export const RenderHttpRouteDestinations = connect(mapStateToProps)(RenderHttpRouteDestinationsRaw);
