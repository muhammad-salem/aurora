import type { NodeDeserializer, ExpressionNode } from '../expression.js';
import { Deserializer } from '../deserialize/deserialize.js';
import { AbstractExpressionNode } from '../abstract.js';
import { ScopedStack } from '../scope.js';
@Deserializer('unary')
export class UnaryNode extends AbstractExpressionNode {
	static fromJSON(node: UnaryNode, deserializer: NodeDeserializer): UnaryNode {
		return new UnaryNode(node.op, deserializer(node.node));
	}
	static Evaluations: { [key: string]: (value: any) => any } = {
		'+': (value: string) => { return +value; },
		'-': (value: number) => { return -value; },
		'~': (value: number) => { return ~value; },
		'!': (value: any) => { return !value; },
		// // 'void': (value: any) => { return void value; },
		// // 'typeof': (value: any) => { return typeof value; },
		// // 'delete': (value: any) => { return delete value; },
	};
	static KEYWORDS = Object.keys(UnaryNode.Evaluations);
	constructor(private op: string, private node: ExpressionNode) {
		super();
	}
	set(stack: ScopedStack, value: any) {
		return this.node.set(stack, value);
	}
	get(stack: ScopedStack) {
		let value = this.node.get(stack);
		return UnaryNode.Evaluations[this.op](value);
	}
	entry(): string[] {
		return this.node.entry();
	}
	event(parent?: string): string[] {
		return [];
	}
	toString() {
		return `${this.op}${this.node.toString()}`;
	}
	toJson(): object {
		return {
			op: this.op,
			node: this.node.toJSON()
		};
	}
}


@Deserializer('literal-unary')
export class LiteralUnaryNode extends AbstractExpressionNode {
	static fromJSON(node: LiteralUnaryNode, serializer: NodeDeserializer): LiteralUnaryNode {
		return new LiteralUnaryNode(node.op, serializer(node.node));
	}
	static KEYWORDS = ['typeof', 'void', 'delete', 'await'];
	constructor(private op: string, private node: ExpressionNode) {
		super();
	}
	set(stack: ScopedStack, value: any) {
		throw new Error('LiteralUnaryNode#set() has no implementation.');
	}
	entry(): string[] {
		return this.node.entry();
	}
	event(parent?: string): string[] {
		if (this.op === 'delete') {
			return this.node.event(parent);
		}
		return [];
	}
	get(stack: ScopedStack, thisContext?: any) {
		switch (this.op) {
			case 'typeof': return this.getTypeof(stack, thisContext);
			case 'void': return this.getVoid(stack, thisContext);
			case 'delete': return this.getDelete(stack, thisContext);
			case 'await': return this.getAwait(stack, thisContext);
		}
	}
	private getTypeof(stack: ScopedStack, thisContext?: any) {
		return typeof this.node.get(stack);
	}
	private getVoid(stack: ScopedStack, thisContext?: any) {
		return void this.node.get(stack);
	}
	private getDelete(stack: ScopedStack, thisContext?: any) {
		if (thisContext) {
			Proxy
			delete thisContext[this.node.toString()];
		}
	}
	private async getAwait(stack: ScopedStack, thisContext?: any) {
		return await this.node.get(stack);
	}
	toString() {
		return `${this.op} ${this.node.toString()}`;
	}
	toJson(): object {
		return {
			op: this.op,
			node: this.node.toJSON()
		};
	}
}
