import React, { ComponentClass } from "react";
import { Box, BoxProps, WithStyles, Theme, createStyles, withStyles } from "@material-ui/core";
import clsx from "clsx";
import { Caption } from "../widgets/Label";

const TypesetStyle = (theme: Theme) => {
  return createStyles({
    root: {
      background: "#FFFFFF",
      boxShadow: "rgba(0,0,0,0.10) 0 1px 3px 0",
      border: "1px solid rgba(0,0,0,.1)",
      margin: "25px 0 40px",
      overflowX: "auto",
      whiteSpace: "nowrap",
      borderRadius: "4px",
    },
    item: {
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
    },
    label: {
      minWidth: 100,
      textAlign: "center",
    },
    expand: {
      flexGrow: 1,
    },
  });
};

type ColorfulTypesetProps = BoxProps &
  WithStyles<typeof TypesetStyle> & {
    labels: Array<React.ComponentClass>;
    sampleText: string;
    foregroundColor: string;
    backgroundColor: string;
  };

/**
 * Typeset for Labels
 */

const ColorfulTypesetRow = (props: ColorfulTypesetProps) => {
  const { classes, labels, sampleText, foregroundColor, backgroundColor } = props;
  console.log(labels);
  const bg = backgroundColor != null ? backgroundColor : "#FFFFFF";
  const fg = foregroundColor || "black";
  return (
    <Box className={clsx(classes.root)} style={{ backgroundColor: bg, color: fg }}>
      {labels.map((element: ComponentClass) => {
        const Ele = element;
        return (
          <Box className={clsx(classes.item)}>
            <Caption className={clsx(classes.label)}>{Ele.displayName}</Caption>
            <Box className={classes.expand}>
              <Ele>{sampleText || "KAML ❤️"}</Ele>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};

export const ColorfulTypeset = withStyles(TypesetStyle)(ColorfulTypesetRow);
