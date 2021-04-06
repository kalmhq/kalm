import { Box, createStyles, Theme, WithStyles, withStyles } from "@material-ui/core";
import { RootState } from "configureStore";
import { withNamespace, WithNamespaceProps } from "hoc/withNamespace";
import { ApplicationSidebar } from "pages/Application/ApplicationSidebar";
import React from "react";
import { connect } from "react-redux";
import sc from "utils/stringConstants";
import { Body } from "widgets/Label";
import { Namespaces } from "widgets/Namespaces";
import { BasePage } from "../BasePage";
import { ApplicationOverview } from "./Detail";

const mapStateToProps = (_state: RootState) => {
  return {};
};

const styles = (theme: Theme) =>
  createStyles({
    root: {},
  });

interface Props extends WithNamespaceProps, WithStyles<typeof styles> {}

const ApplicationShowRaw: React.FC<Props> = (props) => {
  return (
    <BasePage
      secondHeaderLeft={<Namespaces />}
      secondHeaderRight={<Body>{sc.APP_DASHBOARD_PAGE_NAME}</Body>}
      leftDrawer={<ApplicationSidebar />}
    >
      <Box p={2}>
        <ApplicationOverview />
      </Box>
    </BasePage>
  );
};

export const ApplicationShowPage = withStyles(styles)(withNamespace(connect(mapStateToProps)(ApplicationShowRaw)));
