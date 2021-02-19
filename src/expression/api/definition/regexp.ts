
import { Deserializer } from '../deserialize/deserialize.js';
import { AbstractExpressionNode } from '../abstract.js';
import { ScopedStack } from '../scope.js';

@Deserializer('regexp')
export class RegExpNode extends AbstractExpressionNode {

	static fromJSON(node: RegExpNode & { source: string, flags: string }): RegExpNode {
		return new RegExpNode(new RegExp(node.source, node.flags));
	}

	constructor(private regex: RegExp) {
		super();
	}

	set(stack: ScopedStack, value: any) {
		throw new Error("RegExpNode#set() has no implementation.");
	}

	get(stack: ScopedStack) {
		return this.regex;
	}

	entry(): string[] {
		return [];
	}

	event(): string[] {
		return [];
	}

	toString(): string {
		return String(this.regex);
	}

	toJson(): object {
		return {
			source: this.regex.source,
			flags: this.regex.flags
		};
	}
}
