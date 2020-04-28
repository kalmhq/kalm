import { push } from "connected-react-router";
import queryString from "query-string";
import { ThunkResult } from "../types";
import { SET_CURRENT_NAMESPACE } from "../types/namespace";

export const setCurrentNamespaceAction = (namespace: string, redirect: boolean = true): ThunkResult<Promise<void>> => {
  return async dispatch => {
    if (redirect) {
      const query = queryString.stringify({ ...queryString.parse(window.location.search), namespace });
      dispatch(push(window.location.pathname + "?" + query + window.location.hash));
    }

    dispatch({
      type: SET_CURRENT_NAMESPACE,
      payload: {
        namespace
      }
    });
  };
};
