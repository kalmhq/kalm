import Box from "@material-ui/core/Box/Box";
import Grid from "@material-ui/core/Grid/Grid";
import { DomainForm } from "forms/Domain";
import { BasePage } from "pages/BasePage";
import React from "react";
import { DomainCreation } from "types/domains";

const DomainNewPageRaw = () => {
  const onSubmit = async (values: DomainCreation) => {
    console.log(values);
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

export const DomainNewPage = DomainNewPageRaw;

// export const MemberNewPage = withStyles(styles)(withNamespace(connect(mapStateToProps)(withRouter(MemberNewPageRaw))));
