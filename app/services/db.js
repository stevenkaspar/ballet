import crypt      from '../utils/crypto'
import uuid       from 'uuid/v4'
import low        from 'lowdb'
import FileSync   from 'lowdb/adapters/FileSync'
import { remote } from 'electron'

const DB_PATH = remote.getGlobal('DB_PATH')
const adapter = new FileSync(DB_PATH, {
  serialize:   (data) => crypt.encrypt(JSON.stringify(data)),
  deserialize: (data) => JSON.parse(crypt.decrypt(data))
})
const db = low(adapter)

const ADDRESS_TYPES = [
  'BITCOIN'
]

db.defaults({
  addresses: [],
  user: {
    has_setup:     false,
    use_password:  false,
    email_address: null
  }
}).write()

export default db
