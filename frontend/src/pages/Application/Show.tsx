import { Box, createStyles, Theme, WithStyles, withStyles } from "@material-ui/core";
import { withNamespace } from "permission/Namespace";
import React from "react";
import { connect } from "react-redux";
import { ApplicationSidebar } from "pages/Application/ApplicationSidebar";
import { H4 } from "widgets/Label";
import { Namespaces } from "widgets/Namespaces";
import { BasePage } from "../BasePage";
import { ApplicationOverview } from "./Detail";
import { WithNamespaceProps } from "hoc/withNamespace";
import { RootState } from "reducers";

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
    const { classes } = this.props;

    return (
      <div className={classes.secondHeaderRight}>
        <H4 className={classes.secondHeaderRightItem}>Overview</H4>
        {/*<CustomizedButton*/}
        {/*  color="primary"*/}
        {/*  size="large"*/}
        {/*  className={classes.secondHeaderRightItem}*/}
        {/*  onClick={() => {*/}
        {/*    dispatch(*/}
        {/*      push(`/applications/${applicationName}/edit${componentName ? `?component=${componentName}` : ""}`),*/}
        {/*    );*/}
        {/*  }}*/}
        {/*>*/}
        {/*  Edit*/}
        {/*</CustomizedButton>*/}
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
