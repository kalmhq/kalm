import React from "react";
import { Box, createStyles, Theme, WithStyles, withStyles, Divider } from "@material-ui/core";
import clsx from "clsx";

const TypesetStyle = (theme: Theme) => {
  return createStyles({
    root: {
      background: "#FFFFFF",
      boxShadow: "rgba(0,0,0,0.10) 0 1px 3px 0",
      border: "1px solid rgba(0,0,0,.1)",
      margin: "25px 0 40px",
      padding: "16px",
      overflowX: "auto",
      whiteSpace: "nowrap",
      borderRadius: "4px",
    },
    colorInfo: {
      margin: "16px 0",
    },
    item: {
      display: "flex",
      minHeight: "36px",
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

type ColorfulTypesetProps = WithStyles<typeof TypesetStyle> & {
  labels: Array<React.ComponentType>;
  sampleText: string;
  foregroundColor: string;
  backgroundColor: string;
};

/**
 * Typeset for Labels
 */

const ColorfulTypesetRow = (props: ColorfulTypesetProps) => {
  const { classes, labels, sampleText, foregroundColor, backgroundColor } = props;
  const bg = backgroundColor != null ? backgroundColor : "#FFFFFF";
  const fg = foregroundColor || "black";
  return (
    <Box className={clsx(classes.root)} style={{ backgroundColor: bg, color: fg }}>
      <Box className={classes.colorInfo}>
        Text: {fg} | Background: {bg}
      </Box>
      <Divider />
      {labels.map((element: React.ComponentType, index) => {
        const Ele = element;
        return (
          <Box key={index} className={clsx(classes.item)}>
            <Box className={classes.expand}>
              <Ele>
                {Ele.displayName} - {sampleText}
              </Ele>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};

export const ColorfulTypeset = withStyles(TypesetStyle)(ColorfulTypesetRow);
