import db from './db'

let getAddresses = (filter = {}) => {
  return new Promise((resolve, reject) => {
    try {
      resolve(db.get(`addresses`).filter(filter).value())
    }
    catch(e){
      reject(e.message)
    }
  })
}

let addAddress = ({public_address, private_key, type = 'BITCOIN'}) => {
  return new Promise((resolve, reject) => {
    try {
      let address = {
        public_address,
        private_key,
        type
      }

      db.get(`addresses`)
        .push(address)
        .write()

      resolve(address)
    }
    catch(e){
      reject(e.message)
    }
  })
}

export default {
  get: getAddresses,
  add: addAddress
}
