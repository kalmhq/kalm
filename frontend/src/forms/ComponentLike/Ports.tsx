import { Box, Button, Grid, Icon, MenuItem } from "@material-ui/core";
import { Alert } from "@material-ui/lab";
import Immutable from "immutable";
import React from "react";
import { connect, DispatchProp } from "react-redux";
import { arrayPush, WrappedFieldArrayProps } from "redux-form";
import { Field, FieldArray } from "redux-form/immutable";
import { DeleteIcon } from "widgets/Icon";
import { IconButtonWithTooltip } from "widgets/IconButtonWithTooltip";
import { portTypeTCP, portTypeUDP } from "../../types/common";
import { ComponentLikePort } from "../../types/componentTemplate";
import { RenderSelectField } from "../Basic/select";
import { KRenderTextField } from "../Basic/textfield";
import { NormalizePort } from "../normalizer";
import { ValidatorRequired, ValidatorServiceName } from "../validator";

interface FieldArrayComponentHackType {
  name: any;
  component: any;
  validate: any;
}

interface FieldArrayProps extends DispatchProp {}

interface Props extends WrappedFieldArrayProps<ComponentLikePort>, FieldArrayComponentHackType, FieldArrayProps {}

const ValidatorPorts = (values: Immutable.List<ComponentLikePort>, _allValues?: any, _props?: any, _name?: any) => {
  if (!values) return undefined;
  const names = new Set<string>();
  const protocolServicePorts = new Set<string>();
  for (let i = 0; i < values.size; i++) {
    const port = values.get(i)!;
    const name = port.get("name");

    if (name !== "") {
      if (!names.has(name)) {
        names.add(name);
      } else {
        return "Port names should be unique.  " + name + "";
      }
    }

    const servicePort = port.get("servicePort") || port.get("containerPort");
    if (servicePort) {
      const protocol = port.get("protocol");
      const protocolServicePort = protocol + "-" + servicePort;

      if (!protocolServicePorts.has(protocolServicePort)) {
        protocolServicePorts.add(protocolServicePort);
      } else {
        return "Listening port on a protocol should be unique.  " + protocol + " - " + servicePort;
      }
    }
  }
};

class RenderPorts extends React.PureComponent<Props> {
  public render() {
    const {
      fields,
      dispatch,
      meta: { error, form },
    } = this.props;
    return (
      <>
        <Box mb={2}>
          <Grid item xs>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<Icon>add</Icon>}
              size="small"
              onClick={() =>
                dispatch(
                  arrayPush(
                    form,
                    fields.name,
                    Immutable.Map({
                      name: "",
                      protocol: portTypeTCP,
                      containerPort: null,
                    }),
                  ),
                )
              }
            >
              Add
            </Button>

            {/* {submitFailed && error && <span>{error}</span>} */}
            {error ? (
              <Box mt={2}>
                <Alert severity="error">{error}</Alert>
              </Box>
            ) : null}
          </Grid>
        </Box>

        {fields.map((field, index) => {
          return (
            <Grid container spacing={2} key={field}>
              <Grid item xs>
                <Field
                  component={KRenderTextField}
                  name={`${field}.name`}
                  label="Name"
                  placeholder="Port Name"
                  validate={[ValidatorRequired, ValidatorServiceName]}
                  required
                />
              </Grid>
              <Grid item xs>
                <Field
                  name={`${field}.protocol`}
                  component={RenderSelectField}
                  label="Protocol"
                  validate={[ValidatorRequired]}
                  options={[
                    { value: portTypeTCP, text: portTypeTCP },
                    { value: portTypeUDP, text: portTypeUDP },
                  ]}
                >
                  <MenuItem value={portTypeUDP}>{portTypeUDP}</MenuItem>
                  <MenuItem value={portTypeTCP}>{portTypeTCP}</MenuItem>
                </Field>
              </Grid>
              <Grid item xs>
                <Field
                  component={KRenderTextField}
                  name={`${field}.containerPort`}
                  label="Publish port"
                  placeholder="Port number between 1-65535"
                  required
                  validate={[ValidatorRequired]}
                  normalize={NormalizePort}
                />
              </Grid>
              <Grid item xs>
                <Field
                  component={KRenderTextField}
                  name={`${field}.servicePort`}
                  label="listening on port"
                  placeholder="Default to equal publish port"
                  // validate={[ValidatorRequired]}
                  normalize={NormalizePort}
                />
              </Grid>
              <Grid item xs={1}>
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
          );
        })}
      </>
    );
  }
}

export const Ports = connect()((props: FieldArrayProps) => {
  return <FieldArray name="ports" component={RenderPorts} validate={ValidatorPorts} {...props} />;
});
