import ts from 'typescript/lib/tsserverlibrary.js';
import { buildExpressionNodes } from '@ibyar/core/node';
import { htmlParser } from '@ibyar/elements/node';

/**
 * search for `@Component({})` and precompile the source code
 * @param program a ts program 
 * @returns a transformer factory of source file
 */
export default function preCompileComponentOptions(program: ts.Program): ts.TransformerFactory<ts.SourceFile> {
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
			return ts.visitNode(sourceFile, (node: ts.Node) => {
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

						const modifiers = childNode.modifiers?.map(modifier => {
							if (!ts.isDecorator(modifier)) {
								return modifier;
							}
							if (!isComponentDecorator(modifier)) {
								return modifier;
							}

							const updateDecoratorOptions = (option: ts.ObjectLiteralExpression) => {
								const styles = option.properties.find(prop => prop.name?.getText() === 'styles')?.getText();
								const template = option.properties.find(prop => prop.name?.getText() === 'template');
								if (template && ts.isPropertyAssignment(template)) {
									const html = styles
										? `<style>${styles}</style>${template.initializer.getText()}`
										: template.initializer.getText();
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
						return ts.factory.updateClassDeclaration(
							childNode,
							modifiers ? ts.factory.createNodeArray(modifiers) : void 0,
							childNode.name,
							childNode.typeParameters,
							childNode.heritageClauses,
							childNode.members
						);
					}
					return childNode;
				}, context);
			});
		};
	};
}


export function convertToProperties(json: { [key: string]: any }): ts.ObjectLiteralElementLike[] {
	const keys = Object.keys(json);
	return keys.map(key => createProperty(key, json[key]));
}

export function createProperty(name: string, value: any): ts.ObjectLiteralElementLike {
	return ts.factory.createPropertyAssignment(name, createInitializer(value));
}

export function createInitializer(value: any): ts.Expression {
	if (Array.isArray(value)) {
		const elements = value.map(createInitializer);
		return ts.factory.createArrayLiteralExpression(elements);
	}
	switch (typeof value) {
		case 'string': return ts.factory.createStringLiteral(value);
		case 'number': return ts.factory.createNumericLiteral(value);
		case 'bigint': return ts.factory.createBigIntLiteral(value.toString());
		case 'boolean': return value ? ts.factory.createTrue() : ts.factory.createFalse();
		case 'object': {
			if (!value) {
				return ts.factory.createNull();
			}
			const properties = convertToProperties(value);
			return ts.factory.createObjectLiteralExpression(properties);
		};
	}
	return ts.factory.createNull();
}
