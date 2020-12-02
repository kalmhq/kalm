import { createStyles, makeStyles, Theme } from "@material-ui/core";
import React from "react";
import { Domain } from "types/domains";
import { PendingBadge } from "widgets/Badge";
import { FlexRowItemCenterBox } from "widgets/Box";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {},
    normalStatus: {
      color: theme.palette.success.main,
    },
    warningStatus: {
      color: theme.palette.warning.main,
    },
  }),
);

export const DomainStatus = ({ domain }: { domain: Domain }) => {
  const classes = useStyles();

  if (domain.status === "ready") {
    // why the ready field is a string value ?????
    return (
      <FlexRowItemCenterBox>
        <FlexRowItemCenterBox className={classes.normalStatus}>Normal</FlexRowItemCenterBox>
      </FlexRowItemCenterBox>
    );
  } else if (domain.status === "pending") {
    return (
      <FlexRowItemCenterBox>
        <FlexRowItemCenterBox mr={1}>
          <PendingBadge />
        </FlexRowItemCenterBox>
        <FlexRowItemCenterBox className={classes.warningStatus}>Pending</FlexRowItemCenterBox>
      </FlexRowItemCenterBox>
    );
  } else {
    return <PendingBadge />;
  }
};
