# reget

fetch HTTP like Sync call in React

## Http get, put, post for react component
```js
import connectReget from 'reget'

function PureComponent({user}) {
  return user.name
}

export default connectReget(({userId, reget}) => {
  return {
    user: reget.get(`user/${userId}`),
  }
})(PureComponent)

// withHandlers({
//   save: props => e =>  {
//     reget.put(`user/${userId}`, data)
//     reget.post('user', newUser)
// })
*/

```

## setup
```js
import {RegetProvider} from 'reget'

const reget = new Reget({
  // setup fetch and middlewares
  fetch(url, option) {
    // local routes ...

    // remote api
    const {isGreedy, cachedFor} = option
    if (isGreedy || !cachedFor || cachedFor > remoteRefetchLongTtl) {
      const realUrl = apiUrlPrefix + url
      return fetch(realUrl, option)
    } else {
      return { status: 304 }
    }
  },
})

<RegetProvider
  reget={reget}
  >
  <MyApp />
</RegetProvider>


```
