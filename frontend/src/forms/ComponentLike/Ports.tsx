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
import { KRenderThrottleFormikTextField } from "../Basic/textfield";
import { ValidatorContainerPortRequired, ValidatorPort, ValidatorRequired } from "../validator";
import { FormikNormalizePort } from "forms/normalizer";
import { Alert } from "@material-ui/lab";

interface Props extends FieldArrayRenderProps {}

class RenderPorts extends React.PureComponent<Props> {
  private handlePush() {
    this.props.push({ protocol: PortProtocolHTTP });
  }

  private handleRemove(index: number) {
    this.props.remove(index);
  }

  private handleBlur(close: any, e: any) {
    close();
    this.props.form.handleBlur(e);
  }

  public render() {
    const {
      name,
      form: { values, errors },
    } = this.props;
    return (
      <>
        <Box mb={2}>
          <Grid item xs>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<AddIcon />}
              size="small"
              onClick={this.handlePush.bind(this)}
            >
              Add
            </Button>

            {/* {submitFailed && error && <span>{error}</span>} */}
            {errors.ports && typeof errors.ports === "string" ? (
              <Box mt={2}>
                <Alert severity="error">{errors.ports}</Alert>
              </Box>
            ) : null}
          </Grid>
        </Box>

        {getIn(values, name) &&
          getIn(values, name).map((field: ComponentLikePort, index: number) => {
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
                            onBlur={this.handleBlur.bind(this, popupState.close)}
                            component={KRenderThrottleFormikTextField}
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
                            onBlur={this.handleBlur.bind(this, popupState.close)}
                            component={KRenderThrottleFormikTextField}
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
                    onClick={this.handleRemove.bind(this, index)}
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
