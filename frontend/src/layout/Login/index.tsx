import { createStyles, Paper, TextField, Theme, WithStyles, withStyles } from "@material-ui/core";
import { grey } from "@material-ui/core/colors";
import { validateTokenAction } from "actions/auth";
import { RootState } from "configureStore";
import { push } from "connected-react-router";
import React, { ChangeEvent } from "react";
import { connect } from "react-redux";
import { ThunkDispatch } from "redux-thunk";
import CustomButton from "theme/Button";
import { Actions } from "types";
import { KalmLogo2Icon, KalmTextLogoIcon } from "widgets/Icon";
import { KMLink } from "widgets/Link";

const styles = (theme: Theme) =>
  createStyles({
    loginPaper: {
      backgroundColor: theme.palette.type === "light" ? theme.palette.primary.main : "",
      height: "286px",
      width: "100%",
      position: "fixed",
      top: "calc( 50vh - 183px )",
    },
    paperContainer: {
      maxWidth: "850px",
      height: "100%",
      margin: "0 auto",
      position: "relative",
    },
    portalText: {
      color: "#fff",
      fontWeight: "bold",
      fontSize: "42px",
      position: "absolute",
      top: "113px",
      left: "8px",
    },
    loginTriangle: {
      width: 0,
      height: 0,
      borderBottom: theme.palette.type === "light" ? `163px solid ${grey[50]}` : `163px solid ${grey[800]}`,
      borderLeft: "163px solid transparent",
      position: "absolute",
      right: "415px",
      top: "61px",
      boxShadow: "4px 4px 4px rgba(0, 0, 0, 0.2)",
    },
    loginArea: {
      width: "415px",
      height: "163px",
      position: "absolute",
      right: "0",
      top: "61px",
      backgroundColor: theme.palette.type === "light" ? grey[50] : grey[800],
      boxShadow: "4px 4px 4px rgba(0, 0, 0, 0.2)",
      borderTopRightRadius: "4px",
      borderBottomRightRadius: "4px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "20px",
    },
    input: {
      width: "280px",
      marginTop: "20px",
    },
  });

interface State {
  value: string;
  error?: string;
}

interface Props extends WithStyles<typeof styles> {
  dispatch: ThunkDispatch<RootState, undefined, Actions>;
}

export class LoginRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      value: "",
      error: undefined,
    };
  }

  private handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    this.setState({ value: event.target.value, error: undefined });
  };

  private handleSubmit = async () => {
    if (!this.state.value) {
      this.setState({ error: "Auth token is required." });
      return;
    }

    const errorMessage = await this.props.dispatch(validateTokenAction(this.state.value));

    if (!errorMessage) {
      this.props.dispatch(push("/"));
    } else {
      this.setState({ error: errorMessage as any });
    }
  };

  public render() {
    const { classes } = this.props;
    const { error } = this.state;
    const instructions = (
      <>
        <KMLink target="_blank" href="https://docs.kalm.dev/install#step-4-admin-service-account">
          View instructions
        </KMLink>{" "}
        for token geneneration
      </>
    );
    return (
      <div>
        <Paper className={classes.loginPaper}>
          <div className={classes.paperContainer}>
            <div className={classes.portalText}>
              <KalmLogo2Icon style={{ width: 64, height: 64 }} />
              <KalmTextLogoIcon style={{ paddingLeft: 12, width: 100, height: 64 }} />
            </div>
            <div className={classes.loginTriangle}></div>
            <div className={classes.loginArea}>
              <TextField
                className={classes.input}
                id="login-token"
                size="small"
                variant="outlined"
                placeholder="Paste token here"
                onChange={this.handleChange}
                helperText={error ? error : instructions}
                error={!!error}
              />

              <CustomButton color="primary" onClick={this.handleSubmit}>
                Login
              </CustomButton>
            </div>
          </div>
        </Paper>
      </div>
    );
  }
}

export const Login = connect()(withStyles(styles)(LoginRaw));
