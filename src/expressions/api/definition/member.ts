import type { ScopedStack } from '../scope.js';
import type { NodeDeserializer, ExpressionNode } from '../expression.js';
import { Deserializer } from '../deserialize/deserialize.js';
import { AbstractExpressionNode } from '../abstract.js';

export abstract class AccessNode extends AbstractExpressionNode {
	constructor(protected left: ExpressionNode, protected right: ExpressionNode) {
		super();
	}
	getLeft() {
		return this.left;
	}
	getRight() {
		return this.right;
	}
	get(stack: ScopedStack, thisContext?: any) {
		const thisRef = thisContext ?? this.left.get(stack);
		const value = this.right.get(stack, thisRef);
		if (typeof value === 'function') {
			return (<Function>value).bind(thisRef);
		}
		return value;
	}
	set(stack: ScopedStack, value: any) {
		return this.right.set(stack.stackFor(this.left.get(stack)), value);
	}
	entry(): string[] {
		return this.left.entry();
	}
	toJson(): object {
		return {
			left: this.left.toJSON(),
			right: this.right.toJSON()
		};
	}
	abstract event(parent?: string): string[];
	abstract toString(): string;
}

@Deserializer('member')
export class MemberAccessNode extends AccessNode {
	static fromJSON(node: MemberAccessNode, deserializer: NodeDeserializer): MemberAccessNode {
		return new MemberAccessNode(deserializer(node.left), deserializer(node.right));
	}
	event(parent?: string): string[] {
		parent ||= '';
		parent += this.left.toString() + '.';
		return this.right.event(parent);
	}
	toString() {
		return `${this.left.toString()}.${this.right.toString()}`;
	}
}

@Deserializer('computed-member')
export class ComputedMemberAccessNode extends AccessNode {
	static fromJSON(node: ComputedMemberAccessNode, deserializer: NodeDeserializer): ComputedMemberAccessNode {
		return new ComputedMemberAccessNode(deserializer(node.left), deserializer(node.right));
	}
	event(parent?: string): string[] {
		return [`${parent}${this.left.event(parent)}[${this.right.event()}]`];
	}
	toString() {
		return `${this.left.toString()}[${this.right.toString()}]`;
	}
}
