import { Box, Button, createStyles, Theme, WithStyles, withStyles } from "@material-ui/core";
import React from "react";
import { connect } from "react-redux";
import { ApplicationSidebar } from "pages/Application/ApplicationSidebar";
import { H4 } from "widgets/Label";
import { Namespaces } from "widgets/Namespaces";
import { BasePage } from "../BasePage";
import { ApplicationOverview } from "./Detail";
import { withNamespace, WithNamespaceProps } from "hoc/withNamespace";
import { RootState } from "reducers";
import { Link } from "react-router-dom";

const mapStateToProps = (_state: RootState) => {
  return {};
};

const styles = (theme: Theme) =>
  createStyles({
    root: {},
    secondHeaderRight: {
      height: "100%",
      width: "100%",
      display: "flex",
      alignItems: "center",
    },
    secondHeaderRightItem: {
      marginLeft: 20,
    },
  });

interface Props extends WithNamespaceProps, WithStyles<typeof styles> {}

class ApplicationShowRaw extends React.PureComponent<Props> {
  private renderSecondHeaderRight() {
    const { classes, activeNamespaceName } = this.props;

    return (
      <div className={classes.secondHeaderRight}>
        <H4 className={classes.secondHeaderRightItem}>Overview</H4>
        <Button
          component={(props: any) => <Link {...props} />}
          color="primary"
          size="small"
          variant="outlined"
          className={classes.secondHeaderRightItem}
          to={`/applications/${activeNamespaceName}/components/new`}
        >
          Add Component
        </Button>
        <Button
          component={(props: any) => <Link {...props} />}
          color="primary"
          size="small"
          variant="outlined"
          className={classes.secondHeaderRightItem}
          to={`/applications/${activeNamespaceName}/routes/new`}
        >
          Add Route
        </Button>
      </div>
    );
  }

  public render() {
    return (
      <BasePage
        secondHeaderLeft={<Namespaces />}
        secondHeaderRight={this.renderSecondHeaderRight()}
        leftDrawer={<ApplicationSidebar />}
      >
        <Box p={2}>
          <ApplicationOverview />
        </Box>
      </BasePage>
    );
  }
}

export const ApplicationShow = withStyles(styles)(withNamespace(connect(mapStateToProps)(ApplicationShowRaw)));
