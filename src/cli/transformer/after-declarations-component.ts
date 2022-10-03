import ts from 'typescript/lib/tsserverlibrary.js';
import { buildExpressionNodes } from '@ibyar/core/node';
import { htmlParser } from '@ibyar/elements/node';
import { getExtendsTypeBySelector } from '../elements/tags.js';
import { convertToProperties, createInterfaceType, createTypeLiteral } from './factory.js';

type ViewInfo = { selector: string, extendsType: string, viewName: string, interFaceType: ts.InterfaceDeclaration };

/**
 * search for `@Component({})` and update definition files
 * @param program a ts program 
 * @returns a transformer factory of source file
 */
export function afterDeclarationsCompileComponentOptions(program: ts.Program): ts.TransformerFactory<ts.SourceFile> {
	const typeChecker = program.getTypeChecker();
	return (context: ts.TransformationContext): ts.Transformer<ts.SourceFile> => {
		return sourceFile => {
			let visitSourceFile = false;
			let componentPropertyName: string;
			for (const statement of sourceFile.statements) {
				if (ts.isImportDeclaration(statement)) {
					const modulePath = statement.moduleSpecifier.getText();
					if (statement.importClause && modulePath.includes('@ibyar/aurora') || modulePath.includes('@ibyar/core')) {
						statement.importClause?.namedBindings?.forEachChild(importSpecifier => {
							if (visitSourceFile) {
								return;
							}
							if (ts.isImportSpecifier(importSpecifier)) {
								if (importSpecifier.propertyName?.getText() === 'Component') {
									visitSourceFile = true;
									componentPropertyName = importSpecifier.name.getText();
								} else if (importSpecifier.name.getText() === 'Component') {
									visitSourceFile = true;
									componentPropertyName = importSpecifier.name.getText();
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

			const sourceViewInfos: ViewInfo[] = [];
			const updateSourceFile = ts.visitNode(sourceFile, (node: ts.Node) => {
				return ts.visitEachChild(node, (childNode) => {
					let decoratorArguments: ts.ObjectLiteralElementLike[] | undefined;
					if (ts.isClassDeclaration(childNode)) {
						const decorators = ts.getDecorators(childNode);
						if (!decorators || decorators.length === 0) {
							return childNode;
						}
						const isComponentDecorator = (decorator: ts.Decorator): boolean => {
							return ts.isCallExpression(decorator.expression)
								&& decorator.expression.expression.getText() === componentPropertyName;
						};
						const hasComponentDecorator = decorators.some(isComponentDecorator);
						if (!hasComponentDecorator) {
							return childNode;
						}

						const viewInfos: ViewInfo[] = [];
						const modifiers = childNode.modifiers?.map(modifier => {
							if (!ts.isDecorator(modifier)) {
								return modifier;
							}
							if (!isComponentDecorator(modifier)) {
								return modifier;
							}

							const updateDecoratorOptions = (option: ts.ObjectLiteralExpression) => {
								const selectorProperty = option.properties
									.find(prop => prop.name?.getText() === 'selector') as ts.PropertyAssignment | undefined;

								if (!selectorProperty) {
									console.error(`Component missing selector name: ${childNode.name?.getText()}`);
									return option;
								}
								const initializer = selectorProperty.initializer.getText();
								const selector = initializer.substring(1, initializer.length - 1);
								const viewName = `HTML${selector.split('-')
									.map(name => name.replace(/^\w/, char => char.toUpperCase()))
									.join('')}Element`;


								const extendProperty = option.properties.find(prop => prop.name?.getText() === 'extend') as ts.PropertyAssignment | undefined;
								const extend = extendProperty?.initializer.getText().substring(1, extendProperty?.initializer.getText().length - 1);
								const extendsType = getExtendsTypeBySelector(extend);

								viewInfos.push({
									selector,
									viewName,
									extendsType,
									interFaceType: createInterfaceType(viewName, extendsType)
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
									});
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

						sourceViewInfos.push(...viewInfos);
						const staticMembers = viewInfos.map(viewInfo => ts.factory.createPropertyDeclaration(
							[
								ts.factory.createModifier(ts.SyntaxKind.StaticKeyword),
								ts.factory.createModifier(ts.SyntaxKind.ReadonlyKeyword)
							],
							viewInfo.viewName,
							ts.factory.createToken(ts.SyntaxKind.ExclamationToken),
							createTypeLiteral(viewInfo.viewName),
							undefined,
						)).map(staticMember => ts.setTextRange(staticMember, childNode));
						return ts.factory.updateClassDeclaration(
							childNode,
							modifiers ? ts.factory.createNodeArray(modifiers) : void 0,
							childNode.name,
							childNode.typeParameters,
							childNode.heritageClauses,
							childNode.members.slice().concat(...staticMembers)
						);
					}
					return childNode;
				}, context);
			});
			if (sourceViewInfos.length) {
				const statements = updateSourceFile.statements?.slice() ?? [];
				const interfaces = sourceViewInfos.map(info => {
					return ts.setTextRange(info.interFaceType, updateSourceFile);
				});
				statements.push(...interfaces);
				updateSourceFile.isDeclarationFile && console.log(statements);
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
