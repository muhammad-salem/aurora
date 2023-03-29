import type { Class, TypeOf } from '../utils/typeof.js';
import { Components } from '../component/component.js';
import { ReflectComponents } from '../component/reflect.js';
import { fetchHtml } from '../utils/path.js';
import {
	ChildOptions, ComponentOptions, DirectiveOptions,
	OutputEventInit, OutputOptions, PipeOptions, ServiceOptions
} from './options.js';
import { getCurrentMetadata, makeMetadataDecorator } from './context.js';



type PropertyValue<T> = T | ((value: T) => void) | undefined;

export function Input<This, Value>(name?: string): (value: PropertyValue<Value>, context: ClassFieldDecoratorContext<This, Value> | ClassSetterDecoratorContext<This, Value>) => void {
	return (value: PropertyValue<Value>, context: ClassFieldDecoratorContext<This, Value> | ClassSetterDecoratorContext<This, Value>) => {
		if (!name && typeof context.name !== 'string') {
			throw new TypeError(`type ${typeof context.name} of '${context.name.toString()}' is not supported`);
		}
		if (context.private) {
			throw new SyntaxError(`private members '${context.name.toString()}' is not supported.`);
		}
		const metadata = getCurrentMetadata();
		ReflectComponents.addInput(metadata, context.name as string, name || context.name as string);
	};
}

export function FormValue<This, Value>() {
	return (value: undefined, context: ClassFieldDecoratorContext<This, Value>) => {
		if (typeof context.name !== 'string') {
			throw new TypeError(`type ${typeof context.name} of '${context.name.toString()}' is not supported`);
		}
		if (context.private) {
			throw new SyntaxError(`private members '${context.name.toString()}' is not supported.`);
		}
		const metadata = getCurrentMetadata();
		ReflectComponents.addInput(metadata, context.name, 'value');
	};
}

export function Output<This, Value>(options?: OutputOptions): (value: undefined, context: ClassFieldDecoratorContext<This, Value>) => void;
export function Output<This, Value>(name?: string, options?: OutputEventInit): (value: undefined, context: ClassFieldDecoratorContext<This, Value>) => void;
export function Output<This, Value>(name?: string | OutputOptions, options?: OutputEventInit): (value: undefined, context: ClassFieldDecoratorContext<This, Value>) => void {
	const eventType = typeof name === 'object' ? name.name : name;
	const eventOpts = typeof name === 'object' ? name : options;
	return (value: undefined, context: ClassFieldDecoratorContext<This, Value>) => {
		if (typeof context.name !== 'string') {
			throw new TypeError(`type ${typeof context.name} of '${context.name.toString()}' is not supported`);
		}
		if (context.private) {
			throw new SyntaxError(`private members '${context.name.toString()}' is not supported.`);
		}
		const metadata = getCurrentMetadata();
		ReflectComponents.addOutput(
			metadata,
			context.name,
			eventType || context.name,
			{
				bubbles: eventOpts?.bubbles ?? false,
				composed: eventOpts?.composed ?? false
			}
		);
	};
}

export function View<This, Value>() {
	return (value: undefined, context: ClassFieldDecoratorContext<This, Value>) => {
		if (typeof context.name !== 'string') {
			throw new TypeError(`type ${typeof context.name} of '${context.name.toString()}' is not supported`);
		}
		if (context.private) {
			throw new SyntaxError(`private members '${context.name.toString()}' is not supported.`);
		}
		const metadata = getCurrentMetadata();
		ReflectComponents.setComponentView(metadata, context.name);
	};
}

export function ViewChild<This, Value>(selector: string | typeof HTMLElement | CustomElementConstructor, childOptions?: ChildOptions) {
	return (value: undefined, context: ClassFieldDecoratorContext<This, Value>) => {
		if (typeof context.name !== 'string') {
			throw new TypeError(`type ${typeof context.name} of '${context.name.toString()}' is not supported`);
		}
		if (context.private) {
			throw new SyntaxError(`private members '${context.name.toString()}' is not supported.`);
		}
		const metadata = getCurrentMetadata();
		ReflectComponents.addViewChild(metadata, context.name, selector, childOptions);
	};
}

