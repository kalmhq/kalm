import { Box, Grid } from "@material-ui/core";
import { updateRegistryAction } from "actions/registries";
import { push } from "connected-react-router";
import { RegistryForm } from "forms/Registry";
import { BasePage } from "pages/BasePage";
import React, { FC } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouteMatch } from "react-router-dom";
import { RootState } from "store";
import { RegistryFormType } from "types/registry";
import { H6 } from "widgets/Label";
import { Loading } from "widgets/Loading";
import { ResourceNotFound } from "widgets/ResourceNotFound";

const PullSecretsEditPageRaw: FC = () => {
  const router = useRouteMatch<{ name: string }>();
  const dispatch = useDispatch();

  const initialValues = useSelector((state: RootState) =>
    state.registries.registries.find((registry) => registry.name === router.params.name),
  );

  const isLoading = useSelector((state: RootState) => state.registries.isLoading);
  const isFirstLoaded = useSelector((state: RootState) => state.registries.isFirstLoaded);

  const submit = async (registryValue: RegistryFormType) => {
    await dispatch(updateRegistryAction(registryValue));
    dispatch(push("/cluster/pull-secrets"));
  };

  if (isLoading && !isFirstLoaded) {
    return <Loading />;
  }

  if (!initialValues) {
    return (
      <BasePage>
        <Box p={2}>
          <ResourceNotFound
            text="Pull secret not found"
            redirect={`/cluster/pull-secrets`}
            redirectText="Go back to List"
          ></ResourceNotFound>
        </Box>
      </BasePage>
    );
  }

  return (
    <BasePage secondHeaderRight={<H6>Edit Pull Secret</H6>}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={12} md={8}>
          <RegistryForm isEdit onSubmit={submit} initial={initialValues as RegistryFormType} />
        </Grid>
      </Grid>
    </BasePage>
  );
};

export const PullSecretsEditPage = PullSecretsEditPageRaw;
