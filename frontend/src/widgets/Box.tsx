import { withStyles, createStyles, Box, Theme } from "@material-ui/core";

export const FlexRowItemCenterBox = withStyles((theme: Theme) =>
  createStyles({
    root: {
      display: "flex",
      alignItems: "center"
    }
  })
)(Box);
