function isJsxCode(code) {
    const jsxPattern = /<([A-Za-z][A-Za-z0-9]*)(\s+[^>]*)?(\/?>).*<\/\1>|<([A-Za-z][A-Za-z0-9]*)(\s+[^>]*)?\/>/s;

    return jsxPattern.test(code)
}

export default isJsxCode