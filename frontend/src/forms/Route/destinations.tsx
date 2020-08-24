import { Grid } from "@material-ui/core";
import Typography from "@material-ui/core/Typography";
import Warning from "@material-ui/icons/Warning";
import { Alert, AlertTitle } from "@material-ui/lab";
import { Field } from "formik";
import { KAutoCompleteOption, KAutoCompleteSingleValue } from "forms/Basic/autoComplete";
import { ImmutableFieldArray } from "forms/Basic/kFieldArray";
import { KRenderSlider } from "forms/Basic/slider";
import Immutable from "immutable";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import {
  PortProtocolGRPC,
  PortProtocolGRPCWEB,
  PortProtocolHTTP,
  PortProtocolHTTP2,
  PortProtocolHTTPS,
} from "types/componentTemplate";
import { HttpRouteDestination } from "types/route";
import { DeleteIcon } from "widgets/Icon";
import { IconButtonWithTooltip } from "widgets/IconButtonWithTooltip";
import { ValidatorRequired } from "../validator";

interface FieldArrayComponentHackType {
  destinations: Immutable.List<HttpRouteDestination>;
}

const mapStateToProps = (state: RootState) => {
  return {
    activeNamespace: state.get("namespaces").get("active"),
    services: state.get("services").get("services"),
  };
};

interface Props extends FieldArrayComponentHackType, ReturnType<typeof mapStateToProps> {}

class RenderHttpRouteDestinationsRaw extends React.PureComponent<Props> {
  private renderRows() {
    const { services, activeNamespace, destinations } = this.props;

    const options: KAutoCompleteOption[] = [];
    services
      .filter((x) => {
        const ns = x.get("namespace");

        // TODO should we ignore the system namespaces??
        return (
          ns !== "default" &&
          ns !== "kalm-system" &&
          ns !== "kalm-operator" &&
          ns !== "kalm-imgconv" &&
          ns !== "kube-system" &&
          ns !== "istio-system" &&
          ns !== "cert-manager" &&
          ns !== "istio-operator"
        );
      })
      .forEach((svc) => {
        svc
          .get("ports")
          .filter((p) => {
            const appProtocol = p.get("appProtocol");
            return (
              appProtocol === PortProtocolHTTP ||
              appProtocol === PortProtocolHTTP2 ||
              appProtocol === PortProtocolHTTPS ||
              appProtocol === PortProtocolGRPC ||
              appProtocol === PortProtocolGRPCWEB
            );
          })
          .forEach((port) => {
            options.push({
              value: `${svc.get("name")}.${svc.get("namespace")}.svc.cluster.local:${port.get("port")}`,
              label: svc.get("name") + ":" + port.get("port") + `(${port.get("appProtocol")})`,
              group:
                svc.get("namespace") === activeNamespace ? `${svc.get("namespace")} (Current)` : svc.get("namespace"),
            });
          });
      });

    return (
      <ImmutableFieldArray
        name="destinations"
        render={(arrayHelpers) => (
          <div>
            {destinations &&
              destinations.map((destination, index) => (
                <Grid container spacing={2} key={index} alignItems="center">
                  <Grid item xs={8} sm={8} md={6} lg={4} xl={4}>
                    <Field
                      name={`destinations.${index}.host`}
                      component={KAutoCompleteSingleValue}
                      label="Choose a target"
                      validate={ValidatorRequired}
                      options={options}
                      noOptionsText={
                        <Alert severity="warning">
                          <AlertTitle>No valid targets found.</AlertTitle>
                          <Typography>
                            If you can't find the target you want, please check if you have configured ports on the
                            component. Only components that have ports will appear in the options.
                          </Typography>
                        </Alert>
                      }
                    />
                  </Grid>
                  {destinations.size > 1 ? (
                    <Grid item md={2}>
                      <Field
                        name={`destinations.${index}.weight`}
                        component={KRenderSlider}
                        label="Weight"
                        step={1}
                        min={0}
                        max={10}
                        disabled={destinations.size <= 1}
                      />
                    </Grid>
                  ) : null}
                  <Grid item md={1}>
                    <IconButtonWithTooltip
                      tooltipPlacement="top"
                      tooltipTitle="Delete"
                      aria-label="delete"
                      onClick={() => arrayHelpers.remove(index)}
                    >
                      <DeleteIcon />
                    </IconButtonWithTooltip>
                  </Grid>
                  {destination.get("weight") === 0 ? (
                    <Grid item md={3}>
                      <Warning /> Requests won't go into this target since it has 0 weight.
                    </Grid>
                  ) : null}
                </Grid>
              ))}{" "}
          </div>
        )}
      />
    );
  }

  public render() {
    // TODO
    return (
      <div>
        {/* {!!error && (dirty || submitFailed) ? (
          <Alert className={"alert"} severity="error">
            {error}
          </Alert>
        ) : null} */}
        {this.renderRows()}
      </div>
    );
  }
}

export const RenderHttpRouteDestinations = connect(mapStateToProps)(RenderHttpRouteDestinationsRaw);
