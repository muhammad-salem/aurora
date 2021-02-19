export const OperatorPrecedence: string[][] = [
	// [
	//     /** Grouping */
	//     '(', ')'
	// ],
	[
		/** Member Access */
		'.',
		/** Computed Member Access */
		'[', ']',
		/** new (with argument list) */
		'new', // '(', ')',
		/** Function Call */
		// '(', ')',
		/** pipeline operator */
		'||>',
		/** Optional chaining */
		'?.'
	],
	[
		/** new (without argument list) */
		'new'
	],
	[
		/** Postfix Increment */
		'++',
		/** Postfix Decrement */
		'--'
	],
	[
		/** Logical NOT (!) */
		'!',
		/** Bitwise NOT (~) */
		'~',
		/** Unary plus (+) */
		'+',
		/** Unary negation (-) */
		'-',
		/** Prefix Increment */
		'++',
		/** Prefix Decrement */
		'--',
		/** typeof */
		'typeof',
		/** void */
		'void',
		/** delete */
		'delete',
		// /** await */
		// 'await'
	],
	[
		/** Exponentiation (**) */
		'**'
	],
	[
		/** Multiplication (*) */
		'*',
		/** Division (/) */
		'/',
		/** Remainder (%) */
		'%'
	],
	[
		/** Addition (+) */
		'+',
		/** Subtraction (-) */
		'-'
	],
	[
		/** Bitwise Left Shift (<<) */
		'<<',
		/** Bitwise Right Shift (>>) */
		'>>',
		/** Bitwise Unsigned Right Shift (>>>) */
		'>>>'
	],
	[
		/** Less Than (<) */
		'<',
		/** Less Than Or Equal (<=) */
		'<=',
		/** Greater Than (>) */
		'>',
		/** Greater Than Or Equal (>=) */
		'>=',
		/** in */
		'in',
		/** instanceof */
		'instanceof'
	],
	[
		/** Equality (==) */
		'==',
		/** Inequality (!=) */
		'!=',
		/** Strict Equality (===) */
		'===',
		/** Strict Inequality (!==) */
		'!=='
	],
	[
		/** Bitwise AND (&) */
		'&'
	],
	[
		/** Bitwise XOR (^) */
		'^'
	],
	[
		/** Bitwise OR (|) */
		'|'
	],
	[
		/** Logical AND (&&) */
		'&&'
	],
	[
		/** Logical OR (||) */
		'||'
	],
	[
		/** Nullish coalescing operator (??) */
		'??'
	],
	/** Conditional (ternary) operator */
	[
		'?',
		':'
	],
	/** Assignment */
	[
		'=',
		'+=',
		'-=',
		'**=',
		'*=',
		'/=',
		'%=',
		'<<=',
		'>>=',
		'>>>=',
		'&=',
		'^=',
		'|=',
		'&&=',
		'||=',
		'??='
	],
	// [
	//     'yield',
	//     'yield*'
	// ],
	// [
	//     /** comma */
	//     ','
	// ]
];

export const StatementPrecedence: string[][] = [
	// [
	//     'async'
	//      'debugger'
	//      'with'
	// ],
	[
		// ';',
		'const',
		'let',
		'var',
		'break',
		'continue',
		'do',
		'while',
		'switch',
		'case',
		'default',
		'for',
		'in',
		'of',
		'if',
		'else',
		'import.meta',
		'import',
		'export',
		'from',
		// '*',
		'as', // renaming operator
		'return',
		'throw',
		'try',
		'catch',
	],
	[
		'function',
		'=>',
		'...',
		'arguments',
		// 'set',
		// 'get',
	],
	[
		'class',
		'constructor',
		'extends',
		// '#',     // private member
		'static',
		'super',
		'this',
	],
	/** Future reserved keywords */
	[
		'enum',
		'implements',
		'interface',
		'package',
		'private',
		'protected',
		'public'
	],
	/** Future reserved keywords in older standards */
	[
		'abstract',
		'boolean',
		'byte',
		'char',
		'double',
		'final',
		'float',
		'goto',
		'int',
		'long',
		'native',
		'short',
		'synchronized',
		'throws',
		'transient',
		'volatile'
	]
];
