import {
  Box,
  createStyles,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Theme,
  withStyles,
} from "@material-ui/core";
import { WithStyles } from "@material-ui/styles";
import { setSuccessNotificationAction } from "actions/notification";
import copy from "copy-to-clipboard";
import React from "react";
import { connect, useDispatch } from "react-redux";
import { RootState } from "reducers";
import { TDispatchProp } from "types";
import { PendingBadge, SuccessBadge } from "widgets/Badge";
import { BlankTargetLink } from "widgets/BlankTargetLink";
import { Expansion } from "widgets/expansion";
import { CopyIcon } from "widgets/Icon";
import { IconButtonWithTooltip } from "widgets/IconButtonWithTooltip";
import { Body } from "widgets/Label";

const styles = (_theme: Theme) =>
  createStyles({
    root: {},
  });

const mapStateToProps = (state: RootState, ownProps: any) => {
  const acmeServer = state.certificates.acmeServer;
  return {
    acmeServer: acmeServer,
  };
};

interface ACMEServerGuideProps extends ReturnType<typeof mapStateToProps>, TDispatchProp, WithStyles<typeof styles> {}

class ACNEServerRaw extends React.PureComponent<ACMEServerGuideProps> {
  private renderContent = () => {
    const { acmeServer } = this.props;

    if (!acmeServer) {
      return null;
    }

    return (
      <>
        <DNSConfigItems
          items={[
            {
              domain: acmeServer.acmeDomain,
              type: "NS",
              nsRecord: acmeServer.nsDomain,
            },
            !!acmeServer.ipForNameServer
              ? {
                  domain: acmeServer.nsDomain,
                  type: "A",
                  aRecord: acmeServer.ipForNameServer,
                }
              : {
                  domain: acmeServer.nsDomain,
                  type: "CNAME",
                  aRecord: acmeServer.hostnameForNameServer,
                },
          ]}
        />
      </>
    );
  };

  public render() {
    const { acmeServer } = this.props;

    if (!acmeServer) {
      return null;
    }

    let isReady: boolean =
      acmeServer.ready &&
      acmeServer.acmeDomain.length > 0 &&
      (!!acmeServer.ipForNameServer || !!acmeServer.hostnameForNameServer) &&
      acmeServer.nsDomain.length > 0;

    let title: React.ReactNode = null;

    if (isReady) {
      title = <SuccessBadge text="ACME DNS Server is running" />;
    } else {
      title = <PendingBadge text="ACME DNS Server is starting" />;
    }

    return (
      <Expansion title={title} defaultUnfold={true}>
        <Box p={2}>
          <Body>
            ACME dns server can help you apply and renew wildcard certificates from Let's Encrypt. This only needs to be
            configured once. <BlankTargetLink href="https://docs.kalm.dev">Learn More (TODO)</BlankTargetLink>
          </Body>

          {this.renderContent()}
        </Box>
      </Expansion>
    );
  }
}

export const ACMEServer = connect(mapStateToProps)(withStyles(styles)(ACNEServerRaw));

interface DNSConfigGuideProps {
  items: {
    type: string;
    domain: string;
    nsRecord?: string;
    cnameRecord?: string;
    aRecord?: string;
    txtRecord?: string;
  }[];
}

export const DNSConfigItems = (props: DNSConfigGuideProps) => {
  const { items } = props;
  const dispatch = useDispatch();

  return (
    <>
      <Table size="small" aria-label="Envs-Table">
        <TableHead key="title">
          <TableRow>
            <TableCell>Domain</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Record</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item, index) => {
            const { domain, type, nsRecord, cnameRecord, aRecord, txtRecord } = item;
            const record = nsRecord || cnameRecord || aRecord || txtRecord || "";
            return (
              <TableRow key={index}>
                <TableCell>
                  {domain}
                  <IconButtonWithTooltip
                    tooltipTitle="Copy"
                    aria-label="copy"
                    size="small"
                    onClick={() => {
                      copy(domain);
                      dispatch(setSuccessNotificationAction("Copied successful!"));
                    }}
                  >
                    <CopyIcon fontSize="small" />
                  </IconButtonWithTooltip>
                </TableCell>
                <TableCell>{type}</TableCell>
                <TableCell>
                  {!!record ? (
                    <>
                      {record}
                      <IconButtonWithTooltip
                        tooltipTitle="Copy"
                        aria-label="copy"
                        size="small"
                        onClick={() => {
                          copy(record);
                          dispatch(setSuccessNotificationAction("Copied successful!"));
                        }}
                      >
                        <CopyIcon fontSize="small" />
                      </IconButtonWithTooltip>
                    </>
                  ) : (
                    "Generating, please wait."
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </>
  );
};
