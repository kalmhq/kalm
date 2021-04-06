import { Box, Grid } from "@material-ui/core";
import Collapse from "@material-ui/core/Collapse";
import Typography from "@material-ui/core/Typography";
import { Alert, AlertTitle } from "@material-ui/lab";
import { AutoCompleteForRenderOption, AutoCompleteSingleValue } from "forms/Final/autoComplete";
import { FinialSliderRender } from "forms/Final/slicer";
import React from "react";
import { Field, FieldRenderProps } from "react-final-form";
import { FieldArray, FieldArrayRenderProps } from "react-final-form-arrays";
import { useSelector } from "react-redux";
import { RootState } from "reducers";
import {
  PortProtocolGRPC,
  PortProtocolGRPCWEB,
  PortProtocolHTTP,
  PortProtocolHTTP2,
  PortProtocolHTTPS,
} from "types/componentTemplate";
import { DeleteIcon } from "widgets/Icon";
import { IconButtonWithTooltip } from "widgets/IconButtonWithTooltip";
import { AddButton } from "../../widgets/Button";
import { ValidatorArrayNotEmpty, ValidatorRequired } from "../validator";

const TargetsPanelRaw: React.FC = () => {
  const { services } = useSelector((state: RootState) => {
    return {
      services: state.services.services,
    };
  });

  const options: AutoCompleteForRenderOption[] = [];

  services
    .filter((x) => {
      const ns = x.namespace;

      return (
        ns !== "default" &&
        ns !== "kalm-operator" &&
        ns !== "kalm-imgconv" &&
        // ns !== "kalm-system" &&
        ns !== "kube-system" &&
        ns !== "istio-system" &&
        ns !== "cert-manager" &&
        ns !== "istio-operator"
      );
    })
    .forEach((svc) => {
      svc.ports
        .filter((p) => {
          const appProtocol = p.appProtocol;
          return (
            appProtocol === PortProtocolHTTP ||
            appProtocol === PortProtocolHTTP2 ||
            appProtocol === PortProtocolHTTPS ||
            appProtocol === PortProtocolGRPC ||
            appProtocol === PortProtocolGRPCWEB
          );
        })
        .forEach((port) => {
          const displayNamespace = svc.namespace;
          options.push({
            value: `${svc.name}.${svc.namespace}.svc.cluster.local:${port.port}`,
            label: svc.name + "." + svc.namespace + ":" + port.port + `(${port.appProtocol})`,
            group: displayNamespace,
          });
        });
    });

  return (
    <FieldArray
      validate={ValidatorArrayNotEmpty}
      name="destinations"
      render={({ fields, meta: { error, touched } }: FieldArrayRenderProps<any, any>) => (
        <div>
          <Box mt={2} mr={2} mb={2}>
            <AddButton
              onClick={() =>
                fields.push({
                  host: "",
                  weight: 1,
                })
              }
            >
              Add A Target
            </AddButton>
          </Box>
          {touched && error && typeof error === "string" ? <Alert severity="error">{error}</Alert> : null}
          <Collapse in={fields.value && fields.value.length > 1}>
            <Alert className="alert" severity="info">
              There are more than one target, traffic will be forwarded to each target by weight.
            </Alert>
          </Collapse>
          {fields.value &&
            fields.value.map((destination, index) => {
              // This may be caused by edit of component network service port but didn't change route.
              const invalidDestination = !!destination.host && !options.find((x) => x.value === destination.host);

              return (
                <Grid container spacing={2} key={index} alignItems="center">
                  <Grid item xs={8} sm={8}>
                    <Field
                      name={`destinations.${index}.host`}
                      render={(props: FieldRenderProps<any>) => (
                        <AutoCompleteSingleValue {...props} options={options} />
                      )}
                      label="Choose a target"
                      validate={ValidatorRequired}
                      helperText={invalidDestination ? "This target doesn't exist in the options, please check." : ""}
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
                  {fields.value.length > 1 ? (
                    <Grid item md={2}>
                      <Field
                        name={`destinations.${index}.weight`}
                        render={(props: FieldRenderProps<number>) => (
                          <FinialSliderRender {...props} step={1} min={0} max={10} />
                        )}
                        label="Weight"
                      />
                    </Grid>
                  ) : null}
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
                  {/* {destination.weight === 0 ? (
                    <Grid item md={3}>
                      <Warning /> Requests won't go into this target since it has 0 weight.
                    </Grid>
                  ) : null} */}
                </Grid>
              );
            })}{" "}
        </div>
      )}
    />
  );
};

export const TargetsPanel = TargetsPanelRaw;
