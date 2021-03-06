# cycle-electron-driver

The `cycle-electron-driver` module provides Cycle.js drivers for building Electron apps.

## API mappings

If you are already familiar with the `electron` API, here's a map of its interface to drivers:

* app
  * events
    * `will-finish-launching` - [AppLifecycleDriver](#applifecycledriver)
    * `ready` - [AppLifecycleDriver](#applifecycledriver)
    * `window-all-closed` - [AppLifecycleDriver](#applifecycledriver)
    * `before-quit` - [AppLifecycleDriver](#applifecycledriver)
    * `will-quit` - [AppLifecycleDriver](#applifecycledriver)
    * `quit` - [AppLifecycleDriver](#applifecycledriver)
    * `open-file` - [AppEventsDriver](#appeventsdriver)
    * `open-url` - [AppEventsDriver](#appeventsdriver)
    * `activate` - [AppEventsDriver](#appeventsdriver)
    * `browser-window-blur` - [AppEventsDriver](#appeventsdriver)
    * `browser-window-focus` - [AppEventsDriver](#appeventsdriver)
    * `browser-window-created` - [AppEventsDriver](#appeventsdriver)
    * `certificate-error` - [CertErrorOverrideDriver](#certerroroverridedriver)
    * `select-client-certificate` - [ClientCertDriver](#clientcertdriver)
    * `login` - [BasicAuthDriver](#basicauthdriver)
    * `gpu-process-crashed` - [AppEventsDriver](#appeventsdriver)
  * methods
    * `quit` - [AppLifecycleDriver](#applifecycledriver)
    * `exit` - [AppLifecycleDriver](#applifecycledriver)
    * `hide` - [AppVisibilityDriver](#appvisibilitydriver)
    * `show` - [AppVisibilityDriver](#appvisibilitydriver)
    * `getAppPath` - [AppConfigDriver](#appconfigdriver)
    * `getPath` - [AppConfigDriver](#appconfigdriver)
    * `setPath` - [AppConfigDriver](#appconfigdriver)
    * `getVersion` - [AppMetadataDriver](#appmetadatadriver)
    * `getName` - [AppMetadataDriver](#appmetadatadriver)
    * `getLocale` - [AppMetadataDriver](#appmetadatadriver)
    * `addRecentDocument` - [RecentDocsDriver](#recentdocsdriver)
    * `clearRecentDocuments` - [RecentDocsDriver](#recentdocsdriver)
    * `setUserTasks` - [AppConfigDriver](#appconfigdriver)

## Drivers

### AppConfigDriver

`AppConfigDriver` enables the getting/setting of configuration used by your app.

```js
import { join } from 'path';
import { app } from 'electron';
import { AppPathsDriver } from 'cycle-electron-driver';

Cycle.run(({ config: { appPaths } }) => ({
  appPaths: appPaths.appData$.map(dataPath => ({ downloads: join(dataPath, 'downloads') }))
}), {
  config: AppConfigDriver(app)
});
```

#### source

The source for the driver is an object with the following structure.

* `allowNTMLForNonIntranet$` - Gives the current `allowNTMLForNonIntranet` config setting.
* `paths` - An object with observable properties that match the 
  [electron path names](http://electron.atom.io/docs/v0.36.8/api/app/#appgetpathname) with the idiomatic `$` suffix
  (e.g. `home$`, `appData$`). Additionally, an `app$` property gives access to 
  [app.getAppPath()](http://electron.atom.io/docs/v0.36.8/api/app/#appgetapppath).
* `task$` - An observable of `Task` arrays.

#### sink

The sink for the driver is an observable of objects describing the configuration settings to change. The following 
structure is supported:

* `allowNTMLForNonIntranet` - If set to `true`, enable NTLM auth for all domains. Otherwise, only intranet sites.
* `paths` - An object with properties matching
  [the electron path names](http://electron.atom.io/docs/v0.36.8/api/app/#appgetpathname). Only the specified paths
  are changed.
* `tasks`: An array of `Task` objects (Windows only). These have the following properties:
  * `program` - The application executable; use `process.execPath` to use the currently-executing app executable.
  * `arguments` - An array of strings to use as program arguments
  * `title` - The title to give the task
  * `description` - The full description of the task
  * `iconPath` - Path to the icon to show for the task
  * `iconIndex` - If `iconPath` contains multiple icons, the index of the icon to use for the task

### AppEventsDriver

`AppEventsDriver` provides access to electron app events. It provides a source observable containing all events.
To create the driver, simply call the constructor with the electron `app`:

```js
import Cycle from '@cycle/core';
import { app } from 'electron';

Cycle.run(({ appEvent$ }) => ({
  fileOpen$: appEvent$.filter(e => e.type === 'file-open')
}), {
  appEvent$: AppEventsDriver(app)
});
```

These events have a `type` property that matches
[the names of the electron events](https://github.com/atom/electron/blob/master/docs/api/app.md#events). Additional
event arguments are normalized into the event object properties as follows:

* `open-file` - `path`
* `open-url` - `url`
* `activate` - `hasVisibleWindows`
* `browser-window-blur` - `window`
* `browser-window-focus` - `window`
* `browser-window-created` - `window`
* `certificate-error` - `webContents`, `url`, `error`, `certificate`
* `login` - `webContents`, `request`, `authInfo`

### AppLifecycleDriver

`AppLifecycleDriver` provides visibility into application lifecycle events & the ability to affect the app lifecycle.

#### Sources

The source object has the following properties:

* willFinishLaunching$ - [will-finish-launching](http://electron.atom.io/docs/v0.36.8/api/app/#event-will-finish-launching) events
* ready$ - [will-finish-launching](http://electron.atom.io/docs/v0.36.8/api/app/#event-ready) events
* windowAllClosed$ - [window-all-closed](http://electron.atom.io/docs/v0.36.8/api/app/#event-window-all-closed) events
* beforeQuit$ - [before-quit](http://electron.atom.io/docs/v0.36.8/api/app/#event-before-quit) events
* willQuit$ - [will-quit](http://electron.atom.io/docs/v0.36.8/api/app/#event-will-quit) events
* quit$ - [quit](http://electron.atom.io/docs/v0.36.8/api/app/#event-quit) events. These contain an additional `exitCode` property.

#### Sink

The sink for `AppLifecycleDriver` should provide objects describing the desired lifecycle state & behavior of the app.
The following properties are supported:

| Property           | Default    | Description                                                                |
|--------------------|------------|----------------------------------------------------------------------------|
|`state`             | `'started'`| Set to `'quitting'` to initiate a quit event, `'exiting'` to force an exit |
|`exitCode`          | 0          | If `state` is set to `'exiting'`, sends this as the exit code              |
|`isQuittingEnabled` | `true`     | If `false`, `before-quit` events will be cancelled                         |
|`isAutoExitEnabled` | `true`     | If `false`, `will-quit` events will be cancelled                           |

### AppMetadataDriver

`AppMetadataDriver` provides a source observable of objects describing the app. The objects have the following 
properties:

* `name`
* `version`
* `locale`

### AppVisibilityDriver

`AppVisibilityDriver` consumes a sink of boolean values that show/hide the application's windows (OS X only).

```js
import { app } from 'electron';
import { AppVisibilityDriver } from 'cycle-electron-driver';

Cycle.run(() => {
  // ...
  return {
    visibility$: appState$.map(state => state.shouldHide)
  };
}, {
  visibility$: AppVisibilityDriver(app)
});
```

### BasicAuthDriver

`BasicAuthDriver` provides a source of HTTP basic auth prompts and consumes objects that provide the response 
credentials. 

```js
import { app } from 'electron';
import { BasicAuthDriver } from 'cycle-electron-driver';

Cycle.run(({ login$ }) => ({
  login$: login$.map(e => ({
    event: e,
    username: 'someuser',
    password: 's0m3Pa$sw0rd'
  }))
}), {
  login$: BasicAuthDriver(app)
});
```

Source events are based on [electron login events](http://electron.atom.io/docs/v0.36.8/api/app/#event-login)
have the following properties:

* `webContents` - The contents of the window that received the prompt
* `request` - Information about the HTTP request that received the prompt
* `authInfo` - Information about the auth prompt

Sink objects must be provided for each source event and must have the following properties:

* `event` - The source event that is being responded to
* `username`
* `password`

If you do not use this driver, then the auth prompts are automatically cancelled. Use `AppEventsDriver`
and watch for events of type `login` if you only want to observe these failed logins.

### CertErrorOverrideDriver

`CertErrorOverrideDriver` provides a source observable of events indicating when verification of a server's SSL 
certificate has failed, and consumes a sink observable of objects indicating whether the certificate rejection should
be overridden. This driver should only rarely be needed, but it can be helpful for cases such as when you are using
a self-signed certificate during development and want your app to accept that certificate. For example:

```js
import { app } from 'electron';
import { CertErrorOverrideDriver } from 'cycle-electron-driver';

Cycle.run(({ certErr$ }) => ({
  certErr$: certErr$.map(e => ({ event: e, allow: e.certificate.issuerName === 'My Test CA' }));
}), {
  certErr$: CertErrorOverrideDriver(app);
});
```

The source objects are based on 
[electron certificate-error events](http://electron.atom.io/docs/v0.36.8/api/app/#event-certificate-error) and have the
following properties:

* `webContents` - The contents of the window that received the error
* `url` - The URL being requested
* `error` - The error code
* `certificate.data` - A buffer containing the PEM-formatted certificate
* `certificate.issuerName` - The issuer of the certificate

Sink objects should have these properties:

* `event` - The source event representing the certificate error
* `allow` - A boolean `true` or `false`. If `true`, the SSL request will be allowed to continue. Else it will fail.

You must have one object for each source event; otherwise the driver does not know whether the certificate error should
cause the SSL requests to succeed or fail. If you do not want to override any certificate errors, do not use this
driver. If you only want to be notified when these events occur, filter the `AppEventsDriver` events by type
`certificate-error`.

### ClientCertDriver

`ClientCertDriver` provides a source observable containing client SSL cert request events and consumes an observable
of client certificate selection objects. 

```js
import { app } from 'electron';
import { ClientCertDriver } from 'cycle-electron-driver';

Cycle.run(({ certSelection$ }) => ({
  certSelection$: certSelection$.map(e => ({ 
    event: e, 
    cert: e.certificateList.find(cert => cert.issuerName === 'My Issuer') 
  }));
}), {
  certSelection$: ClientCertDriver(app);
});
```

Source event objects are based on 
[electron select-client-certificate events](http://electron.atom.io/docs/v0.36.8/api/app/#event-select-client-certificate)
and have the following properties:

* `webContents` - The contents of the window that received the certificate prompt
* `url` - The URL that requested the certificate
* `certificateList` - An array of available certificates, each of which have the following properties:
  * `data` - PEM-encoded buffer
  * `issuerName` - Issuer’s Common Name

Sink objects must be provided for each source event and must contain the following properties:

* `event` - The source event representing the certificate prompt
* `cert` - One of the objects from the source event's `certificateList` property

Do not use this driver if you want to keep the default electron behavior of always selecting the first client 
certificate. If you only wish to be notified when client certificates are being selected with the default behavior,
use the `AppEventsDriver` and filter where `type` equals `select-client-certificate`.

### RecentDocsDriver

`RecentDocsDriver` provides a sink for changing the recent documents of the app. Each object in the observable should
contain one or more of the following properties:

* `clear` - If set to `true`, the recent documents list for the app is cleared.
* `add` - If set to a string, the path to a document to add to the recent documents list.

```js
import Cycle from '@cycle/core';
import { app } from 'electron';
import { RecentDocsDriver } from 'cycle-electron-driver';

Cycle.run(() => {
  //...
  
  return {
    recentDoc$: model.openedDoc$.map(doc => ({ add: doc }))
  }
}), {
  recentDoc$: RecentDocsDriver(app)
});
```

### Main process driver

To create the driver for the main process, call the `MainDriver` function with the Electron app:

```js
import Cycle from '@cycle/core';
import { app } from 'electron';
import { MainDriver } from 'cycle-electron-driver';

function main(sources) {
  //...
}

Cycle.run(main, {
  electron: MainDriver(app)
});
```

#### Options

When constructing the main process driver, an optional second argument can provide the following options:

* `isSingleInstance` - If set to `true`, only one instance of the application can be created. The `extraLaunch$` source
  will emit when additional launches are attempted. This defaults to `false`.

#### Sources

The source object provided by `MainDriver` contains multiple properties and observables, most of which you will never
need to use. To summarize the overall structure, it looks something like this:

```
platformInfo:
  isAeroGlassEnabled
events() :: String -> Observable
  extraLaunch$
  beforeAllWindowClose$
  beforeExit$
  exit$
badgeLabel$
```

##### platformInfo

The `platformInfo` object provides the following information about the runtime platform:

* `isAeroGlassEnabled`  - (Windows only) whether DWM composition is enabled 

##### events

The `events` source factory creates an `Observable` for raw
[electron `app` events](http://electron.atom.io/docs/v0.36.5/api/app/#events).

```js
function main({ electron }) {
  const readyEvent$ = electron.events('ready');
}
```

Note that events documented with more than one parameter will be truncated; only the `Event` portion will be received.
It is recommended that you use one of the more normalized event sources listed below if you're handling an event.

###### events.extraLaunch$

When the `isSingleInstance` option is `true`, this observable indicates when blocked additional launches are attempted.
Values are objects with the following properties:

* `argv`  - Array of command-line arguments used when this was launched
* `cwd`   - The working directory of the process that was launched

##### badgeLabel$

This `Observable` gives the current and future badge labels of the OS X dock icon.

#### Sinks

The sink for the driver should be an observable that produces an object containing multiple sink observables. Any of
these sinks can be omitted if not needed. The object properties can be summarized as follows:

```
pathUpdates:
  appData$
  desktop$
  documents$
  downloads$
  exe$
  home$
  module$
  music$
  pictures$
  temp$
  userData$
  videos$
newChromiumParam$AppTasksDriver
dock:
  bounce:
    start$
    cancel$
  visibility$
  badgeLabel$
  menu$
  icon$
ntlmAllowedOverride$
appUserModelId$
```

##### pathUpdates

Provide one of the following sinks to change the file path used by electron:

* `appData$`   - The directory for application data
* `desktop$`   - The directory for the user's desktop files
* `documents$` - The directory for the user's documents
* `downloads$` - The directory for the user's downloaded files
* `exe$`       - The path to the application executable
* `home$`      - The user's home directory
* `module$`    - The path to the `libchromiumcontent` library
* `music$`     - The directory for the user's music files
* `pictures$`  - The directory for the user's image files
* `temp$`      - The directory for storing temporary data
* `userData$`  - The directory for storing user-specific application data
* `videos$`    - The directory for the user's video files

##### newChromiumParam$

The `newChromiumParam$` sink should produce objects with the following properties:

* `switches`  - An `Array` of objects with a required `switch` and optional `value` property to be appended to the
                Chromium parameters
* `args`      - An `Array` of strings that will be used for additional command-line arguments to Chromium

Note that these are write-only and cannot be undone. In other words, you cannot remove a switch or argument once it has
been included.

##### dock

The `dock` property is a container for multiple OSX-specific sinks.

###### bounce

The bounce property of `dock` has the following observable properties:

* `start$` - This should be an `Observable` of objects with an `id` and `type` property. The `type` property should be
  a string equalling either `critical` or `informational`. `id` is an arbitrary string that should be unique
  and kept track of if you wish to cancel the bounce at a later time. Otherwise, it may be omitted.
* `cancel$` - This should be an `Observable` of string IDs; these IDs should correlate to the `id` used in the `start$`
  observable objects.

###### visibility$

This `Observable` should contain boolean values; `true` values will cause the dock icon to show, `false` to hide.

###### badgeLabel$

This sink causes the OS X badge label to be updated.

###### menu$

This sink sets the menu in the OS X dock for the application. See 
[the electron documentation](http://electron.atom.io/docs/v0.36.7/api/app/#appdocksetmenumenu-os-x) for details on what
these values should be.

###### icon$

This sink sets the icon in the OS X dock. Values should be  
[NativeImage](http://electron.atom.io/docs/v0.36.7/api/native-image) objects.

##### ntlmAllowedOverride$

This sink should be an `Observable` of boolean values; when true, NTLM authentication is enabled for sites not 
recognized as being part of the local intranet.

##### appUserModelId$

This causes the Windows 
[Application User Model ID](https://msdn.microsoft.com/en-us/library/windows/desktop/dd378459(v=vs.85).aspx) to change
to the values of the `Observable`.
