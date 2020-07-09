import React from "react";
import { action } from "@storybook/addon-actions";
import { storiesOf } from "@storybook/react";
import { boolean } from "@storybook/addon-knobs";
import { RootDrawer } from "layout/RootDrawer";
import { AppBarComponent } from "layout/AppBar";
import { withProvider, store } from "./redux";
import { setSettingsAction } from "actions/settings";

storiesOf("Widgets/ApplicationSidebar", module)
  .addDecorator(withProvider)
  .add("Show", () => {
    store.dispatch(setSettingsAction({ isOpenRootDrawer: boolean("isOpened", true, "RootDrawer") }));
    return (
      <>
        <AppBarComponent />
        <RootDrawer />
      </>
    );
  });
