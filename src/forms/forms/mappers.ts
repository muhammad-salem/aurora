
export interface Mapper<A, B> {
	convert(input: A): B;
}

export class InputNumberMapper implements Mapper<string, number> {
	convert(input: string): number {
		return +input;
	}
}

export class InputDateMapper implements Mapper<string | number, Date> {
	convert(input: string | number): Date {
		return new Date(input);
	}
}

export class InputDefaultMapper<T = any> implements Mapper<T, T>{
	convert(input: T): T {
		return input;
	}
}

export class Mappers {
	static default = new InputDefaultMapper();
	static number = new InputNumberMapper();
	static date = new InputDateMapper();
}
