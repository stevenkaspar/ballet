// @flow
import React, { Component } from 'react';
import Dashboard from '../components/Dashboard';

export default class DashboardPage extends Component {
  render() {
    return (
      <Dashboard {...this.props}/>
    );
  }
}
