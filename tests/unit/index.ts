const { beforeEach, describe, it } = intern.getInterface('bdd');
const { assert } = intern.getPlugin('chai');
import { stub } from 'sinon';
import { Registry } from '@dojo/widget-core/Registry';
import { createStatefulProvider, STATEFUL_KEY, StatefulInjector, Subscribe, Container } from '../../src';
import Injector from '@dojo/widget-core/Injector';

describe('stateful', () => {
	it('Subscribe', () => {
		const registry = new Registry();
		const statefulInjector = new StatefulInjector();
		const injector = new Injector(statefulInjector);

		class TestContainer extends Container {
			state = {
				foo: 'bar'
			};
		}

		registry.defineInjector(STATEFUL_KEY, () => () => statefulInjector);
		let renderCounter = 0;
		const subscribe = new Subscribe();
		let instantiatedContainer: TestContainer;
		subscribe.__setCoreProperties__({ baseRegistry: registry, bind: subscribe });
		subscribe.__setProperties__({
			to: [TestContainer],
			render: (container: TestContainer) => {
				instantiatedContainer = container;
				return container.state.foo;
			}
		});
		let renderResult = subscribe.__render__();
		assert.strictEqual(renderResult, 'bar');
		const secondSubscribe = new Subscribe();
		secondSubscribe.__setCoreProperties__({ baseRegistry: registry, bind: subscribe });
		secondSubscribe.__setProperties__({
			to: [TestContainer],
			render: (container: TestContainer) => {
				renderCounter++;
				assert.strictEqual(container, instantiatedContainer);
				return container.state.foo;
			}
		});
		renderResult = secondSubscribe.__render__();
		assert.strictEqual(renderResult, 'bar');
		assert.strictEqual(renderCounter, 1);
		renderResult = secondSubscribe.__render__();
		assert.strictEqual(renderResult, 'bar');
		assert.strictEqual(renderCounter, 2);
	});

	it('Container', () => {
		class TestContainer extends Container {
			state = {
				foo: 'bar'
			};

			public updateFoo() {
				this.setState({ foo: 'baz' });
			}
		}

		const listenerStub = stub();
		const container = new TestContainer();
		assert.deepEqual(container.state, { foo: 'bar' });
		const handle = container.register(listenerStub);
		assert.isTrue(container.isRegistered(listenerStub));
		container.updateFoo();
		assert.isTrue(listenerStub.calledOnce);
		container.register(listenerStub);
		container.updateFoo();
		assert.isTrue(listenerStub.calledTwice);
		assert.deepEqual(container.state, { foo: 'baz' });
		handle.destroy();
		container.updateFoo();
		assert.isTrue(listenerStub.calledTwice);
		handle.destroy();
	});

	it('createStatefulProvider', () => {
		const registry = new Registry();
		createStatefulProvider(registry);
		assert.isTrue(registry.hasInjector(STATEFUL_KEY));
	});
});
