import ts from 'typescript/lib/tsserverlibrary.js';
import { createTypeLiteral } from './factory.js';
import { moduleManger, ViewInfo } from './modules.js';


/**
 * search for `@Component({})` and update definition files
 * @param program a ts program 
 * @returns a transformer factory of source file
 */
export function afterDeclarationsCompileComponentOptions(program: ts.Program): ts.TransformerFactory<ts.SourceFile> {
	const typeChecker = program.getTypeChecker();
	return (context: ts.TransformationContext): ts.Transformer<ts.SourceFile> => {
		return sourceFile => {
			const moduleInfo = moduleManger.get(sourceFile.fileName);
			moduleManger.delete(sourceFile.fileName);
			if (!moduleInfo) {
				return sourceFile;
			} else if (moduleInfo.skip || !moduleInfo.classes) {
				return sourceFile;
			}

			const classes = moduleInfo.classes;

			const sourceViewInfos: ViewInfo[] = classes.flatMap(c => c.views);
			const updateSourceFile = ts.visitNode(sourceFile, (node: ts.Node) => {
				return ts.visitEachChild(node, (childNode) => {
					if (!ts.isClassDeclaration(childNode)) {
						return childNode;
					}
					const info = classes.find(c => c.name === childNode.name?.getText());

					if (!info) {
						return childNode;
					}
					const viewInfos: ViewInfo[] = info.views;
					const staticMembers = viewInfos.map(viewInfo => ts.factory.createPropertyDeclaration(
						[
							ts.factory.createModifier(ts.SyntaxKind.StaticKeyword),
							ts.factory.createModifier(ts.SyntaxKind.ReadonlyKeyword)
						],
						viewInfo.viewName,
						undefined,
						createTypeLiteral(viewInfo.viewName),
						undefined,
					)).map(staticMember => ts.setTextRange(staticMember, childNode));
					return ts.factory.updateClassDeclaration(
						childNode,
						childNode.modifiers,
						childNode.name,
						childNode.typeParameters,
						childNode.heritageClauses,
						[...staticMembers, ...childNode.members.slice()],
					);
				}, context);
			});
			if (sourceViewInfos.length) {
				const statements = updateSourceFile.statements?.slice() ?? [];
				const interfaces = sourceViewInfos.map(info => {
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
			return updateSourceFile;
		};
	};
}

export default afterDeclarationsCompileComponentOptions;
