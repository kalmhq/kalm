import { Grid } from "@material-ui/core";
import { createResource } from "api";
import { kalmToK8sDockerRegistry } from "api/transformers";
import { RegistryForm } from "forms/Registry";
import { BasePage } from "pages/BasePage";
import React, { FC } from "react";
import { useHistory } from "react-router";
import { newEmptyRegistry, RegistryFormType } from "types/registry";
import { H6 } from "widgets/Label";

export const PullSecretsNewPage: FC = () => {
  const history = useHistory();

  const submit = async (registryValue: RegistryFormType) => {
    await createResource({
      kind: "Secret",
      apiVersion: "v1",
      metadata: {
        name: registryValue.name + "-authentication",
        namespace: "kalm-system",
        labels: {
          "kalm-docker-registry-authentication": "true",
        },
      },
      data: {
        username: btoa(registryValue.username),
        password: btoa(registryValue.password),
      },
    });
    await createResource(kalmToK8sDockerRegistry(registryValue));
    history.push("/cluster/pull-secrets");
  };

  return (
    <BasePage secondHeaderRight={<H6>{"Add Registry"}</H6>}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={12} md={8}>
          <RegistryForm onSubmit={submit} initial={newEmptyRegistry()} />
        </Grid>
      </Grid>
    </BasePage>
  );
};
