import Map from '@dojo/framework/shim/Map';
import Evented from '@dojo/framework/core/Evented';
import WidgetBase from '@dojo/framework/widget-core/WidgetBase';
import inject from '@dojo/framework/widget-core/decorators/inject';
import Registry from '@dojo/framework/widget-core/Registry';
import { Constructor, DNode } from '@dojo/framework/widget-core/interfaces';

export const STATEFUL_KEY = '__STATEFUL_KEY';

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
	registry.defineInjector(STATEFUL_KEY, () => {
		const statefulInjector = new StatefulInjector();
		return () => statefulInjector;
	});
}

export abstract class Container<S = {}> {
	private _listeners: Function[] = [];
	protected abstract state: S;

	protected setState(state: Partial<S>) {
		this.state = { ...(this.state as any), ...(state as any) };
		this._invalidate();
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

	private _invalidate = () => {
		this._listeners.forEach((listener: Function) => {
			listener();
		});
	};
}

export interface SubscribeProperties {
	to: Constructor<Container>[];
	render(...c: Container[]): DNode | DNode[];
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
