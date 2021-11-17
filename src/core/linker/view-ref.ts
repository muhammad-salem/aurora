
export abstract class ViewRef {
	/**
	 * Destroys this view and all of the data structures associated with it.
	 */
	abstract destroy(): void;

	/**
	 * Reports whether this view has been destroyed.
	 * @returns True after the `destroy()` method has been called, false otherwise.
	 */
	abstract get destroyed(): boolean;

	/**
	 * A lifecycle hook that provides additional developer-defined cleanup
	 * functionality for views.
	 * @param callback A handler function that cleans up developer-defined data
	 * associated with a view. Called when the `destroy()` method is invoked.
	 */
	abstract onDestroy(callback: Function): { unsubscribe(): void };
}


export abstract class EmbeddedViewRef<C extends object> extends ViewRef {
	/**
	 * The context for this view, inherited from the anchor element.
	 */
	abstract get context(): C;

	/**
	 * The root nodes for this embedded view.
	 */
	abstract get rootNodes(): Node[];

	/**
	 * the first node for this embedded view.
	 */
	abstract get first(): ChildNode;

	/**
	 * the last node for this embedded view.
	 */
	abstract get last(): ChildNode;

	/**
	 * insert view after the node.
	 * @param node 
	 */
	abstract after(node: ChildNode): void;

	/**
	 * insert view before the node.
	 * @param node 
	 */
	abstract before(node: ChildNode): void;

	/**
	 * remove the root nodes from the view, but keep reference to them.
	 * 
	 * Detaches a view from this container without destroying it.
	 * Use along with after()/before() to move a view within the current container.
	 */
	abstract detach(): void;
}

export class EmbeddedViewRefImpl<C extends object> extends EmbeddedViewRef<C> {

	private _destroyed: boolean = false;
	private subscribes: (() => void)[] = [];

	constructor(
		private _context: C,
		private _rootNodes: Node[]) {
		super();
	}

	get context(): C {
		return this._context;
	}

	get rootNodes(): Node[] {
		return this._rootNodes;
	}
	get first(): Element {
		return this._rootNodes[0] as Element;
	}
	get last(): Element {
		return this._rootNodes[this._rootNodes.length - 1] as Element;
	}
	get destroyed(): boolean {
		return this._destroyed;
	}
	destroy(): void {
		if (!this._destroyed) {
			for (const node of this._rootNodes) {
				(<Element>node).remove();
			}
			this.subscribes.forEach(callback => {
				try {
					callback();
				} catch (error) {
					console.error(error);
				}
			});
			this._destroyed = true;
		}
	}
	private getAsANode() {
		if (this._rootNodes.length == 1) {
			return this._rootNodes[0];
		}
		const fragment = document.createDocumentFragment();
		this._rootNodes.forEach(node => fragment.append(node));
		return fragment;
	}
	after(node: ChildNode): void {
		node.after(this.getAsANode());
	}
	before(node: ChildNode): void {
		node.before(this.getAsANode());
	}
	detach(): void {
		for (const node of this._rootNodes) {
			(<Element>node).remove();
		}
	}
	onDestroy(callback: () => {}): { unsubscribe(): void; } {
		this.subscribes.push(callback);
		return {
			unsubscribe: () => {
				const index = this.subscribes.indexOf(callback);
				if (index > -1) {
					this.subscribes.splice(index, 1);
				}
			}
		};
	}

}
