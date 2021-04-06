import { push } from "connected-react-router";
import { ThunkResult } from "types";
import { SET_CURRENT_NAMESPACE } from "types/namespace";

export const setCurrentNamespaceAction = (namespace: string, redirect: boolean = true): ThunkResult<Promise<void>> => {
  return async (dispatch) => {
    if (redirect) {
      const pathname = window.location.pathname;
      const pathnameSplits = pathname.split("/");
      // eg. "/namespaces/app1/components/component1/edit".split("/")
      // => ["", "namespaces", "app1", "components", "component1", "edit"]
      if (pathnameSplits[1] && pathnameSplits[2] && pathnameSplits[1] === "applications") {
        pathnameSplits[2] = namespace;
        dispatch(push(pathnameSplits.slice(0, 4).join("/")));
      }
    }

    dispatch({
      type: SET_CURRENT_NAMESPACE,
      payload: {
        namespace,
      },
    });
  };
};
