import type { MetadataClass } from '@ibyar/decorators';
import type { Type } from '../utils/typeof.js';
import { ReactiveControlScope } from '@ibyar/expressions';
import { TemplateRef } from './template-ref.js';
import { EmbeddedViewRef, EmbeddedViewRefImpl, ViewRef } from './view-ref.js';
import { getComponentView } from '../view/utils.js';
import { HTMLComponent } from '../component/custom-element.js';
import { ReflectComponents } from '../component/reflect.js';

interface IndexOptions {
	/**
	 * the index to insert the 
	 */
	index?: number;
}

export interface ViewContainerOptions<C> extends IndexOptions {
	context?: C;
};

export interface ViewContainerComponentOptions extends IndexOptions {
	selector?: string;
};

export interface HTMLElementOptions extends ElementCreationOptions, IndexOptions {

}

export type ElementRef<T> = {
	nativeElement: T;
	viewRef: EmbeddedViewRef<T>;
};

export type ComponentViewRef<T> = {
	instance: T;
	nativeElement: HTMLComponent<T>;
	viewRef: EmbeddedViewRef<T>;
};

export abstract class ViewContainerRef {

	/**
	 * Anchor element that specifies the location of this container in the containing view.
	 * Each view container can have only one anchor element, and each anchor element
	 * can have only a single view container.
	 * 
	 * Root elements of views attached to this container become siblings of the anchor element in
	 * the rendered view.
	 *
	 * Access the `ViewContainerRef` of an element by placing a `Directive` injected
	 * with `ViewContainerRef` on the element, or use a `ViewChild` query.
	 *
	 */
	abstract get anchorElement(): Element;

	/**
	 * Destroys all views in this container.
	 */
	abstract clear(): void;

	/**
	 * Retrieves a view from this container.
	 * @param index The 0-based index of the view to retrieve.
	 * @returns The `ViewRef` instance, or null if the index is out of range.
	 */
	abstract get<T>(index: number): EmbeddedViewRef<T> | undefined;

	/**
	 * Performs the specified action for each element in an array.
	 */
	abstract forEach<T>(callbackfn: (value: EmbeddedViewRef<T>, index: number) => void): void;

	/**
	 * Reports how many views are currently attached to this container.
	 * @returns The number of views.
	 */
	abstract get length(): number;

	/**
	 * Instantiates an embedded view and inserts it
	 * into this container.
	 * @param templateRef The HTML template that defines the view.
	 * @param context The data-binding context of the embedded view, as declared
	 * in the `<ng-template>` usage.
	 * @param index The 0-based index at which to insert the new view into this container.
	 * If not specified, appends the new view as the last entry.
	 *
	 * @returns The `ViewRef` instance for the newly created view.
	 */
	abstract createEmbeddedView<C extends {}>(templateRef: TemplateRef, options?: ViewContainerOptions<C>): EmbeddedViewRef<C>;

	/**
	 * create component by tag name `selector`.
	 * @param selector the tag name for the aurora custom-element
	 * @param options 
	 */
	abstract createComponent<C extends {}>(selector: string, options?: IndexOptions): ComponentViewRef<C>;

	/**
	 * create component by the aurora custom-element `View` Class
	 * @param viewClass the generated aurora view class
	 * @param options 
	 */
	abstract createComponent<C extends {}>(viewClass: Type<HTMLComponent<C>>, options?: IndexOptions): ComponentViewRef<C>;

	/**
	 * Instantiates a single component and inserts its host view into this container.
	 *
	 * @param componentType Component Type to use.
	 * @param options An object that contains extra parameters:
	 *  * index: the index at which to insert the new component's host view into this container.
	 *     If not specified, appends the new view as the last entry.
	 *  * selector: the tag name of the new create component that attached with this model class.
	 * 		Any Model class can have many views with different selectors.
	 *
	 * @returns The new `HTMLComponent` which contains the component instance and the host view.
	 */
	abstract createComponent<C extends {}>(componentType: Type<C>, options?: ViewContainerComponentOptions): ComponentViewRef<C>;

	/**
	 * create an HTMLElement by tag name `selector`.
	 * @param selector the tag name for the aurora custom-element
	 * @param options 
	 */
	abstract createElement<K extends keyof HTMLElementTagNameMap>(selector: K, options?: HTMLElementOptions): ElementRef<HTMLElementTagNameMap[K]>;

	/**
	 * create an HTMLElement by tag name `selector`.
	 * @param selector the tag name for the aurora custom-element
	 * @param options 
	 */
	abstract createElement<K extends keyof HTMLElementDeprecatedTagNameMap>(selector: K, options?: HTMLElementOptions): ElementRef<HTMLElementDeprecatedTagNameMap[K]>;

