import ts from 'typescript/lib/tsserverlibrary.js';
import { buildExpressionNodes } from '@ibyar/core/node';
import { htmlParser, directiveRegistry } from '@ibyar/elements/node';
import { getExtendsTypeBySelector } from '../elements/tags.js';
import {
	convertToProperties, createConstructorOfViewInterfaceDeclaration,
	createInterfaceType, createStaticPropertyViewType
} from './factory.js';
import { moduleManger, ViewInfo, ClassInfo, InputOutputTypeInfo } from './modules.js';


/**
 * register `class` and `style` attribute directive
 */
directiveRegistry.register('class', { inputs: ['class'] });
directiveRegistry.register('style', { inputs: ['style'] });

/**
 * for of/await/in directives
 */
directiveRegistry.register('*for', { inputs: ['of', 'trackBy'], successor: '*empty' });
directiveRegistry.register('*forOf', { inputs: ['of', 'trackBy'], successor: '*empty' });
directiveRegistry.register('*forAwait', { inputs: ['of'], successor: '*empty' });
directiveRegistry.register('*forIn', { inputs: ['in'], successor: '*empty' });

/**
 * if then else directive
 */
directiveRegistry.register('*if', { inputs: ['if', 'then', 'else'], successor: '*else' });

/**
 * switch case default directives
 */
directiveRegistry.register('*switch', { inputs: ['switch'] });
directiveRegistry.register('*case', { inputs: ['case'] });
directiveRegistry.register('*default', { inputs: ['default'] });


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
				moduleManger.add({ path: sourceFile.fileName, skip: true });
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

								const formAssociatedProperty = option.properties.find(prop => prop.name?.getText() === 'formAssociated') as ts.PropertyAssignment | undefined;
								const formAssociated = formAssociatedProperty?.initializer.getText().substring(1, formAssociatedProperty?.initializer.getText().length - 1);

								viewInfos.push({
									selector,
									viewName,
									extendsType,
									interFaceType: createInterfaceType(viewName, extendsType),
									formAssociated: 'true' == formAssociated,
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

						classes.push({
							name: childNode.name?.getText() ?? '',
							views: viewInfos,
							inputs: getInputs(childNode, typeChecker),
							outputs: getOutputs(childNode, typeChecker),
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
					return ts.setTextRange(info.interFaceType, updateSourceFile);
				});
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
			moduleManger.add({ path: sourceFile.fileName, skip: true });
			return updateSourceFile;
		};
	};
}

export function isInputDecorator(decorator: ts.Decorator): boolean {
	return ts.isCallExpression(decorator.expression) && (
		decorator.expression.expression.getText() === 'Input'
		|| decorator.expression.expression.getText() === 'FormValue'
	);
}

export function isOutputDecorator(decorator: ts.Decorator): boolean {
	return ts.isCallExpression(decorator.expression) && decorator.expression.expression.getText() === 'Output';
}

export function getMapByDecorator(classNode: ts.ClassDeclaration, checker: ts.TypeChecker, decoratorFilter: ((decorator: ts.Decorator) => boolean)): InputOutputTypeInfo {

	const map: InputOutputTypeInfo = {};
	classNode.members.forEach(member => {
		if (!ts.isPropertyDeclaration(member)) {
			return;
		}
		const decorators = ts.getDecorators(member);
		if (!decorators) {
			return;
		}
		const inputDecorators = decorators.filter(decoratorFilter);
		if (!inputDecorators.length) {
			return;
		}
		let inputType = member.type?.getText();
		if (!inputType && member.initializer) {
			inputType = checker.typeToString(checker.getTypeAtLocation(member.initializer), member.initializer, undefined);
		}
		inputDecorators.forEach(input => {
			const decoratorCall = input.expression as ts.CallExpression;
			const aliasName = decoratorCall.arguments[0] as ts.StringLiteralLike;
			const inputName = aliasName ? aliasName.text : member.name.getText();
			map[inputName] = inputType;
		});
	})
	return map;
}

export function getInputs(classNode: ts.ClassDeclaration, checker: ts.TypeChecker): InputOutputTypeInfo {

	return getMapByDecorator(classNode, checker, isInputDecorator);
}

export function getOutputs(classNode: ts.ClassDeclaration, checker: ts.TypeChecker): InputOutputTypeInfo {
	return getMapByDecorator(classNode, checker, isOutputDecorator);
}

export default beforeCompileComponentOptions;
