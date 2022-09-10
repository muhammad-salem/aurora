
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
