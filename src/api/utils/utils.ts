
function keyFor(keys: string[], paramPath: string): string | false {
	for (let i = 0; i < keys.length; i++) {
		if (paramPath.startsWith(keys[i])) {
			return keys[i];
		}
	}
	return false;
}

function splitByRegex(str: string, regex: RegExp) {
	return str.split(regex).filter(key => key).map(a => a.trim());
}

interface Args {
	prop: string[];
	params?: string[];
}

export function mapFunArgs(path: string): Args[] {
	const splits = splitByRegex(path, /\(|\)/g);
	let temp: Args = {
		prop: splitByRegex(splits[0], /\.|\[|\]/g)
	};
	const callPaths: Args[] = [temp];
	for (let i = 1; i < splits.length; i++) {
		const args = splitByRegex(splits[i], /,/g);
		if (args.length > 1) {
			temp.params = args;
		} else {
			temp = {
				prop: splitByRegex(splits[i], /\.|\[|\]/g),
			}
			callPaths.push(temp);
		}
	}
	return callPaths;
}

export function getValueByPath(parent: any, objectPath: string, skipFirst?: boolean, resolver?: { [key: string]: any }) {
	const args = mapFunArgs(objectPath);
	let ref = parent;
	if (skipFirst) {
		args[0].prop.splice(0, 1);
	}
	for (let i = 0; i < args.length; i++) {
		const prop = args[i].prop;
		for (let j = 0; j < prop.length; j++) {
			ref = ref[prop[j]];
			if (!ref) {
				return undefined;
			}
		}
		if (args[i].params) {
			const resolverKeys = Object.keys(resolver || {});
			const keyParameters: any[] = [];
			const params = args[i].params as string[];
			for (let j = 0; j < params.length; j++) {
				const param = params[j];
				let rkey;
				if (resolver && (rkey = keyFor(resolverKeys, param))) {
					keyParameters.push(getValueByPath(resolver[<string>rkey], param, true));
				} else if (!Number.isNaN(+param)) {
					// is number
					keyParameters.push(+param);
				} else {
					// is string
					keyParameters.push(param);
				}
			}
			ref = ref(...keyParameters);
		}
	}
	return ref;
}

export function setValueByPath(parent: any, objectPath: string, value: any) {
	const argument = mapFunArgs(objectPath)[0];
	let ref = parent;
	let index;
	for (index = 0; index < argument.prop.length - 1; index++) {
		ref = ref[argument.prop[index]];
		if (!ref) {
			return;
		}
	}
	ref[argument.prop[index]] = value;
}

export function updateValue(to: Object, toPath: string, from: Object, fromPath: string): void {
	const value = getValueByPath(from, fromPath);
	if (value) {
		setValueByPath(to, toPath, value);
	} else {
		if (from instanceof HTMLElement || to instanceof HTMLElement) {
			setValueByPath(to, toPath, '');
		} else {
			setValueByPath(to, toPath, value);
		}
	}
}

export function updateAttribute(to: HTMLElement, toPath: string, from: Object, fromPath: string): void {
	to.setAttribute(toPath, getValueByPath(from, fromPath));
}

export function ToCamelCase(str: string) {
	return str.replace(/([A-Z])/g, ' $1')
		// uppercase the first character
		.replace(/^./, function (str) { return str.toUpperCase(); })
		.replace(/ /g, '');
}