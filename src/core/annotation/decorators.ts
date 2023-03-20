import type { TypeOf } from '../utils/typeof.js';
import { Components } from '../component/component.js';
import { ReflectComponents } from '../component/reflect.js';
import { fetchHtml } from '../utils/path.js';
import {
	ChildOptions, ComponentOptions, DirectiveOptions,
	OutputEventInit, OutputOptions, PipeOptions, ServiceOptions
} from './options.js';


export function Input(name?: string): Function {
	return (target: Object, propertyKey: string) => {
		ReflectComponents.addInput(target, propertyKey, name || propertyKey);
	};
}

export function FormValue(): Function {
	return (target: Object, propertyKey: string) => {
		ReflectComponents.addInput(target, propertyKey, 'value');
	};
}

export function Output(options?: OutputOptions): Function;
export function Output(name?: string, options?: OutputEventInit): Function;
export function Output(name?: string | OutputOptions, options?: OutputEventInit): Function {
	const eventType = typeof name === 'object' ? name.name : name;
	const eventOpts = typeof name === 'object' ? name : options;
	return (target: Object, propertyKey: string) => {
		ReflectComponents.addOutput(
			target,
			propertyKey, eventType || propertyKey,
			{
				bubbles: eventOpts?.bubbles ?? false,
				composed: eventOpts?.composed ?? false
			}
		);
	};
}

export function View(): Function {
	return (target: Object, propertyKey: string) => {
		ReflectComponents.setComponentView(target, propertyKey);
	};
}

export function ViewChild(selector: string | typeof HTMLElement | CustomElementConstructor,
	childOptions?: ChildOptions): Function {
	return (target: Object, propertyKey: string) => {
		ReflectComponents.addViewChild(target, propertyKey, selector, childOptions);
	};
}

export function ViewChildren(selector: string | typeof HTMLElement | CustomElementConstructor): Function {
	return (target: Object, propertyKey: string) => {
		ReflectComponents.addViewChildren(target, propertyKey, selector);
	};
}

export function HostListener(eventName: string, args?: string | string[]): Function {
	return (target: Object, propertyKey: string) => {
		args = typeof args === 'string' ? [args] : args;
		ReflectComponents.addHostListener(
			target,
			propertyKey,
			eventName,
			args || []
		);
	};
}

export function HostBinding(hostPropertyName: string): Function {
	return (target: Object, propertyKey: string) => {
		ReflectComponents.addHostBinding(target, propertyKey, hostPropertyName);
	};
}

export function Pipe(opt: PipeOptions): Function {
	return (target: Function) => {
		Components.definePipe(target, opt);
		return target;
	};
}

export function Service(opt: ServiceOptions): Function {
	return (target: Function) => {
		Components.defineService(target, opt);
		return target;
	};
}

export function Directive(opt: DirectiveOptions): Function {
	return (target: Function) => {
		Components.defineDirective(target, opt);
		return target;
	};
}

function generateComponent<T extends { new(...args: any[]): {} }>(target: TypeOf<T>, opt: ComponentOptions<T>) {
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

export function Component<T extends { new(...args: any[]): {} }>(opt: ComponentOptions<T> | ComponentOptions<T>[]): Function {
	return (target: TypeOf<T>) => {
		if (Array.isArray(opt)) {
			for (const comp of opt) {
				generateComponent(target, comp);
			}
		} else if (typeof opt === 'object') {
			generateComponent(target, opt);
		}
		return target;
	};
}

export function SelfSkip(name?: string): Function {
	return (target: Function, propertyKey: string, index: number) => {
		let metadata = Reflect.getMetadata('selfskip', target, propertyKey);
		if (!metadata) {
			metadata = {};
			Reflect.defineMetadata('selfskip', metadata, target, propertyKey);
		}
		metadata[index] = name;
	};
}

export function Optional(): Function {
	return (target: Function, propertyKey: string, index: number) => {
		let metadata = Reflect.getMetadata('optional', target, propertyKey);
		if (!metadata) {
			metadata = {};
			Reflect.defineMetadata('optional', metadata, target, propertyKey);
		}
		metadata[index] = true;
	};
}

export function customElement<T extends HTMLElement>(opt: { selector: string } & ElementDefinitionOptions): Function {
	return (target: TypeOf<T>) => {
		Components.defineView(target, opt);
		return target;
	};
}
