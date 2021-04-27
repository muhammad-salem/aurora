import { AbstractExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';
import { ScopedStack } from '../scope.js';

@Deserializer('rest')
export class RestParameterNode extends AbstractExpressionNode {
	static fromJSON(nodeExp: RestParameterNode): RestParameterNode {
		return new RestParameterNode(nodeExp.arrayName);
	}
	constructor(private arrayName: string) {
		super();
	}
	getArrayName() {
		return this.arrayName;
	}
	/**
	 * 
	 * @param context execution stack/scope context
	 * @param value any paramter
	 */
	set(stack: ScopedStack, ...values: any[]) {
		return stack.localScop.set(this.arrayName, values) ? values : void 0;
	}

	/**
	 * used when define a function
	 * @param context execution stack/scope context
	 */
	get(stack: ScopedStack) {
		return stack.localScop.get(this.arrayName);
	}
	entry(): string[] {
		return [];
	}
	event(parent?: string): string[] {
		return [];
	}
	toString(): string {
		return `...${this.arrayName}`;
	}
	toJson(): object {
		return { arrayName: this.arrayName };
	}
}
