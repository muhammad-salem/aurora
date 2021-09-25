import type { NodeDeserializer, ExpressionNode } from '../expression.js';
import type { Stack } from '../../scope/stack.js';
import { AbstractExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';
import { Identifier } from '../definition/values.js';
import { CallExpression } from '../computing/call.js';
import { ArrowFunctionExpression, FunctionExpression } from '../definition/function.js';
import { NewExpression } from '../computing/new.js';
import { MemberExpression } from '../definition/member.js';
import { SpreadElement } from '../index.js';

export type PipelineOperator = '|>' | ':|>' | '?|>' | '?:|>' | '|>>' | '<|' | '<|:' | '?<|' | '?<|:' | '<<|';
export type PipelineBodyType = Identifier | CallExpression | NewExpression | FunctionExpression | ArrowFunctionExpression;

export type PipeHandler<T, R> = (argument: T, body: Function, params?: any[], thisArg?: any) => R;

@Deserializer('PipeClause')
export class PipeClause extends AbstractExpressionNode {
	static fromJSON(node: PipeClause, deserializer: NodeDeserializer): PipeClause {
		return new PipeClause(
			node.operator,
			deserializer(node.body) as PipelineBodyType
		);
	}
	private static PipeHandler: { [key in PipelineOperator]: PipeHandler<any, any> } = {

		/**
		 * x |> g  === g(x)
		 * @param argument 
		 * @param body 
		 * @param params 
		 * @param thisArg 
		 * @returns 
		 */
		'|>': (argument: any, body: Function, params: any[] = [], thisArg?: any) => {
			params.unshift(argument);
			return body.apply(thisArg, params);
		},

		/**
		 * x :|> g  === g.call(x)
		 * @param argument 
		 * @param body 
		 * @param params 
		 * @param thisArg 
		 * @returns 
		 */
		':|>': (argument: any, body: Function, params: any[] = [], thisArg?: any) => {
			return body.apply(argument, params);
		},

		/***
		 * x ?|> g  === x && g(x)
		 */
		'?|>': (argument: any, body: Function, params: any[] = [], thisArg?: any) => {
			if (argument == undefined || argument == null) {
				return argument;
			}
			return PipeClause.PipeHandler['|>'](argument, body, params, thisArg);
		},

		/**
		 * x ?:|> g  === x && g.call(x)
		 * @param argument 
		 * @param body 
		 * @param params 
		 * @param thisArg 
		 * @returns 
		 */
		'?:|>': (argument: any, body: Function, params: any[] = [], thisArg?: any) => {
			if (argument == undefined || argument == null) {
				return argument;
			}
			return PipeClause.PipeHandler[':|>'](argument, body, params, thisArg);
		},

		/**
		 * x |> g |>> f === g(f(x))
		 * @param argument 
		 * @param body 
		 * @returns 
		 */
		'|>>': (argument: any, body: Function) => {
			return (x: any) => argument(body(x));
		},

		/**
		 * x <| g  === x(g)
		 * @param body 
		 * @param argument 
		 * @param params 
		 * @param thisArg 
		 * @returns 
		 */
		'<|': (body: Function, argument: any, params: any[] = [], thisArg?: any) => {
			return PipeClause.PipeHandler['|>'](argument, body, params, thisArg);
		},

		/**
		 * x <|: g  === x.call(g)
		 * @param body 
		 * @param argument 
		 * @param params 
		 * @param thisArg 
		 * @returns 
		 */
		'<|:': (body: Function, argument: any, params: any[] = [], thisArg?: any) => {
			return PipeClause.PipeHandler[':|>'](argument, body, params, thisArg);
		},

		/**
		 * x ?<| g  === x && x(g)
		 * @param body 
		 * @param argument 
		 * @param params 
		 * @param thisArg 
		 * @returns 
		 */
		'?<|': (body: Function, argument: any, params: any[] = [], thisArg?: any) => {
			return PipeClause.PipeHandler['?|>'](argument, body, params, thisArg);
		},

		/**
		 * x ?<|: g  === x&& x.call(g)
		 * @param body 
		 * @param argument 
		 * @param params 
		 * @param thisArg 
		 * @returns 
		 */
		'?<|:': (body: Function, argument: any, params: any[] = [], thisArg?: any) => {
			return PipeClause.PipeHandler['?:|>'](argument, body, params, thisArg);
		},

		/**
		 * x |> g <<| f === f(g(x))
		 * @param body 
		 * @param argument 
		 * @returns 
		 */
		'<<|': (body: Function, argument: any,) => {
			return (x: any) => argument(body(x));
		},
	};
	constructor(
		public operator: PipelineOperator,
		public body: PipelineBodyType) {
		super();
	}
	set(stack: Stack, value: any) {
		throw new Error(`PipeClause#set() has no implementation.`);
	}
	get(stack: Stack, thisContext?: any) {
		throw new Error(`PipeClause#get() has no implementation.`);
	}
	eval<T, R>(argument: T, stack: Stack): R {
		if (this.operator.startsWith('?') && !(argument == undefined || argument == null)) {
			// stop eval the rhs
			return argument as any;
		}
		if (this.body instanceof CallExpression) {
			return this.evalCallExpression(argument, stack);
		} else if (this.body instanceof NewExpression) {
			return this.evalNewExpression(argument, stack);
		}
		const funcRef = this.body.get(stack);
		return PipeClause.PipeHandler[this.operator](argument, funcRef);
	}
	private evalNewExpression<T, R>(argument: T, stack: Stack): R {
		const classExpression = (this.body as NewExpression).getClassName();
		const classRef = classExpression.get(stack);
		// new g <| x // is not valid as '(new g)' is valid expression and will be evaluated
		// x |> new g is valid, will be 'new g(x)'
		// x ?|> new g is valid, will be 'x && new g(x)'
		return new classRef(argument);
	}
	private evalCallExpression<T, R>(argument: T, stack: Stack): R {
		const funcExpression = (this.body as CallExpression).getCallee();
		const parameters = (this.body as CallExpression).getArguments();
		const params: any[] = [];
		for (const arg of parameters) {
			if (arg instanceof SpreadElement) {
				const paramScope = stack.pushBlockScopeFor(params);
				arg.get(stack);
				stack.clearTo(paramScope);
			} else {
				params.push(arg.get(stack));
			}
		}
		const funcRef = funcExpression.get(stack);
		let thisContext: any;
		if (funcExpression instanceof MemberExpression) {
			thisContext = funcExpression.getObject().get(stack);
		}
		return PipeClause.PipeHandler[this.operator](argument, funcRef, params, thisContext);
	}
	events(parent?: string): string[] {
		return this.body.events();
	}
	toString(): string {
		return `${this.operator} ${this.body.toString()}`;
	}
	toJson(key?: string): { [key: string]: any; } {
		return {
			operator: this.operator,
			body: this.body.toJSON(),
		};
	}
}

/**
 * pipeline ('|>') operator support syntax:
 *  param |> func
 *  param |> func:arg2:arg3
 *  param |> func(arg2, arg3)
 */
@Deserializer('PipelineExpression')
export class PipelineExpression extends AbstractExpressionNode {
	static fromJSON(node: PipelineExpression, deserializer: NodeDeserializer): PipelineExpression {
		return new PipelineExpression(
			deserializer(node.argument),
			node.pipes.map(deserializer) as PipeClause[],
		);
	}
	constructor(private argument: ExpressionNode, private pipes: PipeClause[]) {
		super();
	}
	getArgument() {
		return this.argument;
	}
	getPipes() {
		return this.pipes;
	}
	set(stack: Stack, value: any) {
		throw new Error(`PipelineExpression#set() has no implementation.`);
	}
	get(stack: Stack) {
		let result = this.argument.get(stack);
		for (const pipe of this.pipes) {
			result = pipe.eval(result, stack);
		}
		return result;
	}
	events(parent?: string): string[] {
		return [
			...this.argument.events(),
			...this.pipes.flatMap(pipe => pipe.events()),
		];
	}
	toString() {
		return `${this.argument.toString()} ${this.pipes.map(pipe => pipe.toString()).join(' ')}`;
	}
	toJson(): object {
		return {
			argument: this.argument.toJSON(),
			right: this.pipes.map(pipe => pipe.toJSON()),
		};
	}
}
