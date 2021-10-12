import type { NodeDeserializer, ExpressionNode, DependencyVariables } from '../expression.js';
import type { Scope } from '../../scope/scope.js';
import type { Stack } from '../../scope/stack.js';
import { AbstractExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';

export class ExportAliasName {
	constructor(public exportName: ExpressionNode, protected _aliasName?: ExpressionNode) { }

	public get aliasName(): ExpressionNode {
		return this._aliasName || this.exportName;
	}

	public set aliasName(_aliasName: ExpressionNode) {
		this._aliasName = _aliasName;
	}

	toString() {
		if (this._aliasName) {
			return `${this.exportName.toString()} as ${this._aliasName.toString()}`;
		}
		return this.exportName.toString();
	}

	toJSON() {
		return {
			exportName: this.exportName.toJSON(),
			aliasName: this._aliasName?.toJSON()
		};
	}
}

/**
 * There are two types of exports:
 * 1- Named Exports (Zero or more exports per module)
 * 2- Default Exports (One per module)
 * 
 * // Exporting individual features
 * export let name1, name2, …, nameN; // also var, const
 * export let name1 = …, name2 = …, …, nameN; // also var, const
 * export function functionName(){...}
 * export class ClassName {...}
 * 
 * // Export list
 * export { name1, name2, …, nameN };
 * 
 * // Renaming exports
 * export { variable1 as name1, variable2 as name2, …, nameN };
 * 
 * // Exporting destructed assignments with renaming
 * export const { name1, name2: bar } = o;
 * 
 * // Default exports
 * export default expression;
 * export default function (…) { … } // also class, function*
 * export default function name1(…) { … } // also class, function*
 * export { name1 as default, … };
 * 
 * // Aggregating modules
 * export * from …; // does not set the default export
 * export * as name1 from …; // Draft ECMAScript® 2O21
 * export { name1, name2, …, nameN } from …;
 * export { import1 as name1, import2 as name2, …, nameN } from …;
 * export { default, … } from …;
 */
@Deserializer('export')
export class ExportNode extends AbstractExpressionNode {
	static fromJSON(node: ExportNode, deserializer: NodeDeserializer): ExportNode {
		return new ExportNode(
			node.exportList?.map(expo => new ExportAliasName(deserializer(expo.exportName), deserializer(expo.aliasName))),
			node.starExport ? new ExportAliasName(deserializer(node.starExport.exportName), deserializer(node.starExport.aliasName)) : void 0,
			node.exportExpression ? new ExportAliasName(deserializer(node.exportExpression.exportName), deserializer(node.exportExpression.aliasName)) : void 0,
			node.moduleName ? deserializer(node.moduleName) : void 0
		);
	}
	constructor(
		private exportList?: ExportAliasName[],
		private starExport?: ExportAliasName,
		private exportExpression?: ExportAliasName,
		private moduleName?: ExpressionNode) {
		super();
	}
	getModuleName() {
		return this.moduleName;
	}
	getExportExpression() {
		return this.exportExpression;
	}
	getExportList() {
		return this.exportList;
	}
	shareVariables(scopeList: Scope<any>[]): void { }
	set(stack: Stack) {
		throw new Error(`ExportNode.#set() has no implementation.`);
	}
	get(stack: Stack) {
		throw new Error(`ExportNode.#get() has no implementation.`);
	}
	events(): DependencyVariables {
		return [];
	}
	toString() {
		// Aggregating modules
		if (this.exportList && this.moduleName) {
			return `export { ${this.exportList.map(expo => expo.toString()).join(', ')} } from '${this.moduleName.toString()}';`;
		}
		if (this.starExport && this.moduleName) {
			return `export ${this.starExport.toString()} from '${this.moduleName.toString()}';`;
		}

		if (this.exportList) {
			return `export { ${this.exportList.map(expo => expo.toString()).join(', ')} };`;
		}
		if (this.exportExpression) {
			return `export ${this.exportExpression.toString()};`;
		}
		throw new Error(`not enough params found,at least 'exportExpression' should be initialized.`);
	}
	toJson(): object {
		return {
			exportList: this.exportList?.map(expression => expression.toJSON()),
			starExport: this.starExport?.toJSON(),
			exportExpression: this.exportExpression?.toJSON(),
			moduleName: this.moduleName?.toJSON(),
		};
	}
}
