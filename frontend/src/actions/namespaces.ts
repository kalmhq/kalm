import { push } from "connected-react-router";
import queryString from "query-string";
import { ThunkResult } from "types";
import { SET_CURRENT_NAMESPACE } from "types/namespace";

export const setCurrentNamespaceAction = (namespace: string, redirect: boolean = true): ThunkResult<Promise<void>> => {
  return async (dispatch) => {
    if (redirect) {
      const pathname = window.location.pathname;

      const pathnameSplits = pathname.split("/");
      if (pathnameSplits[1] && pathnameSplits[2] && pathnameSplits[1] === "applications") {
        pathnameSplits[2] = namespace;
        dispatch(push(pathnameSplits.join("/")));
      } else {
        const query = queryString.stringify({ ...queryString.parse(window.location.search), namespace });
        dispatch(push(pathname + "?" + query + window.location.hash));
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
