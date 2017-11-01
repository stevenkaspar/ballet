import React, { Component } from 'react';

import { addresses } from '../../../services'

import { Container, Row, Col, ButtonGroup, Button } from 'reactstrap'

import request from 'request'
import bitcoin from 'bitcoinjs-lib'
import moment from 'moment'
import cc     from 'cryptocompare'
import {Line} from 'react-chartjs-2'

const ADDRESS_DATA_URL = 'https://blockchain.info/rawaddr'

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


class TransactionRow extends Component {
  render(){
    const color = this.props.change > 0 ? 'success' : (this.props.change === 0) ? 'dark' : 'danger'
    return (
      <Row key={this.props.tx.hash} className='py-2'>
        <Col xs={9} md={8}>
          <span className='text-primary word-break-all'>
            {this.props.tx.hash}
          </span>
          <br/>
          <span className='text-muted'>
            {moment.unix(this.props.tx.time).format('YYYY-M-D h:mm a')}
          </span>
        </Col>
        <Col xs={3} md={2} className={`text-${color} text-right`}>
          {this.props.change}
        </Col>
        <Col xs={3} md={2} className='d-none d-md-block text-right'>
          {this.props.remaining}
        </Col>
      </Row>
    )
  }
}

export default class BitcoinDashboard extends Component {

  constructor(){
    super()

    this.state = {
      addresses:   [],
      usd_per_btc: 0.00,
      historical: {
        limit: 30,
        unit:  'Day',
        data:  []
      }
    }

    this.fetchUSDPerBTC = this.fetchUSDPerBTC.bind(this)

    this.getAddresses()
    this.fetchUSDPerBTC()
    this.getHistoricalData()
  }

  get total_value(){
    let current_value = 0
    for(let address of this.state.addresses){
      if(address.data){
        for(let tx of address.data.txs){
          for(let input of tx.inputs){
            if(input.prev_out.addr === address.public_address){
              current_value -= input.prev_out.value
            }
          }
          for(let output of tx.out){
            if(output.addr === address.public_address){
              current_value += output.value
            }
          }
        }
      }
    }
    return current_value
  }

  fetchUSDPerBTC(){
    request({
      method: 'get',
      url: 'https://blockchain.info/ticker'
    }, (error, response, body) => {
      body = JSON.parse(body)
      this.setState({
        usd_per_btc: body.USD.last
      })
    })
  }

  getHistoricalData(){
    const fn = `histo${this.state.historical.unit}`

    cc[fn]('BTC', 'USD', {
      limit: this.state.historical.limit
    }).then(data => {
      this.setState({
        historical: {
          ...this.state.historical,
          data: data
        }
      })
    }).catch(console.error)
  }

  getLineData(){

    const historical_data = this.state.historical.data

    return {
      datasets: [
        {
          label: 'Bitcoin Price USD',
          lineTension: .3,
          pointRadius: 1,
          borderWidth: 1,
          data:  historical_data.map(data => {
            return {
              t: moment.unix(data.time),
              y: data.close
            }
          })
        }
      ]
    }
  }

  isUserAddress(public_address){
    return (this.state.addresses.filter(address => (address.public_address === public_address)).length > 0)
  }

  getTransactionsJSX(){
    let jsx = []
    let current_value = 0
    let all_addresses_txs = []

    for(let address of this.state.addresses){
      if(address.data){
        for(let i = address.data.txs.length - 1; i >= 0; i -= 1){
          let tx = address.data.txs[i]
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
          tx={tx}
          change={tx_total_user}
          fee={fee}
          remaining={current_value}/>
      )
    }
    return jsx
  }

  getAddresses(){

    addresses.get({type: 'BITCOIN'}).then(addresses => {
      this.setState({
        addresses: addresses
      })
      this.getAddressesData({addresses})
    })

  }

  getAddressesData({addresses = this.state.address}){
    let promises = []
    for(let address of addresses){
      promises.push(new Promise((resolve, reject) => {
        request({
          method: 'get',
          url: `${ADDRESS_DATA_URL}/${address.public_address}`
        }, (error, response, body) => {
          if(error){
            return reject(error)
          }
          resolve(JSON.parse(body))
        })
      }))
    }

    Promise.all(promises).then(data => {
      this.state.addresses.forEach((address, index) => {
        address.data = data[index]
      })
      this.setState({
        addresses: this.state.addresses
      })
    })
  }

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
      percentage: ((this.state.usd_per_btc / this.state.historical.data[0].open) - 1) * 100
    }
  }

  render() {
    const ranges = [
      {limit: 60, unit: 'Minute', label: '1H'},
      {limit: 24, unit: 'Hour', label: '1D'},
      {limit: 168, unit: 'Hour', label: '1W'},
      {limit: 30, unit: 'Day', label: '1M'},
      {limit: 365, unit: 'Day', label: '1Y'},
      {limit: 'none', unit: 'Day', label: 'All'},
    ]
    return (
      <Container fluid={true}>
        <Row className='type-status-bar'>
          <Col xs={12} sm={4}>
            <span className='type-status-bar-item'>${this.state.usd_per_btc.toFixed(2)}</span>
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
              {ranges.map(r => {
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

// export default (props) => {
//   return (
//     <BitcoinDashboard {...props}/>
//   )
// }
