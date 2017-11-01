// @flow

const dashboard = (state = [], action) => {
  console.log(action)
	switch (action.type) {
  	case 'UPDATE_CURRENCY_MARKET_PRICE':
  		return state.map(currency => {
        if(currency.type === action.data.FROM){
          currency.market_prices[action.data.TO].last = action.data.PRICE
        }
        return currency
      })
  	case 'GET_DASHBOARD_CURRENCIES_INITIAL_RECEIVED':
  		return action.data
  	default:
  		return state
	}
}

export default dashboard
