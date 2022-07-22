import {
	ExpressionNode,
	isStrict,
	JavaScriptParser, LanguageMode,
	ModuleScopeResolver, Scope, Context, Stack
} from '@ibyar/expressions';


export const ModuleResolver = new ModuleScopeResolver({ allowImportExternal: false });

export const BrowserGlobalScope: Scope<Context> = Scope.for(globalThis as Context);


export type CompileReturn = { ast: ExpressionNode, stack: Stack };

export function compile(source: string, mode: LanguageMode.Sloppy): CompileReturn;
export function compile(source: string, mode: LanguageMode.Strict, path: string): CompileReturn;
export function compile(source: string, mode: LanguageMode, path?: string): CompileReturn {
	const ast = JavaScriptParser.parse(source, { mode });
	let stack: Stack;
	if (isStrict(mode)) {
		stack = new Stack(BrowserGlobalScope, ModuleResolver, path!);
	} else {
		stack = new Stack(BrowserGlobalScope);
	}
	return { ast, stack };
};
