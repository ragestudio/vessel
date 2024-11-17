import * as Comlink from "comlink"
import { isUrl, URLResolve } from "../utils/url"
import classAggregation from "../utils/classAggregation"
import ExtensionClass from "../extension"

let main = null
let manifest = null

class Logger {
    static log(...args) {
        console.log(`[ExtensionWorker]`, ...args)
    }

    static error(...args) {
        console.error(`[ExtensionWorker]`, ...args)
    }

    static warn(...args) {
        console.warn(`[ExtensionWorker]`, ...args)
    }
}

async function replaceImportsWithRemoteURL(codeStr, assetsUrl) {
    const importRegex = /from\s+["']([^"'\s]+)["']|import\s+["']([^"'\s]+)["']/g

    const matches = [...codeStr.matchAll(importRegex)]

    let replacements = matches.map(async ([match, fromImportStr, simpleImportStr]) => {
        if (fromImportStr) {
            if (fromImportStr.startsWith("./")) {
                fromImportStr = await URLResolve(assetsUrl, fromImportStr)
                fromImportStr = await createCodeResource(fromImportStr)
            }

            return `from "${fromImportStr}"`
        }

        if (simpleImportStr) {
            if (simpleImportStr.startsWith("./")) {
                simpleImportStr = await URLResolve(assetsUrl, simpleImportStr)
                simpleImportStr = await createCodeResource(simpleImportStr)
            }

            return `import "${simpleImportStr}"`
        }
    })

    replacements = await Promise.all(replacements)

    matches.forEach((match, i) => {
        codeStr = codeStr.replace(match[0], replacements[i])
    })

    return codeStr
}

async function createCodeResource(code) {
    if (!code) {
        return null
    }

    if (!manifest || !manifest.srcUrl) {
        throw new Error(`Manifest does not have srcUrl`)
    }

    if (isUrl(code)) {
        code = await fetch(code)
        code = await code.text()
    }

    code = await replaceImportsWithRemoteURL(code, manifest.srcUrl)

    const blob = new Blob([code], { type: "application/javascript" })
    return URL.createObjectURL(blob)
}

onmessage = async ({ data }) => {
    if (data.event === "load") {
        manifest = data.manifest

        Logger.log(`Loading extension [${manifest.registryId}] >`, data.manifest)

        // try to fetch package.json
        if (!manifest.packageUrl) {
            throw new Error(`Extension ${manifest.registryId} is missing packageUrl`)
        }

        // set packageJson
        const packageJson = await fetch(manifest.packageUrl)

        manifest.packageJson = await packageJson.json()

        // try to fetch main file
        if (!manifest.packageJson.main) {
            throw new Error(`Extension ${manifest.registryId} is missing main`)
        }

        // resolve url with the assetsUrl
        manifest.packageJson.main = URLResolve(manifest.assetsUrl, manifest.packageJson.main)

        // load main file as a module
        main = await createCodeResource(manifest.packageJson.main)

        try {
            const module = await import(main)

            main = module.default
        } catch (error) {
            Logger.error(`Failed to import main module >`, error)
        }

        try {
            main = classAggregation(ExtensionClass, main)

            main = new main()
        } catch (error) {
            Logger.error(`Failed to instantiate main module >`, error)
        }

        try {
            await main._init()
        } catch (error) {
            Logger.error(`Failed to initialize main module >`, error)
        }

        postMessage({ event: "loaded" })

        Logger.log("Exposing main class >", main, main.public)

        Comlink.expose(main.public)
    }
}