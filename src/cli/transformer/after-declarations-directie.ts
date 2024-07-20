import ts from 'typescript/lib/tsserverlibrary.js';
import { updateModuleTypeWithDirectives } from './factory.js';
import { moduleManger } from './modules.js';


/**
 * search for `@Directive({})` and update definition files
 * @param program a ts program 
 * @returns a transformer factory of source file
 */
export function afterDeclarationsCompileDirectiveOptions(program: ts.Program): ts.TransformerFactory<ts.SourceFile> {
	return (context: ts.TransformationContext): ts.Transformer<ts.SourceFile> => {
		return sourceFile => {
			const moduleInfo = moduleManger.get(sourceFile.fileName);
			moduleManger.delete(sourceFile.fileName);
			if (!moduleInfo) {
				return sourceFile;
			} else if (moduleInfo.skip || !moduleInfo.classes) {
				return sourceFile;
			}

			const classes = moduleInfo.classes.filter(c => c.type === 'directive');
			if (!(classes.length > 0)) {
				return sourceFile;
			}

			const statements = sourceFile.statements?.slice() ?? [];
			statements.push(...updateModuleTypeWithDirectives(classes));
			return ts.factory.updateSourceFile(
				sourceFile,
				statements,
				sourceFile.isDeclarationFile,
				sourceFile.typeReferenceDirectives,
				sourceFile.referencedFiles,
				sourceFile.hasNoDefaultLib,
				sourceFile.libReferenceDirectives,
			);
		};
	};
}
