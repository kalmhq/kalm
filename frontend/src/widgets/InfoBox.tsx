import { Link as MLink, createStyles, Paper, Theme, withStyles, WithStyles, Box, Grid } from "@material-ui/core";
import React from "react";
import { H5, Body, Caption } from "widgets/Label";

const styles = (theme: Theme) =>
  createStyles({
    root: {
      backgroundColor: theme.palette.grey[50],
    },
  });

interface InfoBoxOption {
  title: string | React.ReactNode;
  content: string | React.ReactNode;
}

interface Props extends WithStyles<typeof styles> {
  title: string;
  options: InfoBoxOption[];
  guideLink?: string;
}

class InfoBoxRaw extends React.PureComponent<Props> {
  public render() {
    const { classes, title, options, guideLink } = this.props;
    const gridItems = guideLink ? wrapGuideLink(guideLink, title) : options;
    return (
      <Paper square variant="outlined" className={classes.root}>
        <Box p={2}>
          <Grid container spacing={2}>
            <Grid item md={12}>
              <H5>About {title}</H5>
            </Grid>
          </Grid>
          <Grid container spacing={2}>
            {gridItems.map((option, index) => {
              return (
                <Grid item md={4} key={index}>
                  <Body>{option.title}</Body>
                  <Caption>{option.content}</Caption>
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
function wrapGuideLink(url: string, title: string) {
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
