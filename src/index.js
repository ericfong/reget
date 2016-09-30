import React, {PropTypes, Component} from 'react'
import shallowEqual from 'fbjs/lib/shallowEqual'

export Reget, {cacheMiddleware} from './Reget'


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
        this.runner = this.context.reget.createRunner(this.runGetterFunc.bind(this))
        this.runner.run(true)
      }

      componentWillReceiveProps(nextProps) {
        if (!shallowEqual(this.props, nextProps)) {
          // console.log(`${WrappedComponent.name} componentWillReceiveProps`)
          this.runner.runNext(false)
        }
      }

      componentDidMount() {
        this.runner.listen()
      }

      componentWillUnmount () {
        this.isWillUnmount = true
        this.runner.unlisten()
      }

      shouldComponentUpdate(nextProps, nextState) {
        // _.each(nextState, (val, key) => {
        //   if (val !== this.state[key]) {
        //     console.log(`${WrappedComponent.name} ${this._id} shouldComponentUpdate`, key, val, this.state)
        //   }
        // })
        return !shallowEqual(this.props, nextProps) || !shallowEqual(this.state, nextState)
      }

      runGetterFunc() {
        if (!getterFunc || this.isWillUnmount) return

        // TODO make a sync to async wrapper
        const reget = this.context.reget
        const newState = getterFunc({...this.props, reget}, reget)
        if (newState === null || React.isValidElement(newState)) {
          this._renderElement = newState
        } else {
          this._renderElement = undefined
          if (newState) {
            this.setState(newState)
          }
        }
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
