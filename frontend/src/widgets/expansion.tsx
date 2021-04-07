import {
  Box,
  createStyles,
  ExpansionPanel,
  ExpansionPanelDetails,
  ExpansionPanelSummary,
  makeStyles,
  Theme,
  Typography,
} from "@material-ui/core";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import clsx from "clsx";
import React, { useState } from "react";
import { CardTitle } from "widgets/Label";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      "&expanded": {
        margin: "auto",
      },
      "& .MuiExpansionPanelSummary-root": {
        height: 48,
      },
      "& .MuiExpansionPanelSummary-root.Mui-expanded": {
        height: 48,
        minHeight: 48,
        borderBottom: `1px dashed ${theme.palette.divider}`,
      },
      padding: 20,
    },
    highRoot: {
      padding: 20,
      "&expanded": {
        margin: "auto",
      },
      "& .MuiExpansionPanelSummary-root": {
        // height: 48,
      },
      "& .MuiExpansionPanelSummary-root.Mui-expanded": {
        // height: 48,
        // minHeight: 48,
      },
    },
    heading: {
      flexBasis: "40%",
      flexShrink: 0,
    },
    secondaryHeading: {
      fontSize: theme.typography.pxToRem(15),
      color: theme.palette.text.secondary,
    },
    error: {
      color: theme.palette.error.main,
    },
    detailsRoot: {
      padding: 0,
      // background: "#fff",
    },
  }),
);

interface ExpansionProps {
  title: React.ReactNode;
  hasError?: boolean;
  subTitle?: string;
  children?: React.ReactNode;
  defaultUnfold?: boolean;
  nested?: boolean;
  high?: boolean;
}

export const Expansion: React.FC<ExpansionProps> = (props) => {
  const { defaultUnfold, subTitle, title, children, hasError, high } = props;
  const classes = useStyles();
  const [isUnfolded, setIsUnfolded] = useState(!!defaultUnfold);

  const renderHeader = () => {
    if (typeof title === "string") {
      return (
        <>
          <CardTitle className={classes.heading}>{title}</CardTitle>
          {subTitle ? <Typography className={classes.secondaryHeading}>{subTitle}</Typography> : null}
        </>
      );
    }

    return title;
  };

  return (
    <ExpansionPanel
      className={clsx(high ? classes.highRoot : classes.root)}
      elevation={0}
      expanded={isUnfolded}
      onChange={() => setIsUnfolded(!isUnfolded)}
    >
      <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />} className={clsx({ [classes.error]: hasError })}>
        {renderHeader()}
      </ExpansionPanelSummary>
      <ExpansionPanelDetails classes={{ root: classes.detailsRoot }}>
        <Box width={1}>{children}</Box>
      </ExpansionPanelDetails>
    </ExpansionPanel>
  );
};
