import { createStyles, Paper, Theme, withStyles, WithStyles, Box, Grid } from "@material-ui/core";
import React from "react";
import { indigo } from "@material-ui/core/colors";
import { H5, Body, Caption } from "widgets/Label";

const styles = (theme: Theme) =>
  createStyles({
    root: {
      backgroundColor: indigo[50],
    },
  });

interface InfoBoxOption {
  title: string | React.ReactNode;
  content: string;
}

interface Props extends WithStyles<typeof styles> {
  title: string;
  options: InfoBoxOption[];
}

class InfoBoxRaw extends React.PureComponent<Props> {
  public render() {
    const { classes, title, options } = this.props;
    return (
      <Paper square variant="outlined" className={classes.root}>
        <Box p={2}>
          <Grid container spacing={2}>
            <Grid item md={12}>
              <H5>{title}</H5>
            </Grid>
          </Grid>
          <Grid container spacing={2}>
            {options.map((option, index) => {
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
