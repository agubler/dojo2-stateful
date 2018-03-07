import Symbol from '@dojo/shim/Symbol';
import Evented from '@dojo/core/Evented';
import Map from '@dojo/shim/Map';
import WidgetBase from '@dojo/widget-core/WidgetBase';
import inject from '@dojo/widget-core/decorators/inject';
import Registry from '@dojo/widget-core/Registry';
import Injector from '@dojo/widget-core/Injector';
import { Constructor, VNode } from '@dojo/widget-core/interfaces';

const STATEFUL_KEY = Symbol();

export class StatefulInjector extends Evented {
	private _containerMap = new Map();

	getInstance = (Container: Constructor<Container>) => {
		return this._containerMap.get(Container);
	};

	addInstance = (Container: Constructor<Container>, container: Container) => {
		this._containerMap.set(Container, container);
	};
}

export function createStatefulProvider(registry: Registry) {
	const statefulInjector = new StatefulInjector();
	const injector = new Injector(statefulInjector);
	registry.defineInjector(STATEFUL_KEY, injector);
}

export abstract class Container<S = {}> {
	private _listeners: Function[] = [];
	protected abstract state: S;

	public setState(state: Partial<S>) {
		this.state = { ...(this.state as any), ...(state as any) };
		this.invalidate();
	}

	public isRegistered = (fn: Function) => {
		return this._listeners.indexOf(fn) !== -1;
	};

	public register = (fn: Function) => {
		if (this._listeners.indexOf(fn) === -1) {
			this._listeners.push(fn);
		}
		return {
			destroy: () => {
				const index = this._listeners.indexOf(fn);
				if (index !== -1) {
					this._listeners.splice(index, 1);
				}
			}
		};
	};

	public invalidate = () => {
		this._listeners.forEach((listener: Function) => {
			listener();
		});
	};
}

export interface SubscribeProperties {
	to: Constructor<Container>[];
	render(...c: Container[]): VNode;
}

@inject({
	name: STATEFUL_KEY,
	getProperties: (inject: StatefulInjector, properties) => {
		return {
			to: properties.to,
			render: properties.render,
			getInstance: inject.getInstance,
			addInstance: inject.addInstance
		};
	}
})
export class Subscribe extends WidgetBase<SubscribeProperties> {
	private _invalidate = this.invalidate.bind(this);

	private _createContainer() {
		const { to, getInstance, addInstance } = this.properties as any;
		const containers: Constructor<Container>[] = [];
		to.forEach((Container: Constructor<Container>) => {
			let container = getInstance(Container);
			if (container) {
				containers.push(container);
			} else {
				container = new Container();
				containers.push(container);
				addInstance(Container, container);
			}
			if (!container.isRegistered(this._invalidate)) {
				this.own(container.register(this._invalidate));
			}
		});
		return containers;
	}

	protected render() {
		return this.properties.render.apply(null, this._createContainer());
	}
}
