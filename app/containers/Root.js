// @flow
import React from 'react';
import { Provider } from 'react-redux';
import { ConnectedRouter } from 'react-router-redux';
import { Route } from 'react-router';
import HomePage from './HomePage';
import DashboardPage from './DashboardPage';

export default function Root({ store, history }) {
  return (
    <Provider store={store}>
      <ConnectedRouter history={history}>
        <div>
          <Route exact path="/" render={props => <HomePage {...props} store={store}/>} />
          <Route path="/dashboard/:type?" render={props => <DashboardPage {...props} store={store}/>} />
        </div>
      </ConnectedRouter>
    </Provider>
  );
}
