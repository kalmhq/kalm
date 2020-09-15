import { Box, Button, Fade, Grid, Paper, Popper } from "@material-ui/core";
import { FastField, FieldArray, FieldArrayRenderProps, getIn } from "formik";
import { POPPER_ZINDEX } from "layout/Constants";
import PopupState, { anchorRef, bindPopper, InjectedProps } from "material-ui-popup-state";
import React from "react";
import {
  ComponentLikePort,
  PortProtocolGRPC,
  PortProtocolHTTP,
  PortProtocolHTTP2,
  PortProtocolTCP,
  PortProtocolUDP,
} from "types/componentTemplate";
import { AddIcon, DeleteIcon } from "widgets/Icon";
import { IconButtonWithTooltip } from "widgets/IconButtonWithTooltip";
import { PortChart } from "widgets/PortChart";
import { RenderFormikSelectField } from "../Basic/select";
import { KRenderDebounceFormikTextField } from "../Basic/textfield";
import { ValidatorContainerPortRequired, ValidatorPort, ValidatorRequired } from "../validator";
import { FormikNormalizePort } from "forms/normalizer";

interface Props extends FieldArrayRenderProps {}

// const ValidatorPorts = (values: ComponentLikePort[], _allValues?: any, _props?: any, _name?: any) => {
//   if (!values) return undefined;
//   const protocolServicePorts = new Set<string>();

//   for (let i = 0; i < values.length; i++) {
//     const port = values[i]!;
//     const servicePort = port.servicePort || port.containerPort;

//     if (servicePort) {
//       const protocol = port.protocol;
//       const protocolServicePort = protocol + "-" + servicePort;

//       if (!protocolServicePorts.has(protocolServicePort)) {
//         protocolServicePorts.add(protocolServicePort);
//       } else if (protocolServicePort !== "") {
//         return "Listening port on a protocol should be unique.  " + protocol + " - " + servicePort;
//       }
//     }
//   }
// };

class RenderPorts extends React.PureComponent<Props> {
  public render() {
    const {
      push,
      name,
      form: { values, handleBlur },
      remove,
    } = this.props;
    const handlePush = () => push({ protocol: PortProtocolHTTP });
    return (
      <>
        <Box mb={2}>
          <Grid item xs>
            <Button variant="outlined" color="primary" startIcon={<AddIcon />} size="small" onClick={handlePush}>
              Add
            </Button>

            {/* {submitFailed && error && <span>{error}</span>} */}
            {/* {error ? (
              <Box mt={2}>
                <Alert severity="error">{error}</Alert>
              </Box>
            ) : null} */}
          </Grid>
        </Box>

        {getIn(values, name) &&
          getIn(values, name).map((field: ComponentLikePort, index: number) => {
            const handleRemove = () => remove(index);
            return (
              <Grid container spacing={2} key={index}>
                <Grid item xs>
                  <FastField
                    name={`${name}.${index}.protocol`}
                    component={RenderFormikSelectField}
                    required
                    label="Protocol"
                    validate={ValidatorRequired}
                    options={[
                      { value: PortProtocolHTTP, text: PortProtocolHTTP },
                      { value: PortProtocolHTTP2, text: PortProtocolHTTP2 },
                      { value: PortProtocolGRPC, text: PortProtocolGRPC },
                      { value: PortProtocolTCP, text: PortProtocolTCP },
                      { value: PortProtocolUDP, text: PortProtocolUDP },
                    ]}
                  />
                </Grid>
                <PopupState variant="popover" popupId={`container-port-${index}`} disableAutoFocus>
                  {(popupState: InjectedProps) => {
                    return (
                      <>
                        <Grid
                          item
                          xs
                          ref={(c: any) => {
                            anchorRef(popupState)(c);
                          }}
                        >
                          <FastField
                            onFocus={popupState.open}
                            onBlur={(e: any) => {
                              popupState.close();
                              handleBlur(e);
                            }}
                            component={KRenderDebounceFormikTextField}
                            name={`${name}.${index}.containerPort`}
                            label="Container port"
                            placeholder="1~65535,not 443"
                            normalize={FormikNormalizePort}
                            validate={ValidatorContainerPortRequired}
                          />
                        </Grid>
                        <Popper
                          {...bindPopper(popupState)}
                          transition
                          placement="top"
                          style={{ zIndex: POPPER_ZINDEX }}
                        >
                          {({ TransitionProps }) => (
                            <Fade {...TransitionProps} timeout={350}>
                              <Paper elevation={2}>
                                <Box p={2}>
                                  <PortChart highlightContainerPort />
                                </Box>
                              </Paper>
                            </Fade>
                          )}
                        </Popper>
                      </>
                    );
                  }}
                </PopupState>
                <PopupState variant="popover" popupId={`service-port-${index}`} disableAutoFocus>
                  {(popupState: InjectedProps) => {
                    return (
                      <>
                        <Grid
                          item
                          xs
                          ref={(c: any) => {
                            anchorRef(popupState)(c);
                          }}
                        >
                          <FastField
                            onFocus={popupState.open}
                            onBlur={(e: any) => {
                              popupState.close();
                              handleBlur(e);
                            }}
                            component={KRenderDebounceFormikTextField}
                            name={`${name}.${index}.servicePort`}
                            label="Service Port"
                            placeholder="Default to equal publish port"
                            normalize={FormikNormalizePort}
                            validate={ValidatorPort}
                          />
                        </Grid>
                        <Popper
                          {...bindPopper(popupState)}
                          transition
                          placement="top"
                          style={{ zIndex: POPPER_ZINDEX }}
                        >
                          {({ TransitionProps }) => (
                            <Fade {...TransitionProps} timeout={350}>
                              <Paper elevation={2}>
                                <Box p={2}>
                                  <PortChart highlightServicePort />
                                </Box>
                              </Paper>
                            </Fade>
                          )}
                        </Popper>
                      </>
                    );
                  }}
                </PopupState>

                <Grid item xs={1}>
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
            );
          })}
      </>
    );
  }
}

export const Ports = (props: any) => {
  return <FieldArray name="ports" component={RenderPorts} {...props} />;
};
