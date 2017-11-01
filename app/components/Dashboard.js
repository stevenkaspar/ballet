// @flow
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Provider } from 'react-redux'
import { Route } from 'react-router'
import { ConnectedRouter } from 'react-router-redux'

import { Container, Row, Col, ButtonGroup, Button } from 'reactstrap'

import CurrencyDashboard from './dashboard/CurrencyDashboard'
import TransactionRow from './dashboard/TransactionRow'


export default class Dashboard extends Component {
  constructor({store}){

    super()

    this.state = {
      selected_currency: 'BITCOIN',
      market_symbol:     'USD'
    }

    this.selectCurrency = this.selectCurrency.bind(this)

    store.dispatch({type: 'GET_DASHBOARD_CURRENCIES_INITIAL'})
  }

  get selected_currency(){
    return this.props.dashboard.find(c => c.type === this.state.selected_currency)
  }

  selectCurrency({type}){
    this.setState({
      selected_currency: type
    })
  }

  getCurrencyList(){
    let links_and_routes = []

    for(let currency of this.props.dashboard){
      let type_addresses = currency.addresses
      links_and_routes.push(
        <div key={currency.type} className='currency-card-link p-2'>
          <div className='currency-card-link-wrapper p-2' onClick={() => this.selectCurrency({type: currency.type})}>
            <span>
              <span className='currency-card-link-label'>{currency.type}</span>
              <span className='currency-card-link-subtext'>
                {currency.market_prices[this.state.market_symbol].symbol}{(currency.addresses.reduce((v, o) => {
                  return v + o.final_balance
                }, 0) * currency.market_prices[this.state.market_symbol].last / 100000000).toFixed(2)}
                <br/>
                {type_addresses.length} Address{(type_addresses.length !== 1) ? 'es' : ''}
              </span>
            </span>
          </div>
        </div>
      )
    }

    return links_and_routes
  }


  isUserAddress(public_address){
    return (this.selected_currency.addresses.filter(address => (address.public_address === public_address)).length > 0)
  }

  getTransactionsJSX(){
    let jsx = []
    let current_value = 0
    let all_addresses_txs = []

    for(let address of this.selected_currency.addresses){
      if(address.txs){
        for(let i = address.txs.length - 1; i >= 0; i -= 1){
          let tx = address.txs[i]
          all_addresses_txs.push(tx)
        }
      }
    }
    for(let tx of all_addresses_txs){
      let total_from_user  = 0
      let total_from_other = 0
      let total_to_user    = 0
      let total_to_other   = 0
      let tx_total_user    = 0
      for(let input of tx.inputs){
        if(this.isUserAddress(input.prev_out.addr)){
          total_from_user += input.prev_out.value
          current_value   -= input.prev_out.value
          tx_total_user   -= input.prev_out.value
        }
        else {
          total_from_other += input.prev_out.value
        }
      }
      for(let output of tx.out){
        if(this.isUserAddress(output.addr)){
          total_to_user += output.value
          current_value += output.value
          tx_total_user += output.value
        }
        else {
          total_to_other += output.value
        }
      }

      let fee = (total_from_user + total_from_other) - (total_to_user + total_to_other)

      jsx.unshift(
        <TransactionRow
          key={tx.hash}
          tx={tx}
          change={tx_total_user}
          fee={fee}
          remaining={current_value}/>
      )
    }
    return jsx
  }

  render() {
    return (
      <div className='absolute-full d-block d-sm-flex'>
        <div className='flex-none overflow-y-auto bg-light'>
          {this.getCurrencyList()}
        </div>
        <div className='flex-auto overflow-y-auto'>
          <h2 className='py-3 m-0 text-center border border-top-0 border-right-0 border-left-0 border-light'>{this.state.selected_currency}</h2>
          {
            this.selected_currency ?
              <CurrencyDashboard
                type={this.state.selected_currency}
                market_symbol={this.state.market_symbol}
                currency={this.selected_currency}
                />
            : null
          }
          {
            this.selected_currency ?
              <Container fluid={true} className='py-4'>
                <Row>
                  <Col xs={12}>
                    <h3>Transaction History</h3>
                  </Col>
                </Row>
                <Row>
                  <Col xs={9} md={8}>Reference</Col>
                  <Col xs={3} md={2} className={`text-right`}>
                    Change
                  </Col>
                  <Col xs={3} md={2} className='d-none d-md-block text-right'>
                    Balance
                  </Col>
                </Row>
                {this.getTransactionsJSX()}
              </Container>
            : null
          }
        </div>
      </div>
    )
  }
}
