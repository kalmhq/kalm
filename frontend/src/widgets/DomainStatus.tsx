import React from "react";
import { connect } from "react-redux";
import { IconWithPopover } from "./IconWithPopover";
import { RootState } from "reducers";
import { TDispatchProp } from "types";
import { loadDomainDNSInfo } from "actions/domain";
import { CircularProgress, Box } from "@material-ui/core";
import { WarningIcon, CopyIcon, CheckCircleIcon } from "./Icon";
import { IconButtonWithTooltip } from "./IconButtonWithTooltip";
import copy from "copy-to-clipboard";
import { setSuccessNotificationAction } from "actions/notification";
import { regExpIp } from "forms/validator";

const mapStateToProps = (state: RootState, ownProps: OwnProps) => {
  const regResultIp = regExpIp.exec(ownProps.domain);
  return {
    domainStatus: state.get("domain").find((status) => status.get("domain") === ownProps.domain),
    ingressIP: state.get("cluster").get("info").get("ingressIP"),
    isIPDomain: regResultIp !== null,
  };
};

interface OwnProps {
  domain: string;
  mr?: number;
}

interface Props extends ReturnType<typeof mapStateToProps>, TDispatchProp, OwnProps {}

class DomainStatus extends React.PureComponent<Props> {
  componentDidMount() {
    const { dispatch, domain, isIPDomain } = this.props;
    if (domain !== "*" && !isIPDomain) {
      dispatch(loadDomainDNSInfo(domain));
    }
  }

  componentDidUpdate(prevProps: Props) {
    const { dispatch, domain, isIPDomain } = this.props;
    if (domain !== prevProps.domain && domain !== "*" && !isIPDomain) {
      dispatch(loadDomainDNSInfo(domain));
    }
  }

  private getIconAndBody = () => {
    const { domainStatus, ingressIP, domain, dispatch, isIPDomain } = this.props;
    if (isIPDomain) {
      return {
        icon: domain === ingressIP ? <CheckCircleIcon /> : <WarningIcon color="action" />,
        body:
          domain === ingressIP ? (
            <Box p={2}>the domain is successfully configured!</Box>
          ) : (
            <Box p={2}>
              The IP address doesn’t match the ingress IP address: <strong>{ingressIP}</strong>{" "}
              <IconButtonWithTooltip
                tooltipTitle="Copy"
                aria-label="copy"
                size="small"
                onClick={() => {
                  copy(ingressIP);
                  dispatch(setSuccessNotificationAction("Copied successful!"));
                }}
              >
                <CopyIcon fontSize="small" />
              </IconButtonWithTooltip>
            </Box>
          ),
      };
    }
    const isLoading = !domainStatus?.get("cname");
    const aRecords = domainStatus?.get("aRecords");
    const isError = (!aRecords || !aRecords.includes(ingressIP)) && domain !== ingressIP;
    if (isError) {
      return {
        icon: <WarningIcon color="action" />,
        body: (
          <Box p={2}>
            please add an A record with your dns provider, point to <strong>{ingressIP}</strong>{" "}
            <IconButtonWithTooltip
              tooltipTitle="Copy"
              aria-label="copy"
              size="small"
              onClick={() => {
                copy(ingressIP);
                dispatch(setSuccessNotificationAction("Copied successful!"));
              }}
            >
              <CopyIcon fontSize="small" />
            </IconButtonWithTooltip>
          </Box>
        ),
      };
    } else if (isLoading) {
      return {
        icon: <CircularProgress size={20} style={{ marginLeft: 2, marginRight: 2 }} />,
        body: <Box p={2}>checking domain status</Box>,
      };
    } else {
      return {
        icon: <CheckCircleIcon />,
        body: <Box p={2}>the domain is successfully configured!</Box>,
      };
    }
  };

  render() {
    const { domain, mr } = this.props;
    if (domain === "*") {
      return null;
    }
    const { icon, body } = this.getIconAndBody();
    return <IconWithPopover icon={icon} popoverBody={body} popupId={`${domain}-popover`} mr={mr} />;
  }
}

export default connect(mapStateToProps)(DomainStatus);
