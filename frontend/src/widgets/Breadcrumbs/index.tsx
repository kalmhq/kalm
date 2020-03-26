import Breadcrumbs from "@material-ui/core/Breadcrumbs";
import Link, { LinkProps } from "@material-ui/core/Link";
import Typography from "@material-ui/core/Typography";
import HomeIcon from "@material-ui/icons/Home";
import React from "react";
import { connect } from "react-redux";
import { Link as RouterLink, Route } from "react-router-dom";
import styles from "./style.module.css";

const breadcrumbNameMap: { [key: string]: string } = {
  "/applications": "Applications",
  "/applications/new": "New",
  "/applications/:namespace/:applicationName/logs": "Logs",
  "/applications/:namespace/:applicationName/shells": "Shells",
  "/applications/:namespace/:applicationName/edit": "Edit",
  "/componenttemplates": "Component Templates",
  "/componenttemplates/new": "New",
  "/componenttemplates/:componentTemplateName/edit": "Edit",
  "/configs": "Configs",
  "/configs/new": "New",
  "/configs/:componentTemplateName/edit": "Edit"
};

interface LinkRouterProps extends LinkProps {
  to: string;
  replace?: boolean;
}

const LinkRouter = (props: LinkRouterProps) => <Link {...props} component={RouterLink as any} />;

const BreadcrumbRaw = () => {
  return (
    <Route>
      {({ match }) => {
        const matchedPathNames = match!.path.split("/").filter(x => x);

        return (
          <Breadcrumbs aria-label="breadcrumb" className={styles.breadcrumbs}>
            <LinkRouter color="textSecondary" to="/">
              <HomeIcon fontSize="small" />
            </LinkRouter>
            {matchedPathNames.map((value, index) => {
              const last = index === matchedPathNames.length - 1;
              let to = `/${matchedPathNames.slice(0, index + 1).join("/")}`;
              let content = breadcrumbNameMap[to];

              if (value.startsWith(":")) {
                content = match!.params[value.slice(1)];
                to = to.replace(value, match!.params[value.slice(1)]);
              }

              return last ? (
                <Typography color="textSecondary" key={to}>
                  {content}
                </Typography>
              ) : (
                <LinkRouter color="textSecondary" to={to} key={to}>
                  {content}
                </LinkRouter>
              );
            })}
          </Breadcrumbs>
        );
      }}
    </Route>
  );
};

export const Breadcrumb = connect()(BreadcrumbRaw);
