import { Grid, MenuItem, Button, Box } from "@material-ui/core";
import Immutable from "immutable";
import React from "react";
import { connect, DispatchProp } from "react-redux";
import { WrappedFieldArrayProps } from "redux-form";
import { FieldArray, Field } from "redux-form/immutable";
import { NormalizePort } from "../normalizer";
import { ComponentLikePort } from "../../types/componentTemplate";
import { portTypeUDP, portTypeTCP } from "../../types/common";
import { CustomTextField, RenderSelectField } from "../Basic";
import { ValidatorRequired } from "../validator";
import DeleteIcon from "@material-ui/icons/Delete";
import { IconButtonWithTooltip } from "../../widgets/IconButtonWithTooltip";

interface FieldArrayComponentHackType {
  name: any;
  component: any;
}

interface FieldArrayProps extends DispatchProp {}

interface Props extends WrappedFieldArrayProps<ComponentLikePort>, FieldArrayComponentHackType, FieldArrayProps {}

class RenderPorts extends React.PureComponent<Props> {
  public render() {
    const {
      fields,
      meta: { error, submitFailed }
    } = this.props;

    return (
      <div>
        {fields.map((member, index) => (
          <Grid container spacing={3}>
            <Grid item xs>
              <CustomTextField name={`${member}.name`} label="Name" margin validate={[ValidatorRequired]} />
            </Grid>
            <Grid item xs>
              <Field
                name={`${member}.protocol`}
                component={RenderSelectField}
                label="Protocol"
                validate={[ValidatorRequired]}>
                <MenuItem value={portTypeUDP}>{portTypeUDP}</MenuItem>
                <MenuItem value={portTypeTCP}>{portTypeTCP}</MenuItem>
              </Field>
            </Grid>
            <Grid item xs>
              <CustomTextField
                name={`${member}.containerPort`}
                label="ContainerPort"
                margin
                validate={[ValidatorRequired]}
                normalize={NormalizePort}
              />
            </Grid>
            <Grid item xs>
              <CustomTextField
                name={`${member}.servicePort`}
                label="ServicePort"
                margin
                validate={[ValidatorRequired]}
                normalize={NormalizePort}
              />
            </Grid>
            <Grid item xs style={{ paddingTop: 22 }}>
              <IconButtonWithTooltip
                tooltipPlacement="top"
                tooltipTitle="Delete"
                aria-label="delete"
                onClick={() => fields.remove(index)}>
                <DeleteIcon />
              </IconButtonWithTooltip>
            </Grid>
          </Grid>
        ))}
        <Grid container spacing={3}>
          <Grid item xs>
            <Box boxShadow={3} m={0} p={0} style={{ width: "fit-content", borderRadius: 5 }}>
              <Button
                size="small"
                style={{ paddingLeft: 20, paddingRight: 20 }}
                color="primary"
                onClick={() => fields.push(Immutable.Map({}))}>
                Add Port
              </Button>
            </Box>
            {submitFailed && error && <span>{error}</span>}
          </Grid>
        </Grid>
      </div>
    );
  }
}

export const Ports = connect()((props: FieldArrayProps) => {
  return <FieldArray name="ports" component={RenderPorts} {...props} />;
});