	/**
	 * create HTMLElement by View Class reference
	 * @param viewClass the generated aurora view class
	 * @param options 
	 */
	abstract createElement<C extends HTMLElement>(htmlElementClass: Type<C>, options?: HTMLElementOptions): ElementRef<C>;

	/**
	 * create a text node and insert to the view
	 * @param data 
	 * @param options 
	 */
	abstract createTextNode(data: string, options?: IndexOptions): Text;

	/**
	 * Inserts a view into this container.
	 * @param viewRef The view to insert.
	 * @param index The 0-based index at which to insert the view.
	 * If not specified, appends the new view as the last entry.
	 * @returns The inserted `ViewRef` instance.
	 *
	 */
	abstract insert(viewRef: ViewRef, index?: number): ViewRef;

	/**
	 * move a view to a new location from another container
	 * @param viewRef the view that needed to be inserted in this container.
	 * @param newIndex new index in this container, or append
	 */
	abstract adopt<T>(viewRef: EmbeddedViewRef<T>, newIndex?: number): void;

	/**
	 * Moves a view to a new location in this container.
	 * @param oldIndex The 0-based index of the old location.
	 * @param newIndex The 0-based index of the new location.
	 */
	abstract move(oldIndex: number, newIndex: number): void;

	/**
	 * swap 2 view position
	 * @param oldIndex 
	 * @param newIndex 
	 */
	abstract swap(index1: number, index2: number): void;

	/**
	 * Returns the index of a view within the current container.
	 * @param viewRef The view to query.
	 * @returns The 0-based index of the view's position in this container,
	 * or `-1` if this container doesn't contain the view.
	 */
	abstract indexOf(viewRef: ViewRef): number;

	/**
	 * Destroys a view attached to this container
	 * @param index The 0-based index of the view to destroy.
	 * If not specified, the last view in the container is removed.
	 */
	abstract remove<T>(index?: number): EmbeddedViewRef<T> | undefined;

	/**
	 * remove a view attached to this container with out destroying it.
	 * the view will be still attached to the DOM.
	 * useful in case of moving the view/component to anther container without realizing it again.
	 * returns the view.
	 * @param index 
	 * @param destroy 
	 * @returns the view in the index
	 */
	abstract remove<T>(index: number, destroy: false): EmbeddedViewRef<T> | undefined;

	/**
	 * Detaches a view from this container without destroying it.
	 * Use along with `insert()` to move a view within the current container.
	 * @param index The 0-based index of the view to detach.
	 * If not specified, the last view in the container is detached.
	 */
	abstract detach<T>(index?: number): EmbeddedViewRef<T> | undefined;

}


export class ViewContainerRefImpl extends ViewContainerRef {

	private _views: EmbeddedViewRef<any>[] = [];

