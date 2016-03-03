import { Observable } from 'rx';

export default function AppLifecycleDriver(app) {
  return () => {
    return {
      get willFinishLaunching$() {
        return Observable.fromEvent(app, 'will-finish-launching');
      },
      get ready$() {
        return Observable.fromEvent(app, 'ready');
      }
    }
  };
}
