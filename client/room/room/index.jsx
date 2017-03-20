import { Component, h } from 'preact'
import Grid from '../grid'
import UserBlob from '../user-blob'
import CheckpointBlob from '../checkpoint-blob'
import Sock from '../../lib/sock'
import Updates from '../../lib/updates'
import VolumeDetector from './volume-detector'

const UPDATE_INTERVAL = 30

navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia

export default class Room extends Component {
  state = {
    dimensions: [],
    translate: [0, 0],
    localMedia: {audio: true, video: false},
    localStream: null,
    keysDown: {
      left: false, right: false, up: false, down: false
    }
  }

  mousePos = {}
  intervalId = null

  componentWillMount () {
    Sock.on('dimensions', this.handleDimensions)
    Updates.on('translate', this.handleTranslate)

    this.setStream()
  }

  componentWillUnmount () {
    Sock.off('dimensions', this.handleDimensions)
    Updates.off('translate', this.handleTranslate)
    VolumeDetector.detach()
  }

  setStream = () => navigator.getUserMedia(
    this.state.localMedia,
    // on success
    stream => {
      this.setState({localStream: stream})
      VolumeDetector.register(stream, rms => Sock.emit('volume', rms))
    },
    // on failure
    error => console.log(error)
  )

  toggleMute = () => {
    const audioInput = this.state.localStream.getAudioTracks()[0]
    audioInput.enabled = !audioInput.enabled
  }

  handleDimensions = (data) => this.setState({ dimensions: data })
  handleTranslate = (data) => this.setState({ translate: data })

  onMouseDown = (ev) => {
    if (['plaza', 'grid-main'].includes(ev.target.id)) {
      if (this.intervalId) clearInterval(this.intervalId)
      this.intervalId = setInterval(this.moveUser, UPDATE_INTERVAL)
    }
  }

  onMouseUp = () => clearInterval(this.intervalId)
  onMouseMove = ev => this.mousePos = [ev.clientX, ev.clientY]

  onKeyDown = ({key}) => {
    const direction = {
      ArrowLeft: 'left', ArrowRight: 'right' , ArrowDown: 'down', ArrowUp: 'up'
    }[key]

    this.state.keysDown[direction] = true
    this.forceUpdate()
  }

  onKeyUp = ({key}) => {
    const direction = {
      ArrowLeft: 'left', ArrowRight: 'right', ArrowDown: 'down', ArrowUp: 'up'
    }[key]

    this.state.keysDown[direction] = true
    this.forceUpdate()
  }

  moveUser = () => Updates.emit('location', this.mousePos)

  render ({me, users, checkpoints}, {translate, dimensions, localStream}) {
    const userBlobs = users.filter(u => u).map((u, idx) => (
      <UserBlob key={u.id}
        user={u}
        localStream={localStream}
        translate={translate}
        isMe={me && u.id == Sock.id}
        toggleMute={this.toggleMute}
      />
    ))

    const checkpointBlobs = checkpoints.map((c, idx) => (
      <CheckpointBlob key={c.id}
        checkpoint={c}
        translate={translate}
      />
    ))

    return (
      <div id='plaza' tabIndex='1'
        onMouseDown={this.onMouseDown} onMouseUp={this.onMouseUp}
        onMouseMove={this.onMouseMove} onKeyDown={this.onKeyDown}
        onKeyUp={this.onKeyUp}
      >
        <div id='viewport' style={{
          transform: `translate(${translate[0]}px, ${translate[1]}px)`
        }} >
          <Grid dimensions={dimensions} />
          {userBlobs}
          {checkpointBlobs}
        </div>
      </div>
    )
  }
}
