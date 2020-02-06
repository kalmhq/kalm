import React from "react";
import {
  Typography,
  Grid,
  Button,
  Theme,
  WithStyles,
  createStyles,
  withStyles
} from "@material-ui/core";
import GithubIcon from "@material-ui/icons/GitHub";
import MenuBookIcon from "@material-ui/icons/MenuBook";
import SupervisorAccountIcon from "@material-ui/icons/SupervisorAccount";
import { BasePage } from "../BasePage";

const styles = (theme: Theme) =>
  createStyles({
    container: {
      padding: theme.spacing(3)
    },
    description: {
      fontSize: 18,
      marginBottom: 18
    },
    cardTitle: {
      marginBottom: 18
    },
    cardDescription: {
      marginBottom: 18,
      minHeight: 140
    }
  });

interface Props extends WithStyles<typeof styles> {}

class Dashboard extends React.PureComponent<Props> {
  public render() {
    const { classes } = this.props;

    return (
      <BasePage title="Welcome to Kapp Dashboard" variant="h2" noBreadcrumb>
        <div className={classes.container}>
          <Typography className={classes.description}>
            Kapp is a central hub for you to manage your devop tasks. It let you
            manage, monitoring <strong>Applications</strong> and{" "}
            <strong>configs</strong>.
          </Typography>

          <Grid container spacing={3}>
            <Grid item md={3}>
              <Typography variant="h5" className={classes.cardTitle}>
                Learn Kapp
              </Typography>
              <Typography className={classes.cardDescription}>
                Kapp is build on top of kubernetes. It provides your some best
                practices of using kubernets and hide obscure details. Wondering
                what all that means? Have a look at the Kapp documentation.
              </Typography>
              <div>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<MenuBookIcon />}
                >
                  Document
                </Button>
              </div>
            </Grid>
            <Grid item md={3}>
              <Typography variant="h5" className={classes.cardTitle}>
                Get Start
              </Typography>
              <Typography className={classes.cardDescription}>
                If you don't know where to start, you can try to integrate your{" "}
                <strong>Image Registry</strong> first. Then try to create your
                first <strong>Component</strong>, <strong>Application</strong>
              </Typography>
              <div>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<SupervisorAccountIcon />}
                >
                  Get Start
                </Button>
              </div>
            </Grid>
            <Grid item md={3}>
              <Typography variant="h5" className={classes.cardTitle}>
                Contribute
              </Typography>
              <Typography className={classes.cardDescription}>
                Kapp system is an open source system hosted on github under
                Apache V2 License. See our roadmap for the plans. Pull requests
                are welcomed.
              </Typography>
              <div>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<GithubIcon />}
                >
                  Github
                </Button>
              </div>
            </Grid>
          </Grid>
        </div>
      </BasePage>
    );
  }
}

export default withStyles(styles)(Dashboard);
