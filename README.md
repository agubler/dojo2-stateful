# dojo2-stateful

A simple state lib for Dojo inspired by [Unstated](https://github.com/jamiebuilds/unstated). Check out this simple [codesandbox](https://codesandbox.io/s/l58rkpl6j9).

## How do I use this package?

```
npm install dojo-stateful
```

## Features

Simple state mechanism that enables sharing state across your application widget tree without needing to introduce complex state management.

Simple Counter Example:

```ts
import renderer from '@dojo/framework/widget-core/vdom';
import Registry from '@dojo/framework/widget-core/Registry';
import WidgetBase from '@dojo/framework/widget-core/WidgetBase';
import { w, v } from '@dojo/framework/widget-core/d';
import { createStatefulProvider, Container, Subscribe } from 'dojo-stateful';


interface CounterState {
	count: number
};

class CounterContainer extends Container<CounterState> {
	state = {
	  count: 0
	};

	increment = () => {
	  this.setState({ count: this.state.count + 1 });
	}

	decrement = () => {
	  this.setState({ count: this.state.count - 1 });
	}
}

class Counter extends WidgetBase {
	protected render() {
		return w(Subscribe, { to: [CounterContainer], render: (counter: CounterContainer) => {
			return v('div', [
				v('button', { onclick: counter.decrement }, [ 'Decrement' ]),
				v('span', [ `${counter.state.count}` ]),
				v('button', { onclick: counter.increment }, [ 'Increment' ])
			])
		}})
	}
}

const registry = new Registry();
// create state provider for the registry
createStatedProvider(registry);

const r = renderer(() => w(Counter, {});
r.mount({ registry });
```

<!-- A slightly more complicated example of the counter can be found [here](https://agubler.github.io/dojo2-stateful-example/) with the source [here](https://github.com/agubler/dojo2-stateful-example). -->
