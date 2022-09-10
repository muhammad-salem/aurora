
/**
 *  There are two types of exports:
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

import type {
	NodeDeserializer, ExpressionNode,
	ExpressionEventPath, VisitNodeType, DeclarationExpression
} from '../expression.js';
import { ModuleContext, ReactiveScope, Scope } from '../../scope/scope.js';
import { Stack } from '../../scope/stack.js';
import { AbstractExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';
import { Identifier, Literal } from '../definition/values.js';
import { ImportAttribute, ModuleSpecifier } from './common.js';
import { FunctionDeclaration } from '../definition/function.js';
import { ClassDeclaration } from '../class/class.js';


/**
 * An exported variable binding, e.g., `{foo}` in `export {foo}` or `{bar as foo}` in `export {bar as foo}`.
 * 
 * The `exported` field refers to the name exported in the module.
 * 
 * The `local` field refers to the binding into the local module scope.
 * 
 * If it is a basic named export, such as in `export {foo}`, both `exported` and `local` are equivalent `Identifier` nodes;
 * in this case an Identifier node representing `foo`.
 * 
 * If it is an aliased export,
 * such as in `export {bar as foo}`, the `exported` field is an `Identifier` node representing `foo`,
 * and the `local` field is an `Identifier` node representing `bar`.
 */
@Deserializer('ExportSpecifier')
export class ExportSpecifier extends ModuleSpecifier {
	static fromJSON(node: ExportSpecifier, deserializer: NodeDeserializer): ExportSpecifier {
		return new ExportSpecifier(
			deserializer(node.local) as Identifier,
			deserializer(node.exported) as Identifier
		);
	}
	static visit(node: ExportSpecifier, visitNode: VisitNodeType): void {
		visitNode(node.local);
		visitNode(node.exported);
	}
	constructor(local: Identifier, private exported: Identifier) {
		super(local);
	}
	getExported() {
		return this.exported;
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
		const exported = this.exported.toString();
		if (local == exported) {
			return local;
		}
		return `${local} as ${exported}`;
	}
	toJson(): object {
		return {
			local: this.local.toJSON(),
			exported: this.exported.toJSON()
		};
	}
}


/**
 * An export named declaration, e.g.,
 * `export {foo, bar};`,
 * `export {foo} from "mod";`
 * or `export var foo = 1;`.
 * 
 * Note: Having `declaration` populated with non-empty `specifiers` or non-null `source` results in an invalid state.
 */
@Deserializer('ExportNamedDeclaration')
export class ExportNamedDeclaration extends AbstractExpressionNode {
	static fromJSON(node: ExportNamedDeclaration, deserializer: NodeDeserializer): ExportNamedDeclaration {
		return new ExportNamedDeclaration(
			node.specifiers.map(deserializer) as ExportSpecifier[],
			node.declaration ? deserializer(node.declaration) as DeclarationExpression : void 0,
			node.source ? deserializer(node.source) as Literal<string> : void 0,
			node.assertions ? node.assertions.map(deserializer) as ImportAttribute[] : void 0,
		);
	}
	static visit(node: ExportNamedDeclaration, visitNode: VisitNodeType): void {
		node.specifiers.map(visitNode);
		node.source && visitNode(node.source);
		node.declaration && visitNode(node.declaration);
		node.assertions?.forEach(visitNode);
	}
	constructor(
		private specifiers: ExportSpecifier[],
		private declaration?: DeclarationExpression,
		private source?: Literal<string>,
		private assertions?: ImportAttribute[],) {
		super();
	}
	getSource() {
		return this.source;
	}
	getSpecifiers() {
		return this.specifiers;
	}
	getDeclaration() {
		return this.declaration;
	}
	getAssertions() {
		return this.assertions;
	}
	shareVariables(scopeList: Scope<any>[]): void { }
	set(stack: Stack) {
		throw new Error(`ExportNamedDeclaration.#set() has no implementation.`);
	}
	get(stack: Stack) {
		if (this.declaration) {
			this.exportDeclaration(stack);
		}
		else if (this.source) {
			this.exportFromSource(stack);
		} else {
			this.exportLocal(stack);
		}
	}

