// @flow
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Provider } from 'react-redux'
import { Route } from 'react-router'
import { ConnectedRouter } from 'react-router-redux'
import Types from './dashboard/types';
import CurrencyCardLink from './dashboard/CurrencyCardLink';


import { Form, FormGroup, Input, Label, Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap'

import bitcoin from 'bitcoinjs-lib'

import { user, addresses } from '../services'

export default class Dashboard extends Component {
  constructor(){
    super()

    this.state = {
      addresses: []
    }

    this.getAddresses()
  }

  getAddresses(){
    addresses.get().then(addresses => {
      this.setState({ addresses })
    })
  }

  getLinksAndRoutes(){
    let links_and_routes = []

    for(let key in Types){
      let type_addresses = this.state.addresses.filter(a => (a.type === key.toUpperCase()))
      links_and_routes.push(
        {
          key:   key,
          link:  <CurrencyCardLink key={key} to={`/dashboard/${key}`} link_text={
            <span>
              <span className='currency-card-link-label'>{key}</span>
              <span className='currency-card-link-subtext'>{type_addresses.length} Address{(type_addresses.length === 1) ? 'es' : ''}</span>
            </span>
          }/>,
          route: <Route key={key} path={`/dashboard/${key}`} component={Types[key]}/>
        }
      )
    }

    return links_and_routes
  }

  render() {
    const links_and_routes = this.getLinksAndRoutes()
    return (
      <div className='absolute-full d-block d-sm-flex'>
        <div className='flex-none overflow-y-auto bg-light'>
          {links_and_routes.map(lr => lr.link)}
        </div>
        <div className='flex-auto overflow-y-auto'>
          <Provider store={this.props.store}>
            <ConnectedRouter history={this.props.history}>
              <div>
                {links_and_routes.map(lr => lr.route)}
              </div>
            </ConnectedRouter>
          </Provider>
        </div>
      </div>
    )
  }
}
