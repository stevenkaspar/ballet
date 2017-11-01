import React, { Component } from 'react';

import { addresses } from '../../../services'

import TransactionRow from './TransactionRow'

import { Container, Row, Col, ButtonGroup, Button } from 'reactstrap'

import moment  from 'moment'
import {Line}  from 'react-chartjs-2'

const LINE_OPTIONS = {
  scales: {
    xAxes: [{
      type: 'time',
      time: {
        displayFormats: {
           'millisecond': 'MMM DD',
           'second': 'MMM DD',
           'minute': 'MMM DD',
           'hour': 'MMM DD',
           'day': 'MMM DD',
           'week': 'MMM DD',
           'month': 'MMM DD',
           'quarter': 'MMM DD',
           'year': 'MMM DD',
        }
      }
    }]
  },
  legend: {
    display: false
  }
}

const HISTORY_RANGES = [
  {limit: 60, unit: 'Minute', label: '1H'},
  {limit: 24, unit: 'Hour', label: '1D'},
  {limit: 168, unit: 'Hour', label: '1W'},
  {limit: 30, unit: 'Day', label: '1M'},
  {limit: 365, unit: 'Day', label: '1Y'},
  {limit: 'none', unit: 'Day', label: 'All'},
]

export default class CurrencyDashboard extends Component {

  constructor(){
    super()

    this.state = {
      addresses:   [],
      usd_per_crypto: 0.00,
      historical: {
        limit: 30,
        unit:  'Day',
        data:  []
      }
    }

    this.fetchUSDPerCrypto = this.fetchUSDPerCrypto.bind(this)

    this.getAddresses()
    this.fetchUSDPerCrypto()
    this.getHistoricalData()
  }

  get total_value(){
    return 0
  }

  fetchUSDPerCrypto(){
    this.setState({
      usd_per_crypto: 0
    })
  }

  getHistoricalData(){

    this.setState({
      historical: {
        ...this.state.historical,
        data: {}
      }
    })

  }

  getLineData(){

    return {
      datasets: []
    }
  }

  isUserAddress(public_address){
    return (this.state.addresses.filter(address => (address.public_address === public_address)).length > 0)
  }

  getTransactionsJSX(){
    return []
  }

  getAddresses(){

    addresses.get({}).then(addresses => {
      this.setState({
        addresses: addresses
      })
      this.getAddressesData({addresses})
    })

  }

  getAddressesData(){}

  setHistoricalRange(limit, unit){
    this.setState({
      historical: {
        ...this.state.historical,
        limit: limit,
        unit:  unit
      }
    }, this.getHistoricalData)
  }

  getHistoricalChange(){
    if(this.state.historical.data.length < 2){
      return {
        usd:        0.0,
        percentage: 0
      }
    }

    return {
      usd: this.state.historical.data.slice(-1)[0].close - this.state.historical.data[0].open,
      percentage: ((this.state.usd_per_crypto / this.state.historical.data[0].open) - 1) * 100
    }
  }

  render() {
    return (
      <Container fluid={true}>
        <Row className='type-status-bar'>
          <Col xs={12} sm={4}>
            <span className='type-status-bar-item'>${this.state.usd_per_crypto.toFixed(2)}</span>
          </Col>
          <Col xs={12} sm={4}>
            <span className='type-status-bar-item'>${this.getHistoricalChange().usd.toFixed(2)}</span>
          </Col>
          <Col xs={12} sm={4}>
            <span className='type-status-bar-item'>{this.getHistoricalChange().percentage.toFixed(2)}%</span>
          </Col>
        </Row>
        <Row>
          <Col xs={12}>
            <ButtonGroup size="sm">
              {HISTORY_RANGES.map(r => {
                return (
                  <Button key={r.label}
                    className={(this.state.historical.limit === r.limit && this.state.historical.unit === r.unit) ? 'active' : ''}
                    onClick={() => this.setHistoricalRange(r.limit, r.unit)}>{r.label}</Button>
                )
              })}
            </ButtonGroup>
          </Col>
        </Row>
        <Row>
          <Col xs={12}>
            <Line
              data={this.getLineData()}
              height={75}
              options={LINE_OPTIONS} />
          </Col>
        </Row>
        <Row>
          <Col xs={12}>
            <Container fluid={true}>
              <Row>
                <Col xs={9} md={8}>Reference</Col>
                <Col xs={3} md={2} className='text-right'>Amount</Col>
                <Col xs={3} md={2} className='d-none d-md-block text-right'>Balance</Col>
              </Row>
              {this.getTransactionsJSX()}
            </Container>
          </Col>
        </Row>
      </Container>
    );
  }
}
