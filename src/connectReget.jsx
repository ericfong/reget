import React, {PropTypes, Component} from 'react'
import shallowEqual from 'fbjs/lib/shallowEqual'


export function connectReget(getterFunc) {
  return (WrappedComponent) => {
    class WithCache extends React.Component {
      static contextTypes = {
        reget: PropTypes.object.isRequired,
      }

      constructor() {
        super()
        this.state = {}
      }

      componentWillMount() {
        if (getterFunc) {
          this.pinger = this.context.reget.createPinger((reget, props) => {
            const newState = getterFunc({...(props || this.props), reget})
            if (newState === null || React.isValidElement(newState)) {
              this._renderElement = newState
            } else {
              this._renderElement = undefined
              if (newState) {
                this.setState(newState)
              }
            }
          })
        }
      }

      componentWillReceiveProps(nextProps) {
        if (this.pinger && !shallowEqual(this.props, nextProps)) {
          this.pinger.ping(nextProps)
        }
      }

      componentDidMount() {
        if (this.pinger) this.pinger.start()
      }

      componentWillUnmount () {
        if (this.pinger) this.pinger.stop()
      }

      shouldComponentUpdate(nextProps, nextState) {
        // _.each(nextState, (val, key) => {
        //   if (val !== this.state[key]) {
        //     console.log(`${WrappedComponent.name} ${this._id} shouldComponentUpdate`, key, val, this.state)
        //   }
        // })
        return !shallowEqual(this.props, nextProps) || !shallowEqual(this.state, nextState)
      }

      render() {
        if (this._renderElement !== undefined) return this._renderElement
        return <WrappedComponent {...this.props} {...this.state} reget={this.context.reget}  />
      }
    }
    WithCache.displayName = `${WrappedComponent.name}Reget`
    return WithCache
  }
}
export default connectReget


export class RegetProvider extends Component {
  static childContextTypes = {
    reget: PropTypes.object,
  }

  getChildContext() {
    return {reget: this.props.reget}
  }

  render() {
    return this.props.children
  }
}
