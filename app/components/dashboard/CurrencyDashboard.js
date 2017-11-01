import React, { Component } from 'react';

import { addresses } from '../../services'

import { CURRENCY_MAPPING } from '../../constants'

import { Container, Row, Col, ButtonGroup, Button } from 'reactstrap'

import moment  from 'moment'
import {Line}  from 'react-chartjs-2'
import cc      from 'cryptocompare'

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

  constructor(props){
    super()

    this.state = {
      historical: {
        limit: 30,
        unit:  'Day',
        data:  []
      }
    }
    this.getHistoricalData(props)
  }

  getHistoricalData(props = this.props){
    const fn = `histo${this.state.historical.unit}`

    cc[fn](CURRENCY_MAPPING[props.type], props.market_symbol, {
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

  componentWillReceiveProps(next_props){
    if(next_props.type !== this.props.type){
      this.getHistoricalData(next_props)
    }
  }

  getLineData(){
    return {
      datasets: [
        {
          label: `${this.props.type} Price ${this.props.market_symbol}`,
          lineTension: .3,
          pointRadius: 1,
          borderWidth: 1,
          data:   this.state.historical.data.map(data => {
            return {
              t: moment.unix(data.time),
              y: data.close
            }
          })
        }
      ]
    }
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
        price:      0.0,
        percentage: 0
      }
    }

    return {
      price: this.state.historical.data.slice(-1)[0].close - this.state.historical.data[0].open,
      percentage: ((this.props.currency.market_prices[this.props.market_symbol].last / this.state.historical.data[0].open) - 1) * 100
    }
  }

  render() {
    return (
      <Container fluid={true}>
        <Row className='type-status-bar'>
          <Col xs={12} sm={4}>
            <span className='type-status-bar-item'>
              <span className='type-status-bar-item-value'>
                {this.props.currency.market_prices[this.props.market_symbol].symbol}{this.props.currency.market_prices[this.props.market_symbol].last.toFixed(2)}
              </span>
              <span className='type-status-bar-item-label'>{this.props.type} Price</span>
            </span>
          </Col>
          <Col xs={12} sm={4}>
            <span className='type-status-bar-item'>
              <span className='type-status-bar-item-value'>
                {this.props.currency.market_prices[this.props.market_symbol].symbol}{this.getHistoricalChange().price.toFixed(2)}
              </span>
              <span className='type-status-bar-item-label'>Unit Change</span>
            </span>
          </Col>
          <Col xs={12} sm={4}>
            <span className='type-status-bar-item'>
              <span className='type-status-bar-item-value'>
                {this.getHistoricalChange().percentage.toFixed(2)}%
              </span>
              <span className='type-status-bar-item-label'>% Change</span>
            </span>
          </Col>
        </Row>
        <Row>
          <Col xs={12} className='text-right py-2'>
            <div className='pr-3'>
              <ButtonGroup size="sm">
                {HISTORY_RANGES.map(r => {
                  return (
                    <Button key={r.label}
                      className={(this.state.historical.limit === r.limit && this.state.historical.unit === r.unit) ? 'active' : ''}
                      onClick={() => this.setHistoricalRange(r.limit, r.unit)}>{r.label}</Button>
                  )
                })}
              </ButtonGroup>
            </div>
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
      </Container>
    );
  }
}
