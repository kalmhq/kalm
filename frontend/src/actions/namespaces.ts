import { push } from "connected-react-router";
import { ThunkResult } from "types";
import { SET_CURRENT_NAMESPACE } from "types/namespace";

export const setCurrentNamespaceAction = (namespace: string, redirect: boolean = true): ThunkResult<Promise<void>> => {
  return async (dispatch) => {
    if (redirect) {
      const pathname = window.location.pathname;
      const pathnameSplits = pathname.split("/");
      // eg. "/applications/app1/components/component1".split("/")
      // => ["", "applications", "app1", "components", "component1"]
      if (pathnameSplits[1] && pathnameSplits[2] && pathnameSplits[1] === "applications") {
        pathnameSplits[2] = namespace;
        if (pathnameSplits[4]) {
          pathnameSplits[4] = "";
        }
        dispatch(push(pathnameSplits.join("/")));
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