export function ViewChildren<This, Value>(selector: string | typeof HTMLElement | CustomElementConstructor) {
	return (value: undefined, context: ClassFieldDecoratorContext<This, Value>) => {
		if (typeof context.name !== 'string') {
			throw new TypeError(`type ${typeof context.name} of '${context.name.toString()}' is not supported`);
		}
		if (context.private) {
			throw new SyntaxError(`private members '${context.name.toString()}' is not supported.`);
		}
		const metadata = getCurrentMetadata();
		ReflectComponents.addViewChildren(metadata, context.name, selector);
	};
}


export function HostListener<This, Value extends (this: This, ...args: any) => any>(eventName: string, args?: string | string[]): Function {
	return (target: Object, context: ClassMethodDecoratorContext<This, Value>) => {
		if (typeof context.name !== 'string') {
			throw new TypeError(`type ${typeof context.name} of '${context.name.toString()}' is not supported`);
		}
		args = typeof args === 'string' ? [args] : args;
		const metadata = getCurrentMetadata();
		ReflectComponents.addHostListener(
			metadata,
			context.name,
			eventName,
			args || []
		);
	};
}


type ValueGetter<T> = T | (() => T) | undefined;

export function HostBinding<This, Value>(hostPropertyName: string) {
	return (value: ValueGetter<Value>, context: ClassFieldDecoratorContext<This, Value> | ClassMethodDecoratorContext<This, any> | ClassGetterDecoratorContext<This, Value>) => {
		if (typeof context.name !== 'string') {
			throw new TypeError(`type ${typeof context.name} of '${context.name.toString()}' is not supported`);
		}
		if (context.private) {
			throw new SyntaxError(`private members '${context.name.toString()}' is not supported.`);
		}
		const metadata = getCurrentMetadata();
		ReflectComponents.addHostBinding(metadata, context.name, hostPropertyName);
	};
}

export const Pipe = makeMetadataDecorator<PipeOptions>(
	(opt, constructor) => {
		const metadata = getCurrentMetadata();
		ReflectComponents.defineBootstrap(constructor, metadata);
		Components.definePipe(constructor as any, opt);
	}
);


export const Service = makeMetadataDecorator<ServiceOptions>(
	(opt, constructor) => {
		const metadata = getCurrentMetadata();
		ReflectComponents.defineBootstrap(constructor, metadata);
		Components.defineService(constructor as any, opt);
	}
);


export const Directive = makeMetadataDecorator<DirectiveOptions>(
	(opt, constructor) => {
		const metadata = getCurrentMetadata();
		ReflectComponents.defineBootstrap(constructor, metadata);
		Components.defineDirective(constructor as any, opt);
	});


function generateComponent<T extends Class>(target: TypeOf<T>, opt: ComponentOptions<T>) {
	if (opt.templateUrl) {
		fetchHtml(opt.templateUrl)
			.then(htmlTemplate => {
				if (htmlTemplate) {
					opt.template = htmlTemplate;
					Components.defineComponent(target, opt);
				}
			})
			.catch(reason => {
				console.error(`Error @URL: ${opt.templateUrl}, for model Class: ${target.name},\n Reason: ${reason}.`);
			});
	} else {
		Components.defineComponent(target, opt);
	}
}

export const Component = makeMetadataDecorator<ComponentOptions | ComponentOptions[]>(
	(opt, constructor) => {
		const metadata = getCurrentMetadata();
		ReflectComponents.defineBootstrap(constructor, metadata);
		if (Array.isArray(opt)) {
			for (const comp of opt) {
				generateComponent(constructor as any, comp);
			}
		} else if (typeof opt === 'object') {
			generateComponent(constructor as any, opt);
		}
	}
);

export const customElement = makeMetadataDecorator<{ selector: string } & ElementDefinitionOptions, Class<HTMLElement>>(
	(opt, constructor) => {
		const metadata = getCurrentMetadata();
		ReflectComponents.defineBootstrap(constructor, metadata);
		Components.defineView(constructor as any, opt);
	}
);
