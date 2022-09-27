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
					if (ts.isClassDeclaration(childNode)) {
						const decorators = ts.getDecorators(childNode);
						if (!decorators) {
							return childNode;
						}
						for (const decorator of decorators) {
							const decoratorCall = decorator.expression;
							if (ts.isCallExpression(decoratorCall) && decoratorCall.expression.getText() === componentPropertyName) {
								const options = decoratorCall.arguments[0];
								if (ts.isArrayLiteralExpression(options)) {

								} else if (ts.isObjectLiteralExpression(options)) {

									const styles = options.properties.find(prop => prop.name?.getText() === 'styles')?.getText();
									const template = options.properties.find(prop => prop.name?.getText() === 'template');
									if (template && ts.isPropertyAssignment(template)) {
										const html = styles
											? `<style>${styles}</style>${template.initializer.getText()}`
											: template.initializer.getText();
										console.log('html', template.name.getText(), html);
										const domeNode = htmlParser.toDomRootNode(html);
										buildExpressionNodes(domeNode);
										console.log('node', domeNode);
									}

									// options.properties.filter((prop: ts.PropertyAssignment) => {
									// 	switch (prop.name.getText()) {
									// 		case 'template':
									// 		case 'templateUrl':
									// 		case 'styles':
									// 			return true;
									// 		default: return false;
									// 	}
									// })
								}
							}
						}
					}
					return childNode;
				}, context);
			});
		};
	};
}

function updateComponentDefinition() {

}