import { Box, Button, createStyles, Link as KMLink, Theme, withStyles, WithStyles } from "@material-ui/core";
import { indigo } from "@material-ui/core/colors";
import { deleteCertificateAction } from "actions/certificate";
import { setErrorNotificationAction, setSuccessNotificationAction } from "actions/notification";
import { withUserAuth, WithUserAuthProps } from "hoc/withUserAuth";
import { BasePage } from "pages/BasePage";
import React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { RootState } from "reducers";
import { TDispatchProp } from "types";
import { Domain } from "types/domains";
import sc from "utils/stringConstants";
import { PendingBadge } from "widgets/Badge";
import { FlexRowItemCenterBox } from "widgets/Box";
import { CustomizedButton } from "widgets/Button";
import { EmptyInfoBox } from "widgets/EmptyInfoBox";
import { WebIcon } from "widgets/Icon";
import { DeleteButtonWithConfirmPopover } from "widgets/IconWithPopover";
import { InfoBox } from "widgets/InfoBox";
import { KRTable } from "widgets/KRTable";
import { KLink } from "widgets/Link";
import { Loading } from "widgets/Loading";

const styles = (theme: Theme) =>
  createStyles({
    root: {},
    normalStatus: {
      color: theme.palette.success.main,
    },
    warningStatus: {
      color: theme.palette.warning.main,
    },
    domainsColumn: {
      minWidth: 200,
    },
  });

const mapStateToProps = (state: RootState) => {
  return {
    isLoading: state.domains.isLoading,
    isFirstLoaded: state.domains.isFirstLoaded,
    domains: state.domains.domains,
  };
};

interface Props
  extends WithUserAuthProps,
    WithStyles<typeof styles>,
    ReturnType<typeof mapStateToProps>,
    TDispatchProp {}

class DomainListPageRaw extends React.PureComponent<Props> {
  private renderDomain = (domain: Domain) => {
    const { classes } = this.props;

    return (
      <Box className={classes.domainsColumn}>
        <KLink to={`/domains/${domain.name}`}>{domain.domain}</KLink>
      </Box>
    );
  };

  private renderType = (domain: Domain) => (domain.isBuiltIn ? "-" : domain.recordType);
  private renderTarget = (domain: Domain) => (domain.isBuiltIn ? "-" : domain.target);

  private renderActions = (domain: Domain) => {
    const { canEditTenant } = this.props;
    return (
      <>
        {canEditTenant() && !domain.isBuiltIn && (
          <>
            <DeleteButtonWithConfirmPopover
              popupId="delete-domain-popup"
              popupTitle="DELETE DOMAIN?"
              confirmedAction={() => this.confirmDelete(domain)}
            />
          </>
        )}
      </>
    );
  };

  private confirmDelete = async (domain: Domain) => {
    const { dispatch } = this.props;

    try {
      const certName = domain.name;
      await dispatch(deleteCertificateAction(certName));
      await dispatch(setSuccessNotificationAction(`Successfully deleted certificate '${certName}'`));
    } catch {
      dispatch(setErrorNotificationAction());
    }
  };

  private renderStatus = (domain: Domain) => {
    const { classes } = this.props;

    if (domain.status === "ready") {
      // why the ready field is a string value ?????
      return (
        <FlexRowItemCenterBox>
          <FlexRowItemCenterBox className={classes.normalStatus}>Normal</FlexRowItemCenterBox>
        </FlexRowItemCenterBox>
      );
    } else if (domain.status === "pending") {
      return (
        <FlexRowItemCenterBox>
          <FlexRowItemCenterBox mr={1}>
            <PendingBadge />
          </FlexRowItemCenterBox>
          <FlexRowItemCenterBox className={classes.warningStatus}>Pending</FlexRowItemCenterBox>
        </FlexRowItemCenterBox>
      );
    } else {
      return <PendingBadge />;
    }
  };

  private getKRTableColumns() {
    const { canEditTenant } = this.props;

    const columns = [
      {
        Header: "Domain",
        accessor: "domain",
      },
      {
        Header: "Type",
        accessor: "type",
      },
      {
        Header: "Target",
        accessor: "target",
      },
      {
        Header: "Status",
        accessor: "status",
      },
    ];

    if (canEditTenant()) {
      columns.push({
        Header: "Actions",
        accessor: "actions",
      });
    }

    return columns;
  }

  private getKRTableData() {
    const { domains } = this.props;
    const data: any[] = [];

    domains.forEach((domain) => {
      data.push({
        domain: this.renderDomain(domain),
        type: this.renderType(domain),
        target: this.renderTarget(domain),
        status: this.renderStatus(domain),
        actions: this.renderActions(domain),
      });
    });

    return data;
  }

  private renderKRTable() {
    return (
      <KRTable showTitle={true} title="Certificates" columns={this.getKRTableColumns()} data={this.getKRTableData()} />
    );
  }

  private renderEmpty() {
    const { canEditTenant } = this.props;
    return (
      <EmptyInfoBox
        image={<WebIcon style={{ height: 120, width: 120, color: indigo[200] }} />}
        title={sc.EMPTY_DOMAIN_TITLE}
        content={sc.EMPTY_DOMAIN_SUBTITLE}
        button={
          canEditTenant() ? (
            <CustomizedButton variant="contained" color="primary" component={Link} to="/domain/new">
              New Domain
            </CustomizedButton>
          ) : null
        }
      />
    );
  }

  private renderInfoBox() {
    const title = "Domains";

    const options = [
      {
        title: (
          <KMLink href="https://kalm.dev/docs/certs" target="_blank">
            How to update my domain DNS records? (TODO)
          </KMLink>
        ),
        draft: true,
        content: "",
      },
      {
        title: (
          <KMLink href="https://kalm.dev/docs/certs" target="_blank">
            What's the difference between Domain and Certificate? (TODO)
          </KMLink>
        ),
        draft: true,
        content: "",
      },
    ];

    return <InfoBox title={title} options={options} />;
  }

  public render() {
    const { isFirstLoaded, isLoading, domains: certificates, canEditTenant } = this.props;
    return (
      <BasePage
        secondHeaderRight={
          canEditTenant() ? (
            <>
              <Button
                color="primary"
                variant="outlined"
                size="small"
                component={Link}
                tutorial-anchor-id="add-certificate"
                to="/domains/new"
              >
                New Domain
              </Button>
            </>
          ) : null
        }
      >
        <Box p={2}>
          <Box>
            {isLoading && !isFirstLoaded ? (
              <Loading />
            ) : certificates && certificates.length > 0 ? (
              this.renderKRTable()
            ) : (
              this.renderEmpty()
            )}
          </Box>
          <Box mt={2}>{this.renderInfoBox()}</Box>
        </Box>
      </BasePage>
    );
  }
}

export const DomainListPage = withUserAuth(withStyles(styles)(connect(mapStateToProps)(DomainListPageRaw)));
