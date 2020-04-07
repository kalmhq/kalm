import React from "react";
import { createStyles, Theme, withStyles, WithStyles, Box, Typography } from "@material-ui/core";
import { TDispatchProp } from "types";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { getServiceAccountSecret } from "actions/kubernetesApi";
import SyntaxHighlighter from "react-syntax-highlighter";
import { monokai } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { FlexRowItemCenterBox } from "./Box";
import { IconButtonWithTooltip } from "./IconButtonWithTooltip";
import FileCopyIcon from "@material-ui/icons/FileCopy";
import { setSuccessNotificationAction, setErrorNotificationAction } from "actions/notification";

const styles = (theme: Theme) =>
  createStyles({
    root: {}
  });

const mapStateToProps = (state: RootState) => {
  return {};
};

interface Props extends WithStyles<typeof styles>, ReturnType<typeof mapStateToProps>, TDispatchProp {
  serviceAccountName: string;
}

interface State {
  token: string;
  "ca.crt": string;
}

class ServiceAccountSecretRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      token: "",
      "ca.crt": ""
    };
  }

  async loadData() {
    if (!this.props.serviceAccountName) {
      return;
    }
    const res = await getServiceAccountSecret(this.props.serviceAccountName);
    this.setState({
      token: res.token,
      "ca.crt": res["ca.crt"]
    });
  }

  componentDidMount() {
    this.loadData();
  }

  componentDidUpdate() {
    this.loadData();
  }

  private copyText = (text: string) => {
    const { dispatch } = this.props;
    navigator.clipboard.writeText(text).then(
      function() {
        dispatch(setSuccessNotificationAction("Copied successful!"));
      },
      function(err) {
        dispatch(setErrorNotificationAction("Copied failed!"));
      }
    );
  };

  private renderData(title: string, content: string) {
    return (
      <div>
        <FlexRowItemCenterBox justifyContent="space-between">
          <Typography variant="h6">{title}</Typography>
          <IconButtonWithTooltip
            size="small"
            tooltipTitle="Copy"
            onClick={() => {
              this.copyText(content);
            }}>
            <FileCopyIcon />
          </IconButtonWithTooltip>
        </FlexRowItemCenterBox>

        <SyntaxHighlighter
          language={"text"}
          style={monokai}
          wrapLines={true}
          customStyle={{
            whiteSpace: "pre-wrap",
            wordBreak: "break-all"
          }}>
          {content}
        </SyntaxHighlighter>
      </div>
    );
  }

  public render() {
    const { classes, dispatch } = this.props;
    return (
      <div className={classes.root}>
        {this.renderData("Token", this.state.token)}
        {this.renderData("ca.crt", this.state["ca.crt"])}
      </div>
    );
  }
}

export const ServiceAccountSecret = withStyles(styles)(connect(mapStateToProps)(ServiceAccountSecretRaw));
