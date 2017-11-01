import React, { Component } from 'react'

import CurrencyDashboard from './CurrencyDashboard'
import TransactionRow from './TransactionRow'

import { addresses } from '../../../services'

import { Container, Row, Col, ButtonGroup, Button } from 'reactstrap'

import moment  from 'moment'
import request from 'request'
import bitcoin from 'bitcoinjs-lib'
import cc      from 'cryptocompare'

const ADDRESS_DATA_URL = 'https://blockchain.info/rawaddr'

export default class BitcoinDashboard extends CurrencyDashboard {

  constructor(){
    super()
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

  fetchUSDPerCrypto(){
    request({
      method: 'get',
      url: 'https://blockchain.info/ticker'
    }, (error, response, body) => {
      body = JSON.parse(body)
      this.setState({
        usd_per_crypto: body.USD.last
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
          key={tx.hash}
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

}
