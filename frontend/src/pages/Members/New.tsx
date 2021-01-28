import { Box, Grid } from "@material-ui/core";
import { push } from "connected-react-router";
import { MemberForm } from "forms/Member";
import { BasePage } from "pages/BasePage";
import React from "react";
import { useDispatch } from "react-redux";
import { RoleBinding } from "types/member";

interface Props {}

export const MemberNewPage: React.FC<Props> = (props) => {
  const dispatch = useDispatch();

  const onSubmit = async (values: RoleBinding) => {
    dispatch(push("/members/" + values.subject));
  };

  return (
    <BasePage>
      <Box p={2}>
        <Grid container spacing={2}>
          <Grid item xs={8} sm={8} md={8}>
            <MemberForm onSubmit={onSubmit} />
          </Grid>
        </Grid>
      </Box>
    </BasePage>
  );
};
