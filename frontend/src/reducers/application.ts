import Immutable from 'immutable';
import {
  Actions,
  Application,
  CREATE_APPLICATION,
  DELETE_APPLICATION,
  DUPLICATE_APPLICATION,
  LOAD_APPLICATIONS_FULFILLED,
  LOAD_APPLICATIONS_PENDING,
  UPDATE_APPLICATION
} from '../actions';
import { ImmutableMap } from '../typings';

export type State = ImmutableMap<{
  applications: Immutable.OrderedMap<string, Application>;
  isListLoading: boolean;
  isListFirstLoaded: boolean;
}>;

const initialState: State = Immutable.Map({
  applications: Immutable.OrderedMap({}),
  isListLoading: false,
  isListFirstLoaded: false
});

const reducer = (state: State = initialState, action: Actions): State => {
  switch (action.type) {
    case LOAD_APPLICATIONS_PENDING: {
      state = state.set('isListLoading', true);
      break;
    }
    case LOAD_APPLICATIONS_FULFILLED: {
      state = state.set('isListFirstLoaded', true).set('isListLoading', false);
      let om = Immutable.OrderedMap<string, Application>();

      action.payload.applications.forEach(x => {
        om = om.set(x.get('id'), x);
      });

      state = state.set('applications', om);
      break;
    }
    case CREATE_APPLICATION: {
      const applications = state.get('applications');
      const tmpId = applications.size.toString(); // TODO fake id
      let applicationValues = action.payload.applicationValues;
      applicationValues = applicationValues.set('id', tmpId);
      state = state.set(
        'applications',
        applications.set(
          tmpId, // TODO fake id
          applicationValues
        )
      );
      break;
    }
    case UPDATE_APPLICATION: {
      const applications = state.get('applications');
      const id = action.payload.applicationId;
      let applicationValues = action.payload.applicationValues;
      applicationValues = applicationValues.set('id', id);
      state = state.set('applications', applications.set(id, applicationValues));
      break;
    }
    case DELETE_APPLICATION: {
      state = state.deleteIn(['applications', action.payload.applicationId]);
      break;
    }
    case DUPLICATE_APPLICATION: {
      const applications = state.get('applications');
      const tmpId = applications.size.toString(); // TODO fake id

      let application = applications.get(action.payload.applicationId)!;
      application = application.set('id', tmpId);

      let i = 0;
      let name = '';
      do {
        i += 1;
        name = `${application.get('name')}-duplicate-${i}`;
      } while (applications.find(x => x.get('name') === name));

      application = application.set('name', name);
      state = state.set('applications', applications.set(tmpId, application));
      break;
    }
  }

  return state;
};

export default reducer;
