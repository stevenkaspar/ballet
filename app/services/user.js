import db from './db'

let getUser = field => {
  return new Promise((resolve, reject) => {
    try {
      resolve(db.get(`user${field ? `.${field}` : ''}`).value())
    }
    catch(e){
      reject(e.message)
    }
  })
}

let setUser = (field, value) => {
  return new Promise((resolve, reject) => {
    try {
      db.set(`user.${field}`, value).write()
      resolve(getUser())
    }
    catch(e){
      reject(e.message)
    }
  })
}

export default {
  get: getUser,
  set: setUser
}
