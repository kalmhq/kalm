import React from "react";
import { Box, BoxProps, createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import clsx from "clsx";

export const FlexRowItemCenterBox = withStyles((theme: Theme) =>
  createStyles({
    root: {
      display: "flex",
      alignItems: "center",
    },
  }),
)(Box);

const rowItemBoxStyle = (theme: Theme) => {
  return createStyles({
    root: {
      display: "flex",
      flexDirection: "row",
      paddingBottom: theme.spacing(1),
      minWidth: 512,
      maxWidth: 512,
      justifyContent: "space-between",
    },
    long: {
      maxWidth: 900,
      width: 900,
    },
  });
};

type RowItemBoxProps = BoxProps &
  WithStyles<typeof rowItemBoxStyle> & {
    long?: boolean;
  };

const RowItemBoxRaw = (props: RowItemBoxProps) => {
  const { long, classes } = props;
  return <Box className={clsx(classes.root, long ? classes.long : null)}>{props.children}</Box>;
};

export const RowItemBox = withStyles(rowItemBoxStyle)(RowItemBoxRaw);
