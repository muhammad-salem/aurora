import ts from 'typescript/lib/tsserverlibrary.js';
import { directiveRegistry } from '@ibyar/elements/node';
import { moduleManger } from './modules.js';
import {
	getInputs, getOutputNames,
	getTextValueForProperty,
	isDirectiveDecorator
} from './helpers.js';
import { metadataHoler } from '@ibyar/decorators';
import { registerDirective } from '@ibyar/core/node.js';


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
										const outputs = getOutputNames(childNode, typeChecker);
										directiveRegistry.update(selector, { inputs: inputs.map(input => input.aliasName), outputs, successor });
										const modelClass = {};
										const metadata = metadataHoler.getOrCreate(modelClass);
										metadata.modelClass = modelClass;
										metadata.selector = selector;
										metadata.inputs = inputs.map(input => ({ modelProperty: input.name, viewAttribute: input.aliasName }));
										registerDirective(modelClass);
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
