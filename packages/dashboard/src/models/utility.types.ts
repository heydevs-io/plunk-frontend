// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export type FirstParams<T extends (...args: any) => any> = Parameters<T>[0];