	private exportDeclaration(stack: Stack) {
		if (!this.declaration) {
			return
		}
		const declaration = this.declaration.get(stack);
		const declaredName = this.declaration.getDeclarationName!();
		if (!declaredName) {
			throw new Error(`Name is not defined for ${declaration.toString()}`);
		}
		stack.getModule()!.set(declaredName, declaration);
	}
	private exportFromSource(stack: Stack) {
		if (!this.source) {
			return;
		}
		let importCallOptions: ImportCallOptions | undefined;
		if (this.assertions) {
			const importAssertions: ImportAssertions = this.assertions
				.map(assertion => assertion.get(stack))
				.reduce((p, c) => Object.assign(p, c), {});
			if (importAssertions) {
				importCallOptions = { assert: importAssertions };
			}
		}
		const sourceModule = stack.importModule(this.source.get(), importCallOptions);
		const localModule = stack.getModule()!;
		this.specifiers.forEach(specifier => {
			const localName = specifier.getLocal().get(stack);
			const exportedName = specifier.getExported().get(stack);
			const localValue = sourceModule.get(localName);
			localModule.set(exportedName, localValue);
			const scopeSubscription = sourceModule.subscribe(localName, (newLocalValue, oldLocalValue) => {
				if (newLocalValue !== oldLocalValue) {
					localModule.set(exportedName, newLocalValue);
				}
			});
			stack.onDestroy(() => scopeSubscription.unsubscribe());
		});
	}
	private exportLocal(stack: Stack, importCallOptions?: ImportCallOptions) {
		const localModule = stack.getModule()!;
		this.specifiers.forEach(specifier => {
			const localName = specifier.getLocal().get(stack);
			const exportedName = specifier.getExported().get(stack);
			const localValue = stack.get(localName);
			localModule.set(exportedName, localValue);
			const scope = stack.findScope(localName);
			if (scope instanceof ReactiveScope) {
				const scopeSubscription = scope.subscribe(localName, (newLocalValue, oldLocalValue) => {
					if (newLocalValue !== oldLocalValue) {
						localModule.set(exportedName, newLocalValue);
					}
				});
				stack.onDestroy(() => scopeSubscription.unsubscribe());
			}
		});
	}

	dependency(computed?: true): ExpressionNode[] {
		return [];
	}
	dependencyPath(computed?: true): ExpressionEventPath[] {
		return [];
	}
	toString() {
		if (this.declaration) {
			const declaration = this.declaration.toString();
			return `export ${declaration}`;
		}
		const specifiers = this.specifiers.map(specifier => specifier.toString()).join(',');
		let exportStr = `export {${specifiers}}`;
		if (!this.source) {
			return `${exportStr};`;
		}
		const source = this.source.toString();
		return `${exportStr} from ${source}${this.assertions ? ` assert { ${this.assertions.map(assertion => assertion.toString()).join(', ')} }` : ''};`;
	}
	toJson(): object {
		return {
			specifiers: this.specifiers.map(specifier => specifier.toJSON()),
			source: this.source?.toJSON(),
			declaration: this.declaration?.toJSON(),
			assertions: this.assertions?.map(assertion => assertion.toJSON()),
		};
	}
}


/**
 * An export default declaration, e.g., 
 * `export default function () {};`
 * or `export default 1;`.
 */
