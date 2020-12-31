import { Box, createStyles, Theme, Typography, WithStyles, withStyles } from "@material-ui/core";
import React from "react";
import { connect } from "react-redux";
import { ApplicationSidebar } from "pages/Application/ApplicationSidebar";
import { Body } from "widgets/Label";
import { Namespaces } from "widgets/Namespaces";
import { BasePage } from "../BasePage";
import { withNamespace, WithNamespaceProps } from "hoc/withNamespace";
import { RootState } from "reducers";
import sc from "utils/stringConstants";
import { DeleteButtonWithConfirmPopover } from "widgets/IconWithPopover";
import { setErrorNotificationAction, setSuccessNotificationAction } from "actions/notification";
import { deleteApplicationAction } from "actions/application";
import { push } from "connected-react-router";
import { InfoBox } from "widgets/InfoBox";

const mapStateToProps = (_state: RootState) => {
  return {};
};

const styles = (theme: Theme) =>
  createStyles({
    root: {},
  });

interface Props extends WithNamespaceProps, WithStyles<typeof styles> {}

class ApplicationSettingsRaw extends React.PureComponent<Props> {
  private confirmDelete = async () => {
    const { dispatch, activeNamespaceName } = this.props;
    try {
      console.log(activeNamespaceName);
      await dispatch(deleteApplicationAction(activeNamespaceName));
      await dispatch(setSuccessNotificationAction("Successfully delete an application"));
      dispatch(push(`/`));
    } catch {
      dispatch(setErrorNotificationAction());
    }
  };

  public render() {
    const { activeNamespaceName } = this.props;
    const options = [
      {
        title: (
          <DeleteButtonWithConfirmPopover
            popupId="delete-application-popup"
            popupTitle={`DELETE APPLICATION?`}
            popupContent={
              <Box>
                This action cannot be undone. This will permanently delete all resources under namespace{" "}
                <Typography color={"primary"} align={"center"}>
                  {activeNamespaceName}
                </Typography>
                includes: components, environment configs, config files etc.
              </Box>
            }
            targetText={activeNamespaceName}
            text={"delete application"}
            useText={true}
            confirmedAction={() => this.confirmDelete()}
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
          <InfoBox title={"DangerZone"} options={options} />
        </Box>
      </BasePage>
    );
  }
}

export const ApplicationSettingsPage = withStyles(styles)(
  withNamespace(connect(mapStateToProps)(ApplicationSettingsRaw)),
);
