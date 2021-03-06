const redis = require('../redis')
const log = require('debug')('assemble:user-checkpoints')
const { distance, filterobj } = require('../utils')
const { CHECKPOINT_JOIN_DISTANCE } = require('./consts')
const panic = err => { throw err }


const determineLeaveJoins = (uid, [checks, loc]) => {
  const toLeave = []
  const toJoin = []

  checks.forEach(c => {
    const cloc = c.loc.map(c => c + 250)

    if (distance(cloc, loc.map(c => c + 50)) < CHECKPOINT_JOIN_DISTANCE) {
      if (!c.members.includes(uid)) {
        toJoin.push(c.id)
      }
    } else {
      if (c.members.includes(uid)) {
        toLeave.push(c.id)
      }
    }
  })

  return { join: toJoin, leave: toLeave }
}

const doLeaveJoins = (redisRoom, uid, should) =>
  new Promise((resolve, reject) => {
    if (should.join.length == 0 && should.leave.length == 0)
      return resolve(false)

    const me = redisRoom.checkpoints.user(uid)

    Promise.all(should.join.map(me.join).concat(should.leave.map(me.leave)))
      .then(_ => resolve(true))
      .catch(reject)
  })

module.exports = ({ room, uid }, queue) =>
  new Promise((resolve, reject) => {
    const redisRoom = redis.room(room)

    Promise.all([redisRoom.checkpoints.getAll(), redisRoom.locations.get(uid)])
      .then(data =>
        doLeaveJoins(redisRoom, uid, determineLeaveJoins(uid, data))
      )
      .then(requiresUpdate => {
        if (requiresUpdate) {
          const event = 'checkpoints'

          redisRoom.checkpoints
            .getAll()
            .then(data => {
              queue.create(`update-${room}`, { event, data }).save()
              resolve(null)
            })
            .catch(reject)
        } else {
          resolve(null)
        }
      })
      .catch(reject)
  })
