import ts from 'typescript/lib/tsserverlibrary.js';
import { moduleManger } from './modules.js';
import {
	getInputs, getOutputs,
	getTextValueForProperty,
	isDirectiveDecorator
} from './helpers.js';
import { registerDirectiveCall } from '../directives/register.js';


/**
 * search for `@Directive({})` and to register with the html parser
 * @param program a ts program 
 * @returns a transformer factory of source file
 */
export function beforeCompileDirectiveOptions(program: ts.Program): ts.TransformerFactory<ts.SourceFile> {
	const typeChecker = program.getTypeChecker();
	return (context: ts.TransformationContext): ts.Transformer<ts.SourceFile> => {
		return sourceFile => {
			let visitSourceFile = false;
			let directivePropertyName: string;
			for (const statement of sourceFile.statements) {
				if (ts.isImportDeclaration(statement)) {
					const modulePath = statement.moduleSpecifier.getText();
					if (statement.importClause && modulePath.includes('@ibyar/aurora') || modulePath.includes('@ibyar/core')) {
						statement.importClause?.namedBindings?.forEachChild(importSpecifier => {
							if (visitSourceFile) {
								return;
							}
							if (ts.isImportSpecifier(importSpecifier)) {
								if (importSpecifier.propertyName?.getText() === 'Directive') {
									visitSourceFile = true;
									directivePropertyName = importSpecifier.name.getText();
								} else if (importSpecifier.name.getText() === 'Directive') {
									visitSourceFile = true;
									directivePropertyName = importSpecifier.name.getText();
								}
							}
						});
					}
				}
				if (visitSourceFile) {
					break;
				}
			}
			if (!visitSourceFile) {
				moduleManger.add({ path: sourceFile.fileName, skip: true });
				return sourceFile;
			}
			ts.visitNode(sourceFile, (node: ts.SourceFile) => {
				return ts.visitEachChild(node, (childNode) => {
					if (ts.isClassDeclaration(childNode)) {
						const decorators = ts.getDecorators(childNode);
						if (!decorators || decorators.length === 0) {
							return childNode;
						}
						const hasDecorator = decorators.some(decorator => isDirectiveDecorator(decorator, directivePropertyName));
						if (!hasDecorator) {
							return childNode;
						}
						childNode.modifiers?.forEach(modifier => {
							if (ts.isDecorator(modifier) && isDirectiveDecorator(modifier)) {
								const options = (modifier.expression as ts.CallExpression).arguments[0];
								if (ts.isObjectLiteralExpression(options)) {
									const selector = getTextValueForProperty(options, 'selector');
									if (selector) {
										const successor = getTextValueForProperty(options, 'successor');
										const inputs = getInputs(childNode, typeChecker);
										const outputs = getOutputs(childNode, typeChecker);
										registerDirectiveCall({
											selector,
											successor,
											inputs,
											outputs
										});
									}
								}
							}
						});
					}
					return childNode;
				}, context);
			});
			return sourceFile;
		};
	};
}
