import Box from "@material-ui/core/Box/Box";
import Grid from "@material-ui/core/Grid/Grid";
import { createDomainAction } from "actions/domains";
import { push } from "connected-react-router";
import { DomainForm } from "forms/Domain";
import { BasePage } from "pages/BasePage";
import React from "react";
import { useDispatch } from "react-redux";
import { DomainCreation } from "types/domains";

export const DomainNewPage = () => {
  const dispatch = useDispatch();

  const onSubmit = async (values: DomainCreation) => {
    const domain = await dispatch(createDomainAction(values));
    dispatch(push(`/domains/${domain.name}/config`));
  };

  return (
    <BasePage secondHeaderRight="Add Domain">
      <Box p={2}>
        <Grid container spacing={2}>
          <Grid item xs={8} sm={8} md={8}>
            <DomainForm onSubmit={onSubmit} />
          </Grid>
        </Grid>
      </Box>
    </BasePage>
  );
};
