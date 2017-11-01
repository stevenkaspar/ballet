// @flow
import { combineReducers } from 'redux';
import { routerReducer as router } from 'react-router-redux';
import dashboard from './dashboard';

const rootReducer = combineReducers({
  dashboard,
  router,
});

export default rootReducer;
