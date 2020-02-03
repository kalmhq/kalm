import React from "react";
import Breadcrumbs from "@material-ui/core/Breadcrumbs";
import { Link as RouterLink, Route } from "react-router-dom";
import Link, { LinkProps } from "@material-ui/core/Link";
import Typography from "@material-ui/core/Typography";
import styles from "./style.module.css";
import HomeIcon from "@material-ui/icons/Home";

const breadcrumbNameMap: { [key: string]: string } = {
  "/apps": "Applications",
  "/apps/new": "New",
  "/components": "Components",
  "/components/new": "New"
};

interface LinkRouterProps extends LinkProps {
  to: string;
  replace?: boolean;
}

const LinkRouter = (props: LinkRouterProps) => (
  <Link {...props} component={RouterLink as any} />
);

export const Breadcrumb = () => {
  return (
    <Route>
      {({ location }) => {
        const pathnames = location.pathname.split("/").filter(x => x);
        return (
          <Breadcrumbs aria-label="breadcrumb" className={styles.breadcrumbs}>
            <LinkRouter color="inherit" to="/">
              <HomeIcon fontSize="small" />
            </LinkRouter>
            {pathnames.map((value, index) => {
              const last = index === pathnames.length - 1;
              const to = `/${pathnames.slice(0, index + 1).join("/")}`;

              return last ? (
                <Typography color="textPrimary" key={to}>
                  {breadcrumbNameMap[to]}
                </Typography>
              ) : (
                <LinkRouter color="inherit" to={to} key={to}>
                  {breadcrumbNameMap[to]}
                </LinkRouter>
              );
            })}
          </Breadcrumbs>
        );
      }}
    </Route>
  );
};
