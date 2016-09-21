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
  // you can setup fetch and middlewares here
  // (url: String, option: {headers: {'If-Modified-Since': Date}, ifModifiedSince: Date, isGreedy: Boolean}})
  fetch: window.fetch,
})

<RegetProvider
  reget={reget}
  >
  <MyApp />
</RegetProvider>


```
