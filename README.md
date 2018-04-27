# dojo2-stateful

A simple state lib for Dojo 2 inspired by [Unstated](https://github.com/jamiebuilds/unstated). Check out this simple [codesandbox](https://codesandbox.io/s/l58rkpl6j9).

## How do I use this package?

```
npm install dojo2-stateful
```

## Features

Simple state mechanism that enables sharing state across your application widget tree without needing to introduce complex state management.

Simple Counter Example:

```ts
import { ProjectorMixin } from '@dojo/widget-core/mixins/Projector';
import Registry from '@dojo/widget-core/Registry';
import { WidgetBase } from '@dojo/widget-core/WidgetBase';
import { w, v } from '@dojo/widget-core/d';
import { createStatefulProvider, Container, Subscribe } from 'dojo2-stateful';


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

class Counter extends ProjectorMixin(WidgetBase) {
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

const counter = new Counter();
counter.setProperties({ registry });
counter.append();
```

A slightly more complicated example of the counter can be found [here](https://agubler.github.io/dojo2-stateful-example/) with the source [here](https://github.com/agubler/dojo2-stateful-example).
