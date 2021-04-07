import { Box, createStyles, Theme, withStyles } from "@material-ui/core";

export const FlexRowItemCenterBox = withStyles((theme: Theme) =>
  createStyles({
    root: {
      display: "flex",
      alignItems: "center",
    },
  }),
)(Box);