	constructor(parent: Element, firstComment: Comment);
	constructor(private _parent: Element, private _firstComment: Comment) {
		super();
	}
	override get anchorElement(): Element {
		return this._parent;
	}
	override get length(): number {
		return this._views.length;
	}
	override clear(): void {
		if (this._views.length > 0) {
			for (const elm of this._views) {
				elm.destroy();
			}
			this._views.splice(0);
		}
	}
	override get<T>(index: number): EmbeddedViewRef<T> | undefined {
		if (index >= this._views.length) {
			return undefined;
		}
		return this._views[index];
	}
	override detach<T>(index?: number): EmbeddedViewRef<T> | undefined {
		index ??= this._views.length - 1;
		if (index < 0 || index >= this._views.length) {
			return;
		}
		const viewRef = this._views[index];
		viewRef.detach();
		this._views.splice(index, 1);
		return viewRef;
	}
	override adopt<T>(viewRef: EmbeddedViewRef<T>, newIndex = this._views.length): void {
		const lastNode = newIndex == 0 ? this._firstComment : this._views[newIndex - 1].last;
		this._views.splice(newIndex, 0, viewRef);
		viewRef.moveAfter(lastNode);
	}
	override forEach<T>(callbackfn: (value: EmbeddedViewRef<T>, index: number) => void): void {
		this._views.forEach((view, index) => callbackfn(view, index));
	}
	override indexOf<T>(viewRef: EmbeddedViewRef<T>): number {
		return this._views.indexOf(viewRef);
	}
	override remove<T>(index = this._views.length - 1, destroy = true): EmbeddedViewRef<T> | undefined {
		if (index < 0 || index > this._views.length) {
			return;
		}
		destroy && this._views[index].destroy();
		return this._views.splice(index, 1)[0];
	}
	override insert(viewRef: EmbeddedViewRef<any>, index?: number): ViewRef {
		index = ((index ??= this._views.length) > this._views.length) ? this._views.length : index;
		const lastNode = index == 0 ? this._firstComment : this._views[index - 1].last;
		this._views.splice(index, 0, viewRef);
		viewRef.after(lastNode);
		return viewRef;
	}
	override move(oldIndex: number, newIndex: number): void {
		if (oldIndex === newIndex
			|| oldIndex < 0 || oldIndex >= this._views.length
			|| newIndex < 0 || newIndex >= this._views.length) {
			return;
		}
		const view = this._views.at(oldIndex)!;
		const next = this._views.at(newIndex)!;
		view.moveBefore(next.first);
		this._views.splice(oldIndex, 1);
		this._views.splice(newIndex, 0, view);
	}
	swap(index1: number, index2: number): void {
		const min = Math.min(index1, index2);
		const max = Math.max(index1, index2);
		this.move(max, min);
		this.move(min + 1, max);
	}
	override createEmbeddedView<C extends {}>(templateRef: TemplateRef, options?: ViewContainerOptions<C>): EmbeddedViewRef<C> {
		const viewRef = templateRef.createEmbeddedView<C>(options?.context || <C>{}, this._parent);
		this.insert(viewRef, options?.index);
		return viewRef;
	}
	override createComponent<C extends {}>(selector: string, options?: IndexOptions): ComponentViewRef<C>;
	override createComponent<C extends {}>(viewClass: MetadataClass<HTMLComponent<C>>, options?: IndexOptions): ComponentViewRef<C>;
	override createComponent<C extends {}>(componentType: MetadataClass<C>, options?: ViewContainerComponentOptions): ComponentViewRef<C>;
	override createComponent<C extends {}>(arg0: string | MetadataClass<C> | Type<HTMLComponent<C>>, options?: ViewContainerComponentOptions): ComponentViewRef<C> {
		let ViewClass: Type<HTMLComponent<C>>;
		if (typeof arg0 === 'string') {
			ViewClass = customElements.get(arg0) as Type<HTMLComponent<C>>;
		} else if (typeof arg0 === 'function') {
			if (Reflect.has(arg0, 'observedAttributes')) {
				ViewClass = arg0 as Type<HTMLComponent<C>>;
			} else {
				const componentType = arg0 as MetadataClass<C>;
				const defaultTagName = ReflectComponents.getMetaDate(componentType)?.selector;
				const view = getComponentView(componentType, options?.selector ?? defaultTagName);
				if (!view) {
					throw new Error(`Can't find View component for class ${componentType.name}`);
				}
				ViewClass = view;
			}
		} else {
			throw new Error(`Can't find View component for args, ${arg0}, ${options}`);
		}
		const component = new ViewClass();
		const viewRef = new EmbeddedViewRefImpl<C>(component._modelScope, [component]);
		this.insert(viewRef, options?.index);
		return { instance: component._model, nativeElement: component, viewRef: viewRef };
	}

	override createElement<K extends keyof HTMLElementTagNameMap>(selector: K, options?: HTMLElementOptions): ElementRef<HTMLElementTagNameMap[K]>;
	override createElement<K extends keyof HTMLElementDeprecatedTagNameMap>(selector: K, options?: HTMLElementOptions): ElementRef<HTMLElementDeprecatedTagNameMap[K]>;
	override createElement<C extends HTMLElement>(arg0: string | Type<C>, options?: HTMLElementOptions): ElementRef<C> {
		let element: C;
		if (typeof arg0 === 'string') {
			element = document.createElement(arg0, { is: options?.is }) as C;
		} else if (typeof arg0 === 'function') {
			element = new arg0();
		} else {
			throw new Error(`Can't find View component for args, ${arg0}, ${options}`);
		}
		const scope = ReactiveControlScope.for<C>(element);
		const viewRef = new EmbeddedViewRefImpl<C>(scope, [element]);
		this.insert(viewRef, options?.index);
		return { nativeElement: element, viewRef: viewRef };
	}
	override createTextNode(data: string, options?: IndexOptions): Text {
		const text = document.createTextNode(data);
		const scope = ReactiveControlScope.for<Text>(text);
		const viewRef = new EmbeddedViewRefImpl<Text>(scope, [text]);
		this.insert(viewRef, options?.index);
		return text;
	}

}
