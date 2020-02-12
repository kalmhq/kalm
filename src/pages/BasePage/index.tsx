import React from "react";
import { PageHeader, PageHeaderProps } from "../../widgets/PageHeader";

export interface BasePageProps extends PageHeaderProps {
  children?: React.ReactNode;
  className?: string;
}

export class BasePage extends React.PureComponent<BasePageProps> {
  public render() {
    const { className, children } = this.props;
    return (
      <div className={className}>
        <PageHeader {...this.props}></PageHeader>
        {children}
      </div>
    );
  }
}
