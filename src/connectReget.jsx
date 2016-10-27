import React, {PropTypes, Component} from 'react'
import shallowEqual from 'fbjs/lib/shallowEqual'

import AutoRunner from './AutoRunner'

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
        this.runner = new AutoRunner(this.context.reget, (reget, props, changes) => {
          if (!getterFunc) return
          const newState = getterFunc({...(props || this.props), reget})
          if (newState === null || React.isValidElement(newState)) {
            this._renderElement = newState
          } else {
            this._renderElement = undefined
            if (newState) {
              this.setState(newState)
            }
          }
        }, {disableOnChange: true})
      }

      componentWillReceiveProps(nextProps) {
        if (!shallowEqual(this.props, nextProps)) {
          this.runner.run(nextProps)
        }
      }

      componentDidMount() {
        if (this.runner) this.runner.start()
      }

      componentWillUnmount() {
        if (this.runner) this.runner.stop()
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
        if (this._renderElement !== undefined) {
          // console.log('connectReget return _renderElement', this._renderElement)
          return this._renderElement
        }
        const reget = this.runner || this.context.reget
        return <WrappedComponent {...this.props} {...this.state} reget={reget}  />
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
