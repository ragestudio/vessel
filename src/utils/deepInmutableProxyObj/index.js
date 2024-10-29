function deepInmutableProxyObj(obj, binder, deep = 0) {
    return new Proxy(obj, {
        get: (target, prop) => {
            if (typeof target[prop] === "object" && target[prop] !== null) {
                return deepInmutableProxyObj(target[prop], binder, deep + 1)
            }

            if (typeof target[prop] === "function") {
                return target[prop].bind(target)
            }

            return target[prop]
        },
        set: (target, prop, value) => {
            console.error("You can't modify a inmutable proxy")

            return target[prop]
        }
    })
}

export default deepInmutableProxyObj