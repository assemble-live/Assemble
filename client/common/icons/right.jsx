import React, { Component } from 'react'
import IconCore from './icon-core'

export default class Right extends Component {
  render () {
		const props = this.props
		const state = this.state

    return (
      <IconCore {...props} >
        <path d='M8.59 16.34l4.58-4.59-4.58-4.59L10 5.75l6 6-6 6z'/>
        <path d='M0-.25h24v24H0z' fill='none'/>
      </IconCore>
    )
  }
}
