import type {
	NodeDeserializer, ExpressionNode,
	ExpressionEventPath, VisitNodeType,
} from '../expression.js';
import type { Scope } from '../../scope/scope.js';
import type { Stack } from '../../scope/stack.js';
import { AbstractExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';

export class ImportAliasName {
	static visit(node: ImportAliasName, visitNode: VisitNodeType): void {
		visitNode(node.importName);
		node.aliasName && visitNode(node.aliasName);
	}
	constructor(public importName: ExpressionNode, protected _aliasName?: ExpressionNode) { }

	public get aliasName(): ExpressionNode {
		return this._aliasName || this.importName;
	}

	public set aliasName(_aliasName: ExpressionNode) {
		this._aliasName = _aliasName;
	}

	toString() {
		if (this._aliasName) {
			return `${this.importName.toString()} as ${this._aliasName.toString()}`;
		}
		return this.importName.toString();
	}

	toJSON() {
		return {
			exportName: this.importName.toJSON(),
			aliasName: this._aliasName?.toJSON()
		};
	}
}



@Deserializer('import')
export class ImportNode extends AbstractExpressionNode {
	static fromJSON(node: ImportNode, deserializer: NodeDeserializer): ImportNode {
		return new ImportNode(
			deserializer(node.moduleName),
			node.defaultExport ? deserializer(node.defaultExport) : void 0,
			node.namespace ? deserializer(node.namespace) : void 0,
			node.importAliasNames?.map(expo => new ImportAliasName(deserializer(expo.importName), deserializer(expo.aliasName))),
		);
	}
	static visit(node: ImportNode, visitNode: VisitNodeType): void {
		visitNode(node.moduleName);
		node.defaultExport && visitNode(node.defaultExport);
		node.namespace && visitNode(node.namespace);
		node.importAliasNames?.map(expo => ImportAliasName.visit(expo, visitNode));
	}
	constructor(
		private moduleName: ExpressionNode,
		private defaultExport?: ExpressionNode,
		private namespace?: ExpressionNode,
		private importAliasNames?: ImportAliasName[]) {
		super();
	}
	getModuleName() {
		return this.moduleName;
	}
	getDefaultExport() {
		return this.defaultExport;
	}
	getNamespace() {
		return this.namespace;
	}
	getImportAliasNames() {
		return this.importAliasNames;
	}
	shareVariables(scopeList: Scope<any>[]): void { }
	set(stack: Stack) {
		throw new Error(`ImportNode.#set() has no implementation.`);
	}
	get(stack: Stack) {
		throw new Error(`ImportNode.#get() has no implementation.`);
	}
	dependency(computed?: true): ExpressionNode[] {
		return [];
	}
	dependencyPath(computed?: true): ExpressionEventPath[] {
		return [];
	}
	toString() {
		if (this.defaultExport && this.namespace && this.importAliasNames) {
			// import defaultExport, * as name, { export1 , export2 as alias2 , [...] } from "module-name;
			return `import ${this.defaultExport.toString()}, * as ${this.namespace.toString()}, { ${this.importAliasNames.map(expo => expo.toString()).join(', ')} } from '${this.moduleName.toString()}';`;
		}

		if (this.defaultExport && this.importAliasNames) {
			// import defaultExport, { export1 , export2 as alias2 , [...] } from "module-name;
			return `import ${this.defaultExport.toString()}, { ${this.importAliasNames.map(expo => expo.toString()).join(', ')} } from '${this.moduleName.toString()}';`;

		}
		if (this.namespace && this.importAliasNames) {

			// import * as name, { export1 , export2 as alias2 , [...] } from "module-name;
			return `import * as ${this.namespace.toString()}, { ${this.importAliasNames.map(expo => expo.toString()).join(', ')} } from '${this.moduleName.toString()}';`;
		}
		if (this.namespace && this.defaultExport) {

			// import defaultExport, * as name from "module-name;
			return `import ${this.defaultExport.toString()}, * as ${this.namespace.toString()} from '${this.moduleName.toString()}';`;
		}

		if (this.importAliasNames) {

			// import { export1 , export2 as alias2 , [...] } from "module-name;
			return `import { ${this.importAliasNames.map(expo => expo.toString()).join(', ')} } from '${this.moduleName.toString()}';`;
		}
		if (this.defaultExport) {

			// import defaultExport from "module-name;
			return `import ${this.defaultExport.toString()} from '${this.moduleName.toString()}';`;
		}
		if (this.namespace) {

			// import * as name from "module-name;
			return `import  * as ${this.namespace.toString()} from '${this.moduleName.toString()}';`;
		}

		return `import '${this.moduleName.toString()}'`;
	}
	toJson(): object {
		return {
			moduleName: this.moduleName.toJSON(),
			defaultExport: this.defaultExport?.toJSON(),
			namespace: this.namespace?.toJSON(),
			exportAliasNames: this.importAliasNames?.map(expression => expression.toJSON()),
		};
	}
}
