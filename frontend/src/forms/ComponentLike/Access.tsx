import { FormControlLabel, Grid } from "@material-ui/core";
import Checkbox from "@material-ui/core/Checkbox";
import { Alert } from "@material-ui/lab";
import { FormApi } from "final-form";
import { HelperTextSection } from "forms/ComponentLike";
import { AutoCompleteMultiValuesFreeSolo } from "forms/Final/autoComplete";
import { NormalizePorts, stringArrayTrimParse } from "forms/normalizer";
import { withSSO, WithSSOProps } from "hoc/withSSO";
import React from "react";
import { Field, FieldRenderProps } from "react-final-form";
import { TDispatchProp } from "types";
import { ComponentLike } from "types/componentTemplate";
import { Loading } from "widgets/Loading";
import sc from "../../utils/stringConstants";

interface Props extends WithSSOProps, TDispatchProp {
  ports: ComponentLike["ports"];
  protectedEndpoint: ComponentLike["protectedEndpoint"];
  change: FormApi["change"];
}

const ComponentAccessRaw: React.FC<Props> = (props) => {
  const { ssoConfig, protectedEndpoint, change, isSSOConfigLoaded, isSSOConfigLoading, ports } = props;

  const handleCheckBoxChangeClick = () => {
    change("protectedEndpoint", !!protectedEndpoint ? undefined : {});
  };

  if (isSSOConfigLoading && !isSSOConfigLoaded) {
    return <Loading />;
  }

  let allGroups: string[] = [];

  if (!ssoConfig || !ssoConfig.domain) {
    return (
      <Alert severity="info">
        <span>
          Your cluster doesn't have <strong>Single Sign-on</strong> configured. Component access feature is disabled.{" "}
          {/* <BlankTargetLink href="/#">Learn More(TODO)</BlankTargetLink> */}
        </span>
      </Alert>
    );
  }

  if (ssoConfig) {
    ssoConfig.connectors?.forEach((x) => {
      if (x.config) {
        if ("orgs" in x.config) {
          x.config.orgs.forEach((org) => {
            org.teams.forEach((team) => {
              allGroups.push(`${org.name}:${team}`);
            });
          });
        } else if ("groups" in x.config) {
          allGroups = allGroups.concat(x.config.groups);
        }
      }
    });
  }

  const ps = ports?.map((x) => x.containerPort) || [];
  const psUnique = Array.from(new Set(ps));

  return (
    <Grid container spacing={2}>
      <HelperTextSection>{sc.ACCESS_HELPER}</HelperTextSection>
      <Grid item xs={12}>
        <FormControlLabel
          control={<Checkbox checked={!!props.protectedEndpoint} onChange={handleCheckBoxChangeClick} />}
          label="Require SSO authentication to access this component"
        />
      </Grid>

      <Grid item xs={12}>
        <Field
          render={(props: FieldRenderProps<number[]>) => (
            <AutoCompleteMultiValuesFreeSolo<number> {...props} options={psUnique} />
          )}
          label="Ports"
          name="protectedEndpoint.ports"
          disabled={!props.protectedEndpoint}
          placeholder="Select specific ports"
          parse={NormalizePorts}
          helperText={sc.PROTECTED_ENDPOINT_PORT}
        />
      </Grid>
      <Grid item xs={12}>
        <Field
          render={(props: FieldRenderProps<string[]>) => (
            <AutoCompleteMultiValuesFreeSolo<string> {...props} options={allGroups} />
          )}
          label="Grant to specific groups"
          name="protectedEndpoint.groups"
          placeholder="e.g. my-github-org:a-team-name. a-gitlab-group-name"
          parse={stringArrayTrimParse}
          helperText={sc.PROTECTED_ENDPOINT_SPECIFIC_GROUPS}
          disabled={!props.protectedEndpoint}
        />
      </Grid>
    </Grid>
  );
};

export const ComponentAccess = withSSO(ComponentAccessRaw) as any;
