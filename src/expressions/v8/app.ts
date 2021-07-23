import type { ExpressionNode } from '../api/expression.js';
import { JavaScriptParser } from './parser.js';

export class JavaScriptAppParser extends JavaScriptParser {
	protected parseNewTargetExpression(): ExpressionNode {
		throw new Error(this.errorMessage('Expression (new.target) not supported.'));
	}
	protected parseClassDeclaration(): ExpressionNode {
		throw new Error(this.errorMessage(`Expression (class) not supported.`));
	}
	protected parseClassLiteral(name?: ExpressionNode): ExpressionNode {
		throw new Error(this.errorMessage(`Expression (class) not supported.`));
	}
	protected parseSuperExpression(): ExpressionNode {
		throw new Error(this.errorMessage('Expression (supper) not supported.'));
	}
	protected parseImportExpressions(): ExpressionNode {
		throw new Error(this.errorMessage('Expression (import) not supported.'));
	}
}
