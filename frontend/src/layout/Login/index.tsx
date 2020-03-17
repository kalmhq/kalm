import { push } from "connected-react-router";
import React, { ChangeEvent } from "react";
import { connect } from "react-redux";
import { ThunkDispatch } from "redux-thunk";
import { Actions } from "../../actions";
import { loginAction } from "../../actions/auth";
import { RootState } from "../../reducers";

interface State {
  value: string;
}

interface Props {
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
    return (
      <div>
        <textarea rows={3} placeholder="type your token" onChange={this.handleChange} />
        <button onClick={this.handleSubmit}>Login</button>
      </div>
    );
  }
}

export const Login = connect()(LoginRaw);
