import { push } from "connected-react-router";
import React, { ChangeEvent } from "react";
import { connect } from "react-redux";
import { ThunkDispatch } from "redux-thunk";
import { Actions } from "../../actions";
import { loginAction } from "../../actions/auth";
import { RootState } from "../../reducers";
import { Button, TextField, Theme, withStyles, Paper, WithStyles, createStyles } from "@material-ui/core";

const styles = (theme: Theme) =>
  createStyles({
    loginPaper: {
      backgroundColor: "#2196F3",
      height: "286px",
      width: "100%",
      marginTop: "calc( 50vh - 183px )"
    },
    paperContainer: {
      maxWidth: "850px",
      height: "100%",
      margin: "0 auto",
      position: "relative"
    },
    portalText: {
      color: "#fff",
      fontWeight: "bold",
      fontSize: "18px",
      position: "absolute",
      top: "133px",
      left: "8px"
    },
    loginTriangle: {
      width: 0,
      height: 0,
      borderBottom: "163px solid #fff",
      borderLeft: "163px solid transparent",
      position: "absolute",
      right: "415px",
      top: "61px",
      boxShadow: "4px 4px 4px rgba(0, 0, 0, 0.2)"
    },
    loginArea: {
      width: "415px",
      height: "163px",
      position: "absolute",
      right: "0",
      top: "61px",
      backgroundColor: "#fff",
      boxShadow: "4px 4px 4px rgba(0, 0, 0, 0.2)",
      borderTopRightRadius: "4px",
      borderBottomRightRadius: "4px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "20px"
    },
    input: {
      width: "280px"
    }
  });

interface State {
  value: string;
}

interface Props extends WithStyles<typeof styles> {
  dispatch: ThunkDispatch<RootState, undefined, Actions>;
}

export class LoginRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      value: ""
    };
  }

  private handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    this.setState({ value: event.target.value });
  };

  private handleSubmit = async () => {
    const res = await this.props.dispatch(loginAction(this.state.value));

    if (res) {
      this.props.dispatch(push("/"));
    }
  };

  public render() {
    const { classes } = this.props;

    return (
      <div>
        <Paper className={classes.loginPaper} square>
          <div className={classes.paperContainer}>
            <div className={classes.portalText}>OpenCore KApp Portal</div>
            <div className={classes.loginTriangle}></div>
            <div className={classes.loginArea}>
              <TextField
                className={classes.input}
                id="login-token"
                label="Token"
                variant="outlined"
                placeholder="type your token"
                onChange={this.handleChange}
              />
              <Button variant="contained" color="primary" onClick={this.handleSubmit}>
                Login
              </Button>
            </div>
          </div>
        </Paper>
      </div>
    );
  }
}

export const Login = connect()(withStyles(styles)(LoginRaw));
