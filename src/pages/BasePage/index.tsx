import React from "react";
import PageHeader from "../../widgets/PageHeader";
import { Variant } from "@material-ui/core/styles/createTypography";

export interface BasePageProps {
  title: string;
  children?: React.ReactNode;
  className?: string;
  noBreadcrumb?: boolean;
  variant?: Variant;
}

export class BasePage extends React.PureComponent<BasePageProps> {
  public render() {
    const { variant, className, noBreadcrumb, title, children } = this.props;
    return (
      <div className={className}>
        <PageHeader
          title={title}
          variant={variant}
          noBreadcrumb={!!noBreadcrumb}
        ></PageHeader>
        {children}
      </div>
    );
  }
}
