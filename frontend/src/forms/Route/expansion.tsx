import { createStyles, ExpansionPanel, ExpansionPanelSummary, Theme, Typography } from "@material-ui/core";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import { WithStyles, withStyles } from "@material-ui/styles";
import React from "react";
import clsx from "clsx";

const styles = (theme: Theme) =>
  createStyles({
    root: {
      background: "#f2f5f5",
      margin: "16px 0"
    },
    details: {
      padding: theme.spacing(2),
      background: "white"
    },
    heading: {
      fontSize: theme.typography.pxToRem(15),
      flexBasis: "20%",
      flexShrink: 0
    },
    secondaryHeading: {
      fontSize: theme.typography.pxToRem(15),
      color: theme.palette.text.secondary
    },
    error: {
      color: theme.palette.error.main
    }
  });

interface Props extends WithStyles<typeof styles> {
  title: string;
  hasError?: boolean;
  subTitle?: string;
  children: React.ReactNode;
  defauldUnfolded?: boolean;
}

interface State {
  isUnfolded: boolean;
}

class ExpansionRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      isUnfolded: !!props.defauldUnfolded
    };
  }
  public render() {
    const { isUnfolded } = this.state;
    const { classes, title, subTitle, children, hasError } = this.props;
    return (
      <ExpansionPanel
        className={clsx(classes.root)}
        expanded={isUnfolded}
        onChange={() => this.setState({ isUnfolded: !isUnfolded })}>
        <ExpansionPanelSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1bh-content"
          id="panel1bh-header"
          className={clsx({ [classes.error]: hasError })}>
          <Typography className={classes.heading}>{title}</Typography>
          {subTitle ? <Typography className={classes.secondaryHeading}>{subTitle}</Typography> : null}
        </ExpansionPanelSummary>
        <div className={classes.details}>{children}</div>
      </ExpansionPanel>
    );
  }
}
export const Expansion = withStyles(styles)(ExpansionRaw);
