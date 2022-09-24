import ts from 'typescript/lib/tsserverlibrary.js';

export default function before(program: ts.Program): ts.TransformerFactory<ts.SourceFile> {
	const typeChecker = program.getTypeChecker();
	return (context: ts.TransformationContext): ts.Transformer<ts.SourceFile> => {
		const compilerOptions = context.getCompilerOptions();
		return sourceFile => {

			console.log('before sourceFile', sourceFile.fileName);

			return ts.visitNode(sourceFile, (node: ts.Node) => {

				return ts.visitEachChild(node, (childNode) => {

					const type = typeChecker.getTypeAtLocation(childNode);
					console.log('source file', sourceFile.fileName);
					console.log('child text', childNode.getText());
					console.log('type', typeChecker.typeToString(type));
					console.log('isImportDeclaration', ts.isImportDeclaration(childNode));
					console.log('isClassDeclaration', ts.isClassDeclaration(childNode));
					console.log('isDecorator', ts.isDecorator(childNode));
					if (ts.isClassDeclaration(childNode)) {
						console.log('decorators', ts.getDecorators(childNode)?.map(d => d.expression.getText()));
					}

					return childNode;
				}, context);
			});
		};
	};
}
