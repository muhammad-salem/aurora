import ts from 'typescript/lib/tsserverlibrary.js';
import { createStaticPropertyViewType, updateModuleTypeWithComponentView } from './factory.js';
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
			if (!moduleInfo?.classes?.length) {
				return sourceFile;
			}

			const classes = moduleInfo.classes.filter(c => c.type === 'component');

			const sourceViewInfos: ViewInfo[] = classes.flatMap(c => c.views);
			const updateSourceFile = ts.visitNode(sourceFile, (node: ts.SourceFile) => {
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
						createStaticPropertyViewType(viewInfo.viewName),
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
			}) as ts.SourceFile;
			if (sourceViewInfos.length) {
				const statements = updateSourceFile.statements?.slice() ?? [];
				// statements.push(createConstructorOfViewInterfaceDeclaration());
				// const interfaces = sourceViewInfos.map(info => {
				// 	return ts.setTextRange(info.interFaceType, updateSourceFile);
				// });
				// statements.push(...interfaces);
				// statements.push(...updateGlobalHTMLElementTagNameMap(sourceViewInfos.map(v => ({ tagName: v.selector, viewName: v.viewName }))));
				statements.push(...updateModuleTypeWithComponentView(classes));
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
