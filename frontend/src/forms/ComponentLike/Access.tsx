import React from "react";
import { FormControlLabel, Grid } from "@material-ui/core";
import { TDispatchProp } from "types";
import { withSSO, WithSSOProps } from "../../hoc/withSSO";
import { Field } from "formik";
import { KFreeSoloFormikAutoCompleteMultiValues } from "../Basic/autoComplete";
import { FormikNormalizePorts } from "../normalizer";
import { validatePorts } from "../validator";
import sc from "../../utils/stringConstants";
import { Loading } from "../../widgets/Loading";
import { Alert } from "@material-ui/lab";
import { BlankTargetLink } from "../../widgets/BlankTargetLink";
import Checkbox from "@material-ui/core/Checkbox";

interface Props extends WithSSOProps, TDispatchProp {}

class ComponentAccessRaw extends React.PureComponent<Props> {
  public render() {
    const { ssoConfig, isSSOConfigLoaded, isSSOConfigLoading } = this.props;

    if (isSSOConfigLoading && !isSSOConfigLoaded) {
      return <Loading />;
    }

    if (!ssoConfig || !ssoConfig.domain) {
      return (
        <Alert severity="info">
          <span>
            Your cluster doesn't have <strong>Single Sign-on</strong> configured. Component access feature is disabled.{" "}
            <BlankTargetLink href="/#">Learn More(TODO)</BlankTargetLink>
          </span>
        </Alert>
      );
    }

    return (
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <FormControlLabel
            control={<Checkbox checked={false} onChange={() => {}} />}
            label="Only users authenticated by Single Sign-on can access"
          />
        </Grid>
        <Grid item xs={12}>
          <Field
            component={KFreeSoloFormikAutoCompleteMultiValues}
            label="Ports"
            name="protectedEndpoint.ports"
            placeholder={"Select a port"}
            normalize={FormikNormalizePorts}
            validate={validatePorts}
            helperText={sc.PROTECTED_ENDPOINT_PORT}
          />
        </Grid>
        <Grid item xs={12}>
          <Field
            component={KFreeSoloFormikAutoCompleteMultiValues}
            label="Grant to specific groups"
            name="protectedEndpoint.groups"
            placeholder="e.g. my-github-org:a-team-name. a-gitlab-group-name"
            helperText={sc.PROTECTED_ENDPOINT_SPECIFIC_GROUPS}
          />
        </Grid>
      </Grid>
    );
  }
}

export const ComponentAccess = withSSO(ComponentAccessRaw);
