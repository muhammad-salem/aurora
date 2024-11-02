import ts from 'typescript/lib/tsserverlibrary.js';
import { buildExpressionNodes } from '@ibyar/core/node.js';
import { htmlParser } from '@ibyar/elements/node.js';
import { getExtendsTypeBySelector } from '../elements/tags.js';
import {
	createConstructorOfViewInterfaceDeclaration,
	convertToProperties, createInterfaceType,
	createSignalsAssignment
} from './factory.js';
import { moduleManger, ViewInfo, ClassInfo } from './modules.js';
import {
	getInputs, getOutputs, scanSignals,
	getTextValueFormLiteralProperty,
	isComponentDecorator
} from './helpers.js';
import { SIGNAL_NAMES, SignalDetails, SignalKey } from './signals.js';



/**
 * search for `@Component({})` and precompile the source code
 * @param program a ts program 
 * @returns a transformer factory of source file
 */
export function beforeCompileComponentOptions(program: ts.Program): ts.TransformerFactory<ts.SourceFile> {
	const typeChecker = program.getTypeChecker();
	return (context: ts.TransformationContext): ts.Transformer<ts.SourceFile> => {
		return sourceFile => {
			let visitSourceFile = false;
			let componentPropertyName: string;
			const signals: SignalDetails = {};
			for (const statement of sourceFile.statements) {
				if (ts.isImportDeclaration(statement)) {
					const modulePath = statement.moduleSpecifier.getText();
					if (statement.importClause && modulePath.includes('@ibyar/aurora') || modulePath.includes('@ibyar/core')) {
						statement.importClause?.namedBindings?.forEachChild(importSpecifier => {
							if (ts.isImportSpecifier(importSpecifier)) {
								const importName = importSpecifier.propertyName?.getText() ?? importSpecifier.name.getText();
								if (importName === 'Component') {
									visitSourceFile = true;
									componentPropertyName = importSpecifier.name.getText();
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
			const updateSourceFile = ts.visitNode(sourceFile, (node: ts.SourceFile) => {
				return ts.visitEachChild(node, (childNode) => {
					let decoratorArguments: ts.ObjectLiteralElementLike[] | undefined;
					if (ts.isClassDeclaration(childNode)) {
						const decorators = ts.getDecorators(childNode);
						if (!decorators || decorators.length === 0) {
							return childNode;
						}
						const hasDecorator = decorators.some(decorator => isComponentDecorator(decorator, componentPropertyName));
						if (!hasDecorator) {
							return childNode;
						}
						const viewInfos: ViewInfo[] = [];
						const signalMetadata = scanSignals(childNode, signals);
						const modifiers = childNode.modifiers?.map(modifier => {
							if (!ts.isDecorator(modifier)) {
								return modifier;
							}
							const updateDecoratorOptions = (option: ts.ObjectLiteralExpression) => {
								const selector = getTextValueFormLiteralProperty(option, 'selector');
								if (!selector) {
									console.error(`Component missing selector name: ${childNode.name?.getText()}`);
									return option;
								}
								const viewName = `HTML${selector.split('-')
									.map(name => name.replace(/^\w/, char => char.toUpperCase()))
									.join('')}Element`;


								const extendProperty = option.properties.find(prop => prop.name?.getText() === 'extend') as ts.PropertyAssignment | undefined;
								const extend = extendProperty?.initializer.getText().substring(1, extendProperty?.initializer.getText().length - 1);
								const extendsType = getExtendsTypeBySelector(extend);

								const formAssociatedProperty = option.properties.find(prop => prop.name?.getText() === 'formAssociated') as ts.PropertyAssignment | undefined;
								const formAssociated = formAssociatedProperty?.initializer.getText().substring(1, formAssociatedProperty?.initializer.getText().length - 1);

								const disabledFeaturesInitializer = (option.properties.find(prop => prop.name?.getText() === 'disabledFeatures') as ts.PropertyAssignment | undefined)?.initializer as ts.ArrayLiteralExpression | undefined;
								let disabledFeatures: string[] | undefined = undefined;
								if (disabledFeaturesInitializer && ts.isArrayLiteralExpression(disabledFeaturesInitializer)) {
									disabledFeatures = disabledFeaturesInitializer.elements.filter(ts.isStringLiteral).map(el => el.getText(sourceFile));
								}

								viewInfos.push({
									selector,
									viewName,
									extendsType,
									interfaceType: createInterfaceType(viewName, extendsType),
									formAssociated: 'true' == formAssociated,
									disabledFeatures: disabledFeatures,
								});

								const stylesProperty = option.properties.find(prop => prop.name?.getText() === 'styles') as ts.PropertyAssignment | undefined;
								const styles = stylesProperty?.initializer.getText().substring(1, stylesProperty?.initializer.getText().length - 1);

								const template = option.properties.find(prop => prop.name?.getText() === 'template');
								if (template && ts.isPropertyAssignment(template) && ts.isStringLiteralLike(template.initializer)) {
									const text = template?.initializer.getText().substring(1, template?.initializer.getText().length - 1);
									const html = styles
										? `<style>${styles}</style>${text}`
										: text;
									const domNode = htmlParser.toDomRootNode(html);
									buildExpressionNodes(domNode);
									const serialized = JSON.stringify(domNode);
									const json = JSON.parse(serialized);
									const name = ts.factory.createIdentifier('compiledTemplate');
									const initializer = ts.factory.createObjectLiteralExpression(convertToProperties(json));
									const update = ts.factory.updatePropertyAssignment(template, name, initializer);
									const signalsOption = createSignalsAssignment(signalMetadata);
									decoratorArguments = option.properties.map(prop => {
										if (template === prop) {
											return update;
										}
										return prop;
									}).filter(prop => {
										if (prop.name?.getText(sourceFile) === 'styles') {
											return false;
										}
										return true;
									}).concat([signalsOption]);
									return ts.factory.updateObjectLiteralExpression(option, decoratorArguments);
								}
								return option;

								// options.properties.filter((prop: ts.PropertyAssignment) => {
								// 	switch (prop.name.getText()) {
								// 		case 'template':
								// 		case 'templateUrl':
								// 		case 'styles':
								// 			return true;
								// 		default: return false;
								// 	}
								// })
							};
							const decoratorCall = modifier.expression as ts.CallExpression;
							const options = decoratorCall.arguments[0];
							let argumentsOption: ts.Expression | undefined;
							if (ts.isArrayLiteralExpression(options)) {
								const elements: ts.Expression[] = options.elements.map(element => {
									if (ts.isObjectLiteralExpression(element)) {
										return updateDecoratorOptions(element);
									}
									return element;
								});
								argumentsOption = ts.factory.updateArrayLiteralExpression(options, elements);
							} else if (ts.isObjectLiteralExpression(options)) {
								argumentsOption = updateDecoratorOptions(options);
							}
							if (argumentsOption) {
								return ts.factory.updateDecorator(
									modifier,
									ts.factory.updateCallExpression(
										decoratorCall,
										decoratorCall.expression,
										decoratorCall.typeArguments,
										[argumentsOption]
									)
								);
							}
							return modifier;
						});

						classes.push({
							type: 'component',
							name: childNode.name?.getText() ?? '',
							views: viewInfos,
							inputs: getInputs(childNode, typeChecker),
							outputs: getOutputs(childNode, typeChecker),
							signals: signalMetadata,
						});
						// const staticMembers = viewInfos.map(
						// 	viewInfo => ts.factory.createPropertyDeclaration(
						// 		[
						// 			ts.factory.createModifier(ts.SyntaxKind.StaticKeyword),
						// 			ts.factory.createModifier(ts.SyntaxKind.ReadonlyKeyword)
						// 		],
						// 		viewInfo.viewName,
						// 		undefined,
						// 		createStaticPropertyViewType(viewInfo.viewName),
						// 		undefined,
						// 	)
						// );
						return ts.factory.updateClassDeclaration(
							childNode,
							modifiers ? ts.factory.createNodeArray(modifiers) : void 0,
							childNode.name,
							childNode.typeParameters,
							childNode.heritageClauses,
							[/*...staticMembers,*/ ...childNode.members.slice()],
						);
					}
					return childNode;
				}, context);
			}) as ts.SourceFile;
			if (classes.length) {
				moduleManger.add({ path: sourceFile.fileName, classes });
				const statements = updateSourceFile.statements?.slice() ?? [];
				statements.push(createConstructorOfViewInterfaceDeclaration());
				const interfaces = classes.flatMap(s => s.views).map(info => {
					return ts.setTextRange(info.interfaceType, updateSourceFile);
				});
				statements.push(); //emit inputs and outputs for component and directives;
				statements.push(...interfaces);
				return ts.factory.updateSourceFile(
					sourceFile,
					statements,
					updateSourceFile.isDeclarationFile,
					updateSourceFile.typeReferenceDirectives,
					updateSourceFile.referencedFiles,
					updateSourceFile.hasNoDefaultLib,
					updateSourceFile.libReferenceDirectives,
				);
			}
			return updateSourceFile;
		};
	};
}
