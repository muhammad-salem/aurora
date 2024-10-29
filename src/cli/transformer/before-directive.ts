import ts from 'typescript/lib/tsserverlibrary.js';
import { ClassInfo, moduleManger } from './modules.js';
import {
	getInputs, getOutputs, scanSignals,
	getTextValueFormArrayLiteralProperty,
	getTextValueFormLiteralProperty,
	isDirectiveDecorator
} from './helpers.js';
import { registerDirectiveCall } from '../directives/register.js';
import { SIGNAL_NAMES, SignalDetails, SignalKey } from './signals.js';


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
			const signals: SignalDetails = {};
			for (const statement of sourceFile.statements) {
				if (ts.isImportDeclaration(statement)) {
					const modulePath = statement.moduleSpecifier.getText();
					if (statement.importClause && modulePath.includes('@ibyar/aurora') || modulePath.includes('@ibyar/core')) {
						statement.importClause?.namedBindings?.forEachChild(importSpecifier => {
							if (ts.isImportSpecifier(importSpecifier)) {
								const importName = importSpecifier.propertyName?.getText() ?? importSpecifier.name.getText();
								if (importName === 'Directive') {
									visitSourceFile = true;
									directivePropertyName = importSpecifier.name.getText();
								} else if (SIGNAL_NAMES.includes(importName)) {
									signals[importName as SignalKey] = importSpecifier.name.getText();
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
				return sourceFile;
			}
			const classes: ClassInfo[] = [];
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
							if (ts.isDecorator(modifier) && isDirectiveDecorator(modifier, directivePropertyName)) {
								const options = (modifier.expression as ts.CallExpression).arguments[0];
								if (ts.isObjectLiteralExpression(options)) {
									const selector = getTextValueFormLiteralProperty(options, 'selector');
									if (selector) {
										const successors = getTextValueFormArrayLiteralProperty(options, 'successors');
										const inputs = getInputs(childNode, typeChecker);
										const outputs = getOutputs(childNode, typeChecker);
										const signalDetails = scanSignals(childNode, signals);
										const allInputs = (inputs ?? [])
											.concat(signalDetails.input ?? [])
											.concat(signalDetails.formValue ?? [])
											.concat(signalDetails.model ?? []);
										const allOutputs = (outputs ?? []).
											concat(signalDetails.output ?? [])
											.concat(signalDetails.model ?? []);
										registerDirectiveCall({
											selector,
											successors,
											inputs: allInputs,
											outputs: allOutputs,
										});
										classes.push({
											type: 'directive',
											name: selector,
											successors,
											inputs,
											outputs,
											views: [],
											signals: signalDetails
										});
									}
								}
							}
						});
					}
					return childNode;
				}, context);
			});
			if (classes.length) {
				moduleManger.add({ path: sourceFile.fileName, classes });
			}
			return sourceFile;
		};
	};
}
