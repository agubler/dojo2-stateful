const { describe, it } = intern.getInterface('bdd');
const { assert } = intern.getPlugin('chai');
import { stub } from 'sinon';
import { Registry } from '@dojo/framework/widget-core/Registry';
import { createStatefulProvider, STATEFUL_KEY, StatefulInjector, Subscribe, Container } from '../../src';
import { VNode } from '@dojo/framework/widget-core/interfaces';

function createTestSubscribe(registry: Registry) {
	return class extends Subscribe {
		constructor() {
			super();
			this.registry.base = registry;
		}
	};
}

describe('stateful', () => {
	it('Subscribe', () => {
		const registry = new Registry();
		const statefulInjector = new StatefulInjector();

		class TestContainer extends Container {
			state = {
				foo: 'bar'
			};
		}

		registry.defineInjector(STATEFUL_KEY, () => () => statefulInjector);
		let renderCounter = 0;
		const TestSubscribe = createTestSubscribe(registry);
		const subscribe = new TestSubscribe();
		let instantiatedContainer: TestContainer;
		subscribe.__setProperties__(
			{
				to: [TestContainer],
				render: (container: TestContainer) => {
					instantiatedContainer = container;
					return container.state.foo;
				}
			},
			subscribe
		);
		let renderResult = subscribe.__render__() as VNode;
		assert.strictEqual(renderResult.text, 'bar');
		const secondSubscribe = new TestSubscribe();
		secondSubscribe.__setProperties__(
			{
				to: [TestContainer],
				render: (container: TestContainer) => {
					renderCounter++;
					assert.strictEqual(container, instantiatedContainer);
					return container.state.foo;
				}
			},
			subscribe
		);
		renderResult = secondSubscribe.__render__() as VNode;
		assert.strictEqual(renderResult.text, 'bar');
		assert.strictEqual(renderCounter, 1);
		renderResult = secondSubscribe.__render__() as VNode;
		assert.strictEqual(renderResult.text, 'bar');
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
