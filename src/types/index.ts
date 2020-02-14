import { ThunkDispatch } from "redux-thunk";
import { RootState } from "../reducers";
import { Actions } from "../actions";

export type DispatchType = ThunkDispatch<RootState, undefined, Actions>;
