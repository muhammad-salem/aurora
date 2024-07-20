import ts from 'typescript/lib/tsserverlibrary.js';
import { DirectiveInfo, registerDirectiveCall } from '../directives/register.js';


function extractDirectives(alias: ts.TypeAliasDeclaration, sourceFile: ts.SourceFile) {
	console.log(alias.getText(sourceFile));
	const type = alias.type;
	if (!ts.isTupleTypeNode(type)) {
		return;
	}
	type.elements.forEach(elm => {
		if (!ts.isTypeLiteralNode(elm)) {
			return;
		}
		const info = {} as DirectiveInfo;
		elm.members.forEach(member => {
			if (!ts.isPropertySignature(member)) {
				return;
			}
			const name = member.name.getText(sourceFile);
			if ((name === 'selector' || name === 'successor') && member.type && ts.isLiteralTypeNode(member.type)) {
				const value = member.type.literal.getText(sourceFile);
				info[name] = value;
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
							itemObject[key] = keyValue;
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
	});

}

/**
 * search for `ɵɵ0Directives0ɵɵ` type
 * 
 * example:
 * ```ts
 * export type ɵɵ0Directives0ɵɵ = [{
 * 	selector: '*if';
 * 	successor: '*else',
 * 	inputs: [
 * 		{ name: 'ifCondition', aliasName: 'if' },
 * 		{ name: 'thenTemplateRef', aliasName: 'then' },
 * 		{ name: 'elseTemplateRef', aliasName: 'else' },
 * 	],
 * 	outputs: [],
 * }];
 * ```
 * @param program a ts program 
 * @returns a transformer factory of source file
 */
export function scanDirectivesTypeVisitor(sourceFile: ts.SourceFile): void {
	ts.forEachChild(sourceFile, node => {
		if (ts.isTypeAliasDeclaration(node) && node.name.getText(sourceFile) === 'ɵɵ0Directives0ɵɵ') {
			extractDirectives(node, sourceFile);
		}
	});
}
