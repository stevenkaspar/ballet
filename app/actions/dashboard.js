import { addresses } from '../services'

import blockexplorer from 'blockchain.info/blockexplorer'
import exchange from 'blockchain.info/exchange'

/** SOCKETS **/
import { CURRENCY_MAPPING, MARKETS, CURRENCIES } from '../constants'

import io from 'socket.io-client/dist/socket.io'
import CCC from '../utils/cryptocompare-socket-utilities'
const socket = io.connect('https://streamer.cryptocompare.com')

let sockets_subscribed = {}

const getToFromSubscription = ({to, from}) => {
  return `2~Poloniex~${to}~${from}`
}

const subscribeTo = ({to, from}) => {
  if(!sockets_subscribed[to] || !sockets_subscribed[to][from]){

    let sub_string = getToFromSubscription({to, from})
    socket.emit('SubAdd', { subs: [sub_string] })

    if(!sockets_subscribed[to]){
      sockets_subscribed[to] = {}
    }
    sockets_subscribed[to][from] = sub_string
  }
}

for(let currency of CURRENCIES){
  let to = currency
  for(let from of MARKETS){
    subscribeTo({to, from})
  }
}
/** end of SOCKETS **/

/** MIDDLEWARE **/
const BitcoinService = {
  getAddressInfo: address => {
    return blockexplorer.getAddress(address)
  },
  getMarketPrice: () => {
    return exchange.getTicker()
  }
}

let CURRENCY_SERVICES = {
  BITCOIN: {
    getAddressInfo: BitcoinService.getAddressInfo,
    getMarketPrice: BitcoinService.getMarketPrice
  }
}

let socket_subs = []

const dashboardDataService = store => {

  socket.on('m', currentData => {
    const CURRENT_UNPACKED = CCC.CURRENT.unpack(currentData)
    if(typeof CURRENT_UNPACKED.FROMSYMBOL !== 'undefined'){
      store.dispatch({
        type: 'UPDATE_CURRENCY_MARKET_PRICE',
        data: {
          FROM:  CURRENCY_MAPPING[CURRENT_UNPACKED.FROMSYMBOL],
          TO:    CURRENT_UNPACKED.TOSYMBOL,
          PRICE: CURRENT_UNPACKED.PRICE
        }
      })
    }
  })

  console.log(store)
  return next => {
    console.log(next)
    return action => {
      console.log(action)
      /*
      Pass all actions through by default
      */
      next(action)
      switch (action.type) {
        case 'GET_DASHBOARD_CURRENCIES_INITIAL':
          /*
          In case we receive an action to send an API request, send the appropriate request
          */
          addresses.get().then(addresses => {
            let currencies = {}

            let address_promises = []

            for(let address of addresses){
              if(!currencies[address.type]){
                currencies[address.type] = {
                  type: address.type,
                  addresses: []
                }
              }

              address_promises.push(
                CURRENCY_SERVICES[address.type].getAddressInfo(address.public_address)
                  .then(response => {
                    currencies[address.type].addresses.push({
                      ...address,
                      ...response
                    })
                  })
              )
            }

            Promise.all(address_promises).then(r => {
              let data = []
              let market_prices_promises = []

              for(let type in currencies){
                market_prices_promises.push(CURRENCY_SERVICES[type].getMarketPrice().then(prices => {

                  let final_currency = {
                    ...currencies[type],
                    market_prices: prices
                  }

                  data.push(final_currency)

                  next({
                    type: 'GET_DASHBOARD_CURRENCIES_INITIAL_RECEIVED',
                    data
                  })

                }))
              }
            })
          })
          break
        /*
        Do nothing if the action does not interest us
        */
        default:
          break
      }

    }
  }
}

export default dashboardDataService
