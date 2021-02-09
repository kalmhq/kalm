import { Box, createStyles, Grid, Link as MLink, Paper, Theme, withStyles, WithStyles } from "@material-ui/core";
import React from "react";
import { Body, Body2 } from "widgets/Label";

const styles = (theme: Theme) =>
  createStyles({
    root: {
      border: "none",
    },
  });

interface InfoBoxOption {
  title: string | React.ReactNode;
  content: string | React.ReactNode;
  draft?: boolean;
}

interface Props extends WithStyles<typeof styles> {
  title: string | React.ReactNode;
  options: InfoBoxOption[];
  guideLink?: string;
}

class InfoBoxRaw extends React.PureComponent<Props> {
  public render() {
    const { classes, title, options, guideLink } = this.props;
    const gridItems = guideLink ? wrapGuideLink(guideLink, title) : options;
    const filteredOptions = Array.from(gridItems).filter(
      (option: InfoBoxOption) => !option.draft || process.env.REACT_APP_DEBUG === "true",
    );

    if (filteredOptions.length === 0) {
      return null;
    }

    return (
      <Paper variant="outlined" className={classes.root}>
        <Box p={2}>
          <Grid container spacing={2}>
            <Grid item md={12}>
              {typeof title === "string" ? <Body>{title}</Body> : title}
            </Grid>
          </Grid>
          <Grid container spacing={2}>
            {filteredOptions.map((option, index) => {
              return (
                <Grid item md={4} key={index}>
                  {typeof option.title === "string" ? <Body>{option.title}</Body> : option.title}
                  {typeof option.content === "string" ? <Body2>{option.content}</Body2> : option.title}
                </Grid>
              );
            })}
          </Grid>
        </Box>
      </Paper>
    );
  }
}

export const InfoBox = withStyles(styles)(InfoBoxRaw);

/**
 * helper method to wrap url into an InfoBox grid object
 * @param url
 */
function wrapGuideLink(url: string, title: string | React.ReactNode) {
  return [
    {
      title: (
        <MLink href={url} target="_blank">
          {title} Guide
        </MLink>
      ),
      content: "",
    },
  ];
}
