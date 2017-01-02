/*
 * Set up socket connections
 */

const expect = require('chai').expect
const io = require('socket.io-client')
const request = require('superagent')

global.GET_ROOM_URL = room => `http://localhost:3000/${room}`

global.NUM_PARTICIPANTS = 10
global.SOCKET_OPTIONS = {
  transports: ['websocket'],
  forceNew: true
}

describe('Clients should be able to connect', () => {
  it('All should be connected', done => {

    request
    .get('http://localhost:3000/room/test')
    .end((err, res) => {
      global.socks = new Array(NUM_PARTICIPANTS).fill(null)
        .map(i => io.connect(GET_ROOM_URL('test'), SOCKET_OPTIONS))

      const connectionPromises = socks
        .map((s, idx) =>
          new Promise((resolve, reject) =>
            s.on('connect', () => resolve(idx))
          )
        )

      Promise.all(connectionPromises)
      .then(idxs => {
        expect(idxs).to.have.length(NUM_PARTICIPANTS)

        socks.forEach(s => s.on('users', data => {s.users = data}))
        done()
      })
      .catch(err => done(err))
    })
  })
})

/*
 * Run other tests
 */
require('./user-enter-exit')
