import ts from 'typescript/lib/tsserverlibrary.js';
import { DirectiveInfo, registerDirectiveCall } from '../directives/register.js';


function removeQuotations(string: string) {
	return string.substring(1, string.length - 1);
}

function extractDirectives(alias: ts.TypeAliasDeclaration, sourceFile: ts.SourceFile) {
	const elm = alias.type;
	if (!ts.isTypeLiteralNode(elm)) {
		return;
	}
	const info = {} as DirectiveInfo;
	elm.members.forEach(member => {
		if (!ts.isPropertySignature(member)) {
			return;
		}
		const name = member.name.getText(sourceFile);
		if ((name === 'selector') && member.type && ts.isLiteralTypeNode(member.type)) {
			const value = member.type.literal.getText(sourceFile);
			info[name] = removeQuotations(value);
		} else if ((name === 'successors') && member.type && ts.isArrayLiteralExpression(member.type)) {
			const values = member.type.elements.map(elm => elm.getText(sourceFile));
			info[name] = values.map(removeQuotations);
		} else if ((name === 'inputs' || name === 'outputs') && member.type && ts.isTupleTypeNode(member.type)) {
			type Item = { name: string, aliasName: string };
			const value: Item[] = [];
			member.type.elements.forEach(item => {
				if (!ts.isTypeLiteralNode(item)) {
					return;
				}
				const itemObject = {} as Item;
				item.members.forEach(property => {
					if (!ts.isPropertySignature(property)) {
						return;
					}
					const key = property.name.getText(sourceFile);
					if ((key === 'name' || key == 'aliasName') && property.type && ts.isLiteralTypeNode(property.type)) {
						const keyValue = property.type.literal.getText(sourceFile);
						itemObject[key] = removeQuotations(keyValue);
					}
				});
				value.push(itemObject);
			});
			info[name] = value;
		}
	});
	if (!info.selector) {
		return;
	}
	registerDirectiveCall(info);
}

/**
 * search for `ɵɵ0Directive.*0ɵɵ` type
 * 
 * example:
 * ```ts
 * export type ɵɵ0IfDirective0ɵɵ = {
 * 	selector: '*if';
 * 	successor: '*else',
 * 	inputs: [
 * 		{ name: 'ifCondition', aliasName: 'if' },
 * 		{ name: 'thenTemplateRef', aliasName: 'then' },
 * 		{ name: 'elseTemplateRef', aliasName: 'else' },
 * 	],
 * 	outputs: [],
 * };
 * ```
 * @param program a ts program 
 * @returns a transformer factory of source file
 */
export function scanDirectivesTypeVisitor(sourceFile: ts.SourceFile): void {
	ts.forEachChild(sourceFile, node => {
		if (ts.isTypeAliasDeclaration(node) && node.name.getText(sourceFile).endsWith('Directive0ɵɵ')) {
			extractDirectives(node, sourceFile);
		}
	});
}
