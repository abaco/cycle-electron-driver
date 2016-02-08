# cycle-electron-driver

Cycle.js drivers for electron apps


## Drivers

An electron application is made up of two processes; the main process and the render process. Each have different sets
of modules they interact with. Thus, two different drivers are provided by `cycle-electron-driver`.


### Main process driver

To create the driver for the main process, use the `createMainDriver` function:

```js
import Cycle from '@cycle/core';
import { createMainDriver } from 'cycle-electron-driver';

function main(sources) {
  //...
}

Cycle.run(main, {
  electron: createMainDriver()
});
```

#### Sources

##### events

The `events` source factory creates an `Observable` for 
[electron `app` events](http://electron.atom.io/docs/v0.36.5/api/app/#events).

```js
function main({ electron }) {
  const readyEvent$ = electron.events('ready');
}
```

Calling methods on `Event` objects, such as `preventDefault()` is antithetical to the Cycle.js philosophy; to enable
preventing defaults, use the `preventedEvents` sink listed below.


#### Sinks

##### exit$

When an exit value is received, it will cause the application to quit. If the value is a number, that number will be the
exit code.

##### preventedEvent$

Events emitted by this `Observable` will have their `preventDefault` method invoked.

```js
function main({ electron }) {
  return {
    electron: {
      preventedEvent$: electron.events('before-quit')
    }
  };
};
```
