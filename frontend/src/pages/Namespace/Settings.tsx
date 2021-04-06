import { Box, createStyles, Theme, Typography, WithStyles, withStyles } from "@material-ui/core";
import { deleteApplicationAction } from "actions/application";
import { setErrorNotificationAction, setSuccessNotificationAction } from "actions/notification";
import { push } from "connected-react-router";
import { withNamespace, WithNamespaceProps } from "hoc/withNamespace";
import { ApplicationSidebar } from "pages/Namespace/ApplicationSidebar";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "store";
import sc from "utils/stringConstants";
import { DeleteButtonWithConfirmPopover } from "widgets/IconWithPopover";
import { InfoBox } from "widgets/InfoBox";
import { Body } from "widgets/Label";
import { Namespaces } from "widgets/Namespaces";
import { BasePage } from "../BasePage";

const mapStateToProps = (_state: RootState) => {
  return {};
};

const styles = (theme: Theme) =>
  createStyles({
    root: {},
  });

interface Props extends WithNamespaceProps, WithStyles<typeof styles> {}

const ApplicationSettingsRaw: React.FC<Props> = (props) => {
  const confirmDelete = async () => {
    const { dispatch, activeNamespaceName } = props;
    try {
      await dispatch(deleteApplicationAction(activeNamespaceName));
      await dispatch(setSuccessNotificationAction("Successfully delete an application"));
      dispatch(push(`/`));
    } catch {
      dispatch(setErrorNotificationAction());
    }
  };

  const { activeNamespaceName } = props;
  const options = [
    {
      title: (
        <DeleteButtonWithConfirmPopover
          popupId="delete-application-popup"
          popupTitle={`DELETE APPLICATION?`}
          popupContent={
            <Box>
              This action cannot be undone. This will permanently delete all resources under application{" "}
              <Typography color={"primary"} align={"center"} component="span">
                {activeNamespaceName}
              </Typography>{" "}
              includes: components, environment configs, config files etc.
            </Box>
          }
          targetText={activeNamespaceName}
          text={"delete application"}
          useText={true}
          confirmedAction={() => confirmDelete()}
        />
      ),
      content: "",
    },
  ];

  return (
    <BasePage
      secondHeaderLeft={<Namespaces />}
      secondHeaderRight={<Body>{sc.APP_SETTINGS_PAGE_NAME}</Body>}
      leftDrawer={<ApplicationSidebar />}
    >
      <Box p={2}>
        <InfoBox title={"Dangerous Zone"} options={options} />
      </Box>
    </BasePage>
  );
};

export const ApplicationSettingsPage = withStyles(styles)(
  withNamespace(connect(mapStateToProps)(ApplicationSettingsRaw)),
);
