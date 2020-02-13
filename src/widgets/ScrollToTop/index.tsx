import { Component } from "react";
import { withRouter, RouteComponentProps } from "react-router-dom";

export class ScrollToTopRaw extends Component<RouteComponentProps> {
  public componentDidUpdate(prevProps: RouteComponentProps) {
    if (this.props.location !== prevProps.location) {
      window.scrollTo(0, 0);
    }
  }

  public render = () => null;
}

export const ScrollToTop = withRouter(ScrollToTopRaw);
