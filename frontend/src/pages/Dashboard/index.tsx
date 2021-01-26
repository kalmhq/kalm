import { createStyles, Grid, Theme, Typography, WithStyles, withStyles } from "@material-ui/core";
import GithubIcon from "@material-ui/icons/GitHub";
import MenuBookIcon from "@material-ui/icons/MenuBook";
import SupervisorAccountIcon from "@material-ui/icons/SupervisorAccount";
import React from "react";
import { RaisedButton } from "widgets/Button";
import { BasePage } from "../BasePage";

const styles = (theme: Theme) =>
  createStyles({
    container: {
      padding: theme.spacing(3),
    },
    description: {
      fontSize: 18,
      marginBottom: 18,
    },
    cardTitle: {
      marginBottom: 18,
    },
    cardDescription: {
      marginBottom: 18,
      minHeight: 140,
    },
  });

interface Props extends WithStyles<typeof styles> {}

const Dashboard: React.FC<Props> = (props) => {
  const { classes } = props;

  return (
    <BasePage>
      <div className={classes.container}>
        <Typography className={classes.description}>
          Kalm is a central hub for you to manage your devop tasks. It let you manage, monitoring{" "}
          <strong>Applications</strong> make up of microservices.
        </Typography>

        <Grid container spacing={3}>
          <Grid item md={3}>
            <Typography variant="h5" className={classes.cardTitle}>
              Learn Kalm
            </Typography>
            <Typography className={classes.cardDescription}>
              Run a single image is easy, but not for application made up of a bunch of components. Kalm aim to help you
              handle complicated application with ease. Kalm is build on top of kubernetes. It provides your some best
              practices of using kubernets and hide obscure details. Wondering what all that means? Have a look at the
              Kalm documentation.
            </Typography>
            <div>
              <RaisedButton size="small" startIcon={<MenuBookIcon />}>
                Document
              </RaisedButton>
            </div>
          </Grid>
          <Grid item md={3}>
            <Typography variant="h5" className={classes.cardTitle}>
              Get Start
            </Typography>
            <Typography className={classes.cardDescription}>
              If you don't know where to start. There are several tutorials of how to use kalm. Please go throught them
              first. You can also view each page of this dashboard, some details on each page can be helpful to you.
            </Typography>
            <div>
              <RaisedButton size="small" startIcon={<SupervisorAccountIcon />}>
                Get Start
              </RaisedButton>
            </div>
          </Grid>
          <Grid item md={3}>
            <Typography variant="h5" className={classes.cardTitle}>
              Contribute
            </Typography>
            <Typography className={classes.cardDescription}>
              Kalm system is an open source system hosted on github under Apache V2 License. See our roadmap for the
              plans. Pull requests are welcomed.
            </Typography>
            <div>
              <RaisedButton variant="contained" size="small" startIcon={<GithubIcon />}>
                Github
              </RaisedButton>
            </div>
          </Grid>
        </Grid>
      </div>
    </BasePage>
  );
};

export default withStyles(styles)(Dashboard);
