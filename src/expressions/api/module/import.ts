import type {
	NodeDeserializer, ExpressionNode,
	ExpressionEventPath, VisitNodeType,
} from '../expression.js';
import type { Scope } from '../../scope/scope.js';
import type { Stack } from '../../scope/stack.js';
import { AbstractExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';
import { Identifier, Literal } from '../definition/values.js';

export abstract class ModuleSpecifier extends AbstractExpressionNode {
	constructor(protected local: Identifier) {
		super();
	}
	getLocal() {
		return this.local;
	}
	toJson(): object {
		return {
			local: this.local.toJSON()
		};
	}
}

/**
 * An imported variable binding,
 * 
 * e.g., {foo} in import {foo} from "mod"
 * or {foo as bar} in import {foo as bar} from "mod".
 * 
 * The imported field refers to the name of the export imported from the module.
 * 
 * The local field refers to the binding imported into the local module scope.
 * 
 * If it is a basic named import, such as in import {foo} from "mod",
 * both imported and local are equivalent Identifier nodes; in this case an Identifier node representing foo.
 * 
 * If it is an aliased import, such as in import {foo as bar} from "mod",
 * the imported field is an Identifier node representing foo,
 * and the local field is an Identifier node representing bar.
 */
@Deserializer('ImportSpecifier')
export class ImportSpecifier extends ModuleSpecifier {
	static fromJSON(node: ImportSpecifier, deserializer: NodeDeserializer): ImportSpecifier {
		return new ImportSpecifier(
			deserializer(node.local) as Identifier,
			deserializer(node.imported) as Identifier
		);
	}
	static visit(node: ImportSpecifier, visitNode: VisitNodeType): void {
		visitNode(node.local);
		visitNode(node.imported);
	}
	constructor(local: Identifier, private imported: Identifier) {
		super(local);
	}
	getImported() {
		return this.imported;
	}
	shareVariables(scopeList: Scope<any>[]): void {

	}
	set(stack: Stack, value: any) {
		throw new Error('Method not implemented.');
	}
	get(stack: Stack, thisContext?: any) {
		throw new Error('Method not implemented.');
	}
	dependency(computed?: true): ExpressionNode[] {
		return [];
	}
	dependencyPath(computed?: true): ExpressionEventPath[] {
		return [];
	}
	toString(): string {
		const local = this.local.toString();
		const imported = this.imported.toString();
		if (local == imported) {
			return local;
		}
		return `${imported} as ${local}`;
	}
	toJson(): object {
		return {
			local: this.local.toJSON(),
			imported: this.imported.toJSON()
		};
	}
}

/**
 * A default import specifier, e.g., foo in import foo from "mod.js".
 */
@Deserializer('ImportDefaultSpecifier')
export class ImportDefaultSpecifier extends ModuleSpecifier {
	static fromJSON(node: ImportDefaultSpecifier, deserializer: NodeDeserializer): ImportDefaultSpecifier {
		return new ImportDefaultSpecifier(
			deserializer(node.local) as Identifier
		);
	}
	static visit(node: ImportDefaultSpecifier, visitNode: VisitNodeType): void {
		visitNode(node.local);
	}
	shareVariables(scopeList: Scope<any>[]): void {

	}
	set(stack: Stack, value: any) {
		throw new Error('Method not implemented.');
	}
	get(stack: Stack, thisContext?: any) {
		throw new Error('Method not implemented.');
	}
	dependency(computed?: true): ExpressionNode[] {
		return [];
	}
	dependencyPath(computed?: true): ExpressionEventPath[] {
		return [];
	}
	toString(): string {
		return this.local.toString();
	}
}

/**
 * A namespace import specifier, e.g., * as foo in import * as foo from "mod.js".
 */
@Deserializer('ImportNamespaceSpecifier')
export class ImportNamespaceSpecifier extends ModuleSpecifier {
	static fromJSON(node: ImportNamespaceSpecifier, deserializer: NodeDeserializer): ImportNamespaceSpecifier {
		return new ImportNamespaceSpecifier(
			deserializer(node.local) as Identifier
		);
	}
	static visit(node: ImportNamespaceSpecifier, visitNode: VisitNodeType): void {
		visitNode(node.local);
	}
	shareVariables(scopeList: Scope<any>[]): void {

	}
	set(stack: Stack, value: any) {
		throw new Error('Method not implemented.');
	}
	get(stack: Stack, thisContext?: any) {
		throw new Error('Method not implemented.');
	}
	dependency(computed?: true): ExpressionNode[] {
		return [];
	}
	dependencyPath(computed?: true): ExpressionEventPath[] {
		return [];
	}
	toString(): string {
		return `* as ${this.local.toString()}`;
	}
}

/**
 * An import declaration, e.g., import foo from "mod";.
 * 
 * import defaultExport from "module-name";
 * 
 * import * as name from "module-name";
 * 
 * import { export1 } from "module-name";
 * 
 * import { export1 as alias1 } from "module-name";
 * 
 * import { export1 , export2 } from "module-name";
 * 
 * import { foo , bar } from "module-name/path/to/specific/un-exported/file";
 * 
 * import { export1 , export2 as alias2 , [...] } from "module-name";
 * 
 * import defaultExport, { export1 [ , [...] ] } from "module-name";
 * 
 * import defaultExport, * as name from "module-name";
 * 
 * import "module-name";
 * 
 * var promise = import("module-name");
 */
@Deserializer('ImportDeclaration')
export class ImportDeclaration extends AbstractExpressionNode {
	static fromJSON(node: ImportDeclaration, deserializer: NodeDeserializer): ImportDeclaration {
		return new ImportDeclaration(
			deserializer(node.source) as Literal<string>,
			node.specifiers?.map(deserializer) as (ImportSpecifier | ImportDefaultSpecifier | ImportNamespaceSpecifier)[],
		);
	}
	static visit(node: ImportDeclaration, visitNode: VisitNodeType): void {
		visitNode(node.source);
		node.specifiers?.forEach(visitNode);
	}
	constructor(private source: Literal<string>, private specifiers?: (ImportSpecifier | ImportDefaultSpecifier | ImportNamespaceSpecifier)[]) {
		super();
	}
	getSource() {
		return this.source;
	}
	getSpecifiers() {
		return this.specifiers;
	}
	shareVariables(scopeList: Scope<any>[]): void { }
	set(stack: Stack) {
		throw new Error(`ImportDeclaration.#set() has no implementation.`);
	}
	get(stack: Stack) {
		throw new Error(`ImportDeclaration.#get() has no implementation.`);
	}
	dependency(computed?: true): ExpressionNode[] {
		return [];
	}
	dependencyPath(computed?: true): ExpressionEventPath[] {
		return [];
	}
	toString(): string {
		if (!this.specifiers) {
			return `import '${this.source.toString()}'`;
		}
		const parts: string[] = [];
		const importDefaultSpecifiers = this.specifiers.filter(specifier => specifier instanceof ImportDefaultSpecifier) as ImportDefaultSpecifier[];
		if (importDefaultSpecifiers?.length) {
			parts.push(importDefaultSpecifiers[0].toString());
		}
		const importNamespaceSpecifiers = this.specifiers.filter(specifier => specifier instanceof ImportNamespaceSpecifier) as ImportNamespaceSpecifier[];
		if (importNamespaceSpecifiers?.length) {
			parts.push(importNamespaceSpecifiers[0].toString());
		}
		const importSpecifiers = this.specifiers.filter(specifier => specifier instanceof ImportSpecifier) as ImportSpecifier[];
		if (importSpecifiers?.length) {
			const importSpecifiersString = importSpecifiers.map(importSpecifier => importSpecifier.toString()).join(',');
			parts.push(`{ ${importSpecifiersString} }`);
		}
		return `import ${parts.join(', ')} '${this.source.toString()}'`;
	}
	toJson(): object {
		return {
			source: this.source.toJSON(),
			specifiers: this.specifiers?.map(specifier => specifier.toJSON()),
		};
	}
}
