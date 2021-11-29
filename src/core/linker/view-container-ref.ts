import type { TypeOf } from '../utils/typeof.js';
import { Components } from '../component/component.js';
import { TemplateRef } from './template-ref.js';
import { EmbeddedViewRef, EmbeddedViewRefImpl, ViewRef } from './view-ref.js';
import { getComponentView } from '../view/view.js';

export type ViewContainerOptions<C> = {
	index?: number;
	context?: C;
};

export type ViewContainerComponentOptions = {
	index?: number | undefined;
	selector?: string;
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
	abstract get(index: number): ViewRef | undefined;

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
	abstract createEmbeddedView<C extends object>(templateRef: TemplateRef, options?: ViewContainerOptions<C>): EmbeddedViewRef<C>;

	/**
   * Instantiates a single component and inserts its host view into this container.
   *
   * @param componentType Component Type to use.
   * @param options An object that contains extra parameters:
   *  * index: the index at which to insert the new component's host view into this container.
   *           If not specified, appends the new view as the last entry.
   *  * selector: the tag name of the new create component that attached with this model class.
   * 			Any Model class can have many views with different selectors. 
   *
   * @returns The new `HTMLComponent` which contains the component instance and the host view.
   */
	abstract createComponent<C extends object>(componentType: TypeOf<C>, options?: ViewContainerComponentOptions): C;

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
	 * Moves a view to a new location in this container.
	 * @param viewRef The view to move.
	 * @param newIndex The 0-based index of the new location.
	 * @returns The moved `ViewRef` instance.
	 */
	abstract move(viewRef: ViewRef, newIndex: number): ViewRef;

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
	abstract remove(index?: number): void;

	/**
	 * Detaches a view from this container without destroying it.
	 * Use along with `insert()` to move a view within the current container.
	 * @param index The 0-based index of the view to detach.
	 * If not specified, the last view in the container is detached.
	 */
	abstract detach(index?: number): ViewRef | undefined;
}


export class ViewContainerRefImpl extends ViewContainerRef {

	private views: EmbeddedViewRef<any>[] = [];

	constructor(
		private parent: Element,
		private firstComment: Comment
	) {
		super();
	}
	override get anchorElement(): Element {
		return this.parent;
	}
	override get length(): number {
		return this.views.length;
	}
	override clear(): void {
		if (this.views.length > 0) {
			for (const elm of this.views) {
				elm.destroy();
			}
			this.views.splice(0);
		}
	}
	override get(index: number): ViewRef | undefined {
		if (index >= this.views.length) {
			return undefined;
		}
		return this.views[index];
	}
	override detach(index?: number): ViewRef | undefined {
		index ??= this.views.length - 1;
		const viewRef = this.views[index];
		viewRef.detach();
		this.views.splice(index, 1);
		return viewRef;
	}
	override indexOf(viewRef: EmbeddedViewRef<any>): number {
		return this.views.indexOf(viewRef);
	}
	override remove(index?: number): void {
		index ??= this.views.length - 1;
		this.views[index].destroy();
		this.views.splice(index, 1);
	}
	override insert(viewRef: EmbeddedViewRef<any>, index?: number): ViewRef {
		index = ((index ??= this.views.length) > this.views.length) ? this.views.length : index;
		const lastNode = index == 0 ? this.firstComment : this.views[index - 1].last;
		this.views.splice(index, 0, viewRef);
		viewRef.after(lastNode);
		return viewRef;
	}
	override move(viewRef: EmbeddedViewRef<any>, newIndex: number): ViewRef {
		const oldIndex = this.indexOf(viewRef);
		if (oldIndex > -1) {
			this.detach(oldIndex);
		} else {
			// should remove it from the container first
			viewRef.detach();
		}
		return this.insert(viewRef, newIndex);
	}
	override createEmbeddedView<C extends object>(templateRef: TemplateRef, options?: ViewContainerOptions<C>): EmbeddedViewRef<C> {
		const viewRef = templateRef.createEmbeddedView<C>(options?.context || <C>{}, this.parent);
		this.insert(viewRef, options?.index);
		return viewRef;
	}
	override createComponent<C extends object>(componentType: TypeOf<C>, options?: ViewContainerComponentOptions): C {
		const defaultTagName = Components.getComponentRef<C>(componentType).selector;
		const ViewClass = getComponentView(componentType, options?.selector ?? defaultTagName);
		if (!ViewClass) {
			throw new Error(`Can't find View component for class ${componentType.name}`);
		}
		const component = new ViewClass();
		const viewRef = new EmbeddedViewRefImpl<C>(component._proxyModel, [component]);
		this.insert(viewRef, options?.index);
		return component._proxyModel;
	}

}
