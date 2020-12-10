import { Avatar, Box, createStyles, Divider, Grid, Theme, WithStyles, withStyles } from "@material-ui/core";
import { BasePage } from "pages/BasePage";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { composeTenantLink, getHasSelectedTenant, getUserAvatar, getUserEmail, isSameTenant } from "selectors/tenant";
import { TDispatchProp } from "types";
import { KPanel } from "widgets/KPanel";
import { Body } from "widgets/Label";
import { KMLink } from "widgets/Link";
import { Loading } from "../../widgets/Loading";

const styles = (theme: Theme) =>
  createStyles({
    root: {},
    large: {
      width: theme.spacing(9),
      height: theme.spacing(9),
    },
  });

const mapStateToProps = (state: RootState) => {
  const auth = state.auth;
  const currentTenant = auth.tenant;
  const tenants = auth.tenants;
  const isLoading = auth.isLoading;
  const hasSelectedTenant = getHasSelectedTenant(state);
  const email = getUserEmail(state);
  const avatarUrl = getUserAvatar(state);
  const newTenantUrl = state.extraInfo.info.newTenantUrl;
  return {
    isLoading,
    newTenantUrl,
    currentTenant,
    tenants,
    hasSelectedTenant,
    avatarUrl,
    email,
  };
};

interface Props extends WithStyles<typeof styles>, ReturnType<typeof mapStateToProps>, TDispatchProp {}

interface State {}

class TenantsPageRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  private renderUserInfo = () => {
    const { avatarUrl, email, classes } = this.props;

    return (
      <>
        {!avatarUrl && <Avatar src={avatarUrl} className={classes.large} />}
        <Body>Welcome {email}, please select the cluster you want to use</Body>
      </>
    );
  };

  public render() {
    const { currentTenant, tenants, isLoading, hasSelectedTenant, newTenantUrl } = this.props;

    if (isLoading) {
      return <Loading />;
    }

    // FIXME: Aladdin comment, If a user has already selected a cluster, do I need force redirect to the home page?

    return (
      <BasePage>
        {tenants.length > 0 && !hasSelectedTenant && (
          <Box p={2}>
            <Grid container spacing={2}>
              <Grid item xs={8} sm={8} md={8}>
                <KPanel>
                  <Box display={"flex"} flexDirection={"column"} p={2}>
                    {this.renderUserInfo()}
                    <Divider />
                    {tenants.length > 0 ? (
                      tenants.map((t, index) => {
                        const url = composeTenantLink(t);
                        return (
                          <Box m={1} key={index}>
                            {isSameTenant(t, currentTenant) ? (
                              <Body>current: {t}</Body>
                            ) : (
                              <KMLink rel="noopener noreferrer" href={url} target={"_self"}>
                                click to open {t}
                              </KMLink>
                            )}
                          </Box>
                        );
                      })
                    ) : (
                      <>
                        You don't have any kalm, please go to Kalm SaaS to subscript new plan.{" "}
                        <KMLink href={newTenantUrl} target={"_blank"}>
                          Open Kalm SaaS
                        </KMLink>{" "}
                      </>
                    )}
                  </Box>
                </KPanel>
              </Grid>
            </Grid>
          </Box>
        )}
      </BasePage>
    );
  }
}

export const TenantsPage = withStyles(styles)(connect(mapStateToProps)(TenantsPageRaw));
