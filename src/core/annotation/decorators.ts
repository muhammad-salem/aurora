import type { Type } from '../utils/typeof.js';
import {
	MetadataClass, MetadataContext,
	makeClassDecorator, makeClassMemberDecorator
} from '@ibyar/decorators';
import { Components } from '../component/component.js';
import { ReflectComponents } from '../component/reflect.js';
import { fetchHtml } from '../utils/path.js';
import {
	ComponentOptions, DirectiveOptions,
	PipeOptions, InjectableOptions
} from './options.js';



type PropertyValue<T> = T | ((value: T) => void) | undefined;

/**
 * @deprecated since v2.4.0, use `input` function instead.
 */

export function Input<This, Value>(name?: string) {
	return makeClassMemberDecorator<PropertyValue<Value>, ClassFieldDecoratorContext<This, Value> | ClassSetterDecoratorContext<This, Value>>(
		(value, context, metadata) => {
			if (!name && typeof context.name !== 'string') {
				throw new TypeError(`type ${typeof context.name} of '${context.name.toString()}' is not supported`);
			}
			if (context.private) {
				throw new SyntaxError(`private members '${context.name.toString()}' is not supported.`);
			}
			ReflectComponents.addInput(metadata, context.name as string, name || context.name as string);
		}
	);
}


export function HostListener<This, Value extends (this: This, ...args: any) => any>(eventName: string, args?: string | string[]) {
	return makeClassMemberDecorator<Value, ClassMethodDecoratorContext>(
		(value, context, metadata) => {
			if (typeof context.name !== 'string') {
				throw new TypeError(`type ${typeof context.name} of '${context.name.toString()}' is not supported`);
			}
			args = typeof args === 'string' ? [args] : args;
			ReflectComponents.addHostListener(
				metadata,
				context.name,
				eventName,
				args || []
			);
		}
	);
}


type ValueGetter<T> = T | (() => T) | undefined;

export function HostBinding<This, Value>(hostPropertyName: string) {
	return makeClassMemberDecorator<ValueGetter<Value>, ClassFieldDecoratorContext<This, Value> | ClassMethodDecoratorContext<This, any> | ClassGetterDecoratorContext<This, Value>>(
		(value, context, metadata) => {
			if (typeof context.name !== 'string') {
				throw new TypeError(`type ${typeof context.name} of '${context.name.toString()}' is not supported`);
			}
			if (context.private) {
				throw new SyntaxError(`private members '${context.name.toString()}' is not supported.`);
			}
			ReflectComponents.addHostBinding(metadata, context.name, hostPropertyName);
		}
	);
}

/**
 * register a new pipe
 */
export const Pipe = makeClassDecorator<PipeOptions>(
	(opt, constructor, context, metadata) => {
		Components.definePipe(constructor as any, opt, metadata);
	}
);


/**
 * register a new structure or attribute directive 
 */
export const Directive = makeClassDecorator<DirectiveOptions>(
	(opt, constructor, context, metadata) => {
		Components.defineDirective(constructor as any, opt, metadata);
	}
);

/**
 * register a new service
 */
export const Injectable = makeClassDecorator<InjectableOptions>(
	(opt, constructor, context) => {
		Components.defineInjectable(constructor as any, opt, context.metadata);
	}
);

function generateComponent<T extends Type<any>>(target: MetadataClass<T>, opt: ComponentOptions<T>, metadata: MetadataContext) {
	if (opt.templateUrl) {
		fetchHtml(opt.templateUrl)
			.then(htmlTemplate => {
				if (htmlTemplate) {
					opt.template = htmlTemplate;
					Components.defineComponent(target, opt, metadata);
				}
			})
			.catch(reason => {
				console.error(`Error @URL: ${opt.templateUrl}, for model Class: ${target.name},\n Reason: ${reason}.`);
			});
	} else {
		Components.defineComponent(target, opt, metadata);
	}
}

/**
 * define a new custom element model class
 */
export const Component = makeClassDecorator<ComponentOptions | ComponentOptions[]>(
	(opt, constructor, context, metadata) => {
		if (Array.isArray(opt)) {
			for (const comp of opt) {
				generateComponent(constructor as any, comp, metadata);
			}
		} else if (typeof opt === 'object') {
			generateComponent(constructor as any, opt, metadata);
		}
	}
);

export const customElement = makeClassDecorator<{ selector: string } & ElementDefinitionOptions, Type<HTMLElement>>(
	(opt, constructor, context) => {
		Components.defineView(constructor as any, opt);
	}
);
