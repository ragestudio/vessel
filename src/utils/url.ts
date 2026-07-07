export function isUrl(str: string): boolean {
	return str.startsWith("http://") || str.startsWith("https://")
}

export function replaceRelativeImportWithUrl(
	relativePath: string,
	url: string,
): string {
	return isUrl(relativePath) ? relativePath : new URL(relativePath, url).href
}
