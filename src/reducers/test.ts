import { AnyAction } from "redux";

export interface TestState {}

const testReducer = (state: TestState = {}, action: AnyAction): TestState => {
  return state;
};

export default testReducer;
