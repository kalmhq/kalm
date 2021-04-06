import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import React from "react";
import { FormSpy } from "react-final-form";
import { connect } from "react-redux";
import { RouteComponentProps, withRouter } from "react-router-dom";
import { RootState } from "store";
import { TDispatchProp } from "types";
import sc from "utils/stringConstants";

const styles = (theme: Theme) =>
  createStyles({
    root: {},
  });

const mapStateToProps = (state: RootState) => {
  return {};
};

interface Props
  extends WithStyles<typeof styles>,
    ReturnType<typeof mapStateToProps>,
    TDispatchProp,
    RouteComponentProps,
    OuterProps {
  when?: boolean;
}

interface OuterProps {
  message?: string;
}

class PromptRaw extends React.PureComponent<Props> {
  unregister?: any;

  componentDidMount(): void {
    const { history, message, location } = this.props;

    window.addEventListener("beforeunload", this.beforeunload);

    this.unregister = history.block((nextLocation) => {
      // return value meanings:
      //   void: allow to change
      //   false: prevent the change
      //   string: ask to change

      if (process.env.REACT_APP_DEBUG === "true") {
        return;
      }

      // `when` must be fetched from props on each call, can't use a closure value
      if (!this.props.when) {
        return;
      }

      if (nextLocation.pathname === location.pathname) {
        return;
      }

      return message || sc.CONFIRM_LEAVE_WITHOUT_SAVING;
    });
  }

  componentWillUnmount() {
    this.unregister && this.unregister();
    window.removeEventListener("beforeunload", this.beforeunload);
  }

  private beforeunload = (e: any) => {
    if (!this.props.when) {
      return;
    }

    if (process.env.REACT_APP_DEBUG === "true") {
      return;
    }

    e.preventDefault();
    e.returnValue = "Are your sure to leave without saving changes?";
    return "Are your sure to leave without saving changes?";
  };

  public render() {
    return null;
  }
}

const PromptWrapper = withStyles(styles)(connect(mapStateToProps)(withRouter(PromptRaw)));

export class Prompt extends React.PureComponent<OuterProps> {
  render() {
    return (
      <FormSpy>
        {({ dirty, submitting }) => {
          return <PromptWrapper when={dirty && !submitting} message={this.props.message} />;
        }}
      </FormSpy>
    );
  }
}
