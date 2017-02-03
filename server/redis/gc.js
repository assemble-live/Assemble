const config = require('./config')
const client = require('./client')
const log = require('debug')('assemble:garbage-collection')

const {
  sortbine, objectify, keyify, callbackify, distance, array, print
} = require('../utils')

const e = {}

e.user = (room, uid) => new Promise((resolve, reject) => {
  const otherUsers = client.smembers(`${room}:users`, (err, uids) => {
    const me = uid
    const others = uids.filter(u => u != me)

    const toDel = [].concat(
      uids.map(keyify('users')),
      uids.map(keyify('loc')),
      uids.map(keyify('vol')),
      uids.map(keyify('vol')),
      others.map(sortbine(me)).filter(sbnd => sbnd).map((keyify('att')))
    )

    client
    .multi()
    .srem(`${room}:users`, me)
    .del(toDel)
    .exec((err, numDeleted) => {
      if (err) {
        log('Could not garbage collect user %s: %j', uid, err)
        return reject(err)
      }

      return resolve(numDeleted)
    })
  })
})

e.check = (room, cid) => new Promise((resolve, reject) =>
  client
  .multi()
  .srem(`${room}:checks`, cid)
  .del(keyfify('checks')(cid))
  .exec((err, numDeleted) => {
    if (err) {
      log('Could not garbage collect check %s: %j', cid, err)
      return reject(err)
    }
  })
)

e.room = (room) => new Promise((resolve, reject) =>
  client
  .multi()
  .smembers(`${room}:users`)
  .smembers(`${room}:checks`)
  .exec((err, [uids, cids]) =>
    Promise
    .all([].concat(
      uids.map(u => e.user(room, u)),
      cids.map(c => e.check(room, c))
    ))
    .then(resolve)
    .catch(reject)
  )
)

module.exports = e