@Deserializer('ExportDefaultDeclaration')
export class ExportDefaultDeclaration extends AbstractExpressionNode {
	static fromJSON(node: ExportDefaultDeclaration, deserializer: NodeDeserializer): ExportDefaultDeclaration {
		return new ExportDefaultDeclaration(deserializer(node.declaration));
	}
	static visit(node: ExportDefaultDeclaration, visitNode: VisitNodeType): void {
		visitNode(node.declaration);
	}
	constructor(
		private declaration: FunctionDeclaration | ClassDeclaration | ExpressionNode) {
		super();
	}
	getDeclaration() {
		return this.declaration;
	}
	shareVariables(scopeList: Scope<any>[]): void { }
	set(stack: Stack) {
		throw new Error(`ExportDefaultDeclaration.#set() has no implementation.`);
	}
	get(stack: Stack) {
		const declaration = this.declaration.get(stack);
		stack.getModule()!.set('default', declaration);
	}
	dependency(computed?: true): ExpressionNode[] {
		return [];
	}
	dependencyPath(computed?: true): ExpressionEventPath[] {
		return [];
	}
	toString() {
		const declaration = this.declaration.toString();
		return `export default ${declaration}`;
	}
	toJson(): object {
		return {
			declaration: this.declaration.toJSON(),
		};
	}
}

/**
 * An export batch declaration, e.g., `export * from "mod";`.
 */
@Deserializer('ExportAllDeclaration')
export class ExportAllDeclaration extends AbstractExpressionNode {
	static fromJSON(node: ExportAllDeclaration, deserializer: NodeDeserializer): ExportAllDeclaration {
		return new ExportAllDeclaration(
			deserializer(node.source) as Literal<string>,
			node.exported ? deserializer(node.exported) as Identifier : void 0,
			node.assertions?.map(deserializer) as ImportAttribute[],
		);
	}
	static visit(node: ExportAllDeclaration, visitNode: VisitNodeType): void {
		visitNode(node.source);
		node.exported && visitNode(node.exported);
		node.assertions?.forEach(visitNode);
	}
	constructor(
		private source: Literal<string>,
		private exported?: Identifier,
		private assertions?: ImportAttribute[],) {
		super();
	}
	getSource() {
		return this.source;
	}
	getExported() {
		return this.exported;
	}
	getAssertions() {
		return this.assertions;
	}
	shareVariables(scopeList: Scope<any>[]): void { }
	set(stack: Stack) {
		throw new Error(`ExportDefaultDeclaration.#set() has no implementation.`);
	}
	get(stack: Stack) {
		let importCallOptions: ImportCallOptions | undefined;
		if (this.assertions) {
			const importAssertions: ImportAssertions = this.assertions
				.map(assertion => assertion.get(stack))
				.reduce((p, c) => Object.assign(p, c), {});
			if (importAssertions) {
				importCallOptions = { assert: importAssertions };
			}
		}
		let localModule: ReactiveScope<ModuleContext> = stack.getModule()!;
		const sourceModule = stack.importModule(this.source.get(), importCallOptions);

		if (this.exported) {
			const exportedName = this.exported.get(stack);
			localModule.set(exportedName, {});
			localModule = localModule.getInnerScope(exportedName)!;
		}

		const properties = Object.keys(sourceModule.getContext()) as (keyof ModuleContext)[];
		properties.forEach(property => {

			const localValue = sourceModule.get(property);
			localModule.set(property, localValue);
			const scopeSubscription = sourceModule.subscribe(property, (newLocalValue, oldLocalValue) => {
				if (newLocalValue !== oldLocalValue) {
					localModule.set(property, newLocalValue);
				}
			});
			stack.onDestroy(() => scopeSubscription.unsubscribe());
		});
	}
	dependency(computed?: true): ExpressionNode[] {
		return [];
	}
	dependencyPath(computed?: true): ExpressionEventPath[] {
		return [];
	}
	toString() {
		return `export *${this.exported ? ` as ${this.exported.toString()}` : ''} from ${this.source.toString()}${this.assertions ? ` assert { ${this.assertions.map(assertion => assertion.toString()).join(', ')} }` : ''};`;
	}
	toJson(): object {
		return {
			source: this.source.toJSON(),
			exported: this.exported?.toJSON(),
			assertions: this.assertions?.map(assertion => assertion.toJSON()),
		};
	}
}
