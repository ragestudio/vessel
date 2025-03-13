import { isUrl } from "../url"

function replaceRelativeImportWithUrl(relativePath, url) {
	return isUrl(relativePath) ? relativePath : new URL(relativePath, url).href
}

export default replaceRelativeImportWithUrl
