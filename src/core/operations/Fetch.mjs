/**
 * Fetch operation
 *
 * @author Xecades [i@xecades.xyz]
 * @copyright Crown Copyright 2026
 * @license Apache-2.0
 */

import Operation from "../Operation.mjs";
import OperationError from "../errors/OperationError.mjs";

/**
 * Exposes the browser Fetch API as a CyberChef operation.
 */
class Fetch extends Operation {

    /**
     * Create the Fetch operation configuration.
     */
    constructor() {
        super();

        this.name = "Fetch";
        this.module = "Default";
        this.description = [
            "Use the Fetch API to hit a URL with the method and payload you choose.",
            "<br><br>",
            "The payload field allows you to override the request body even when the recipe input is used for the URL.",
            "<br><br>",
            "Headers can be added line by line, and the return type lets you keep the response as text or raw bytes."
        ].join("\n");
        this.infoURL = "https://developer.mozilla.org/docs/Web/API/Fetch_API";
        this.inputType = "string";
        this.outputType = "string";
        this.args = [
            {
                "name": "Method",
                "type": "option",
                "value": [
                    "GET",
                    "POST",
                    "PUT",
                    "PATCH",
                    "DELETE",
                    "OPTIONS",
                    "HEAD"
                ]
            },
            {
                "name": "Payload",
                "type": "text",
                "value": "",
                "rows": 4
            },
            {
                "name": "Headers",
                "type": "text",
                "value": "",
                "rows": 4
            },
            {
                "name": "Return type",
                "type": "option",
                "value": [
                    "String",
                    "Bytes"
                ]
            }
        ];
    }

    /**
     * Executes the configured HTTP request via `fetch`.
     *
     * @param {string} input - URL to request.
     * @param {Array} args - [method, payload, headers, return type].
     * @returns {Promise<Uint8Array|string>}
     */
    async run(input, args) {
        const [method, payload, headersText, returnType] = args;
        const targetUrl = (input || "").trim();

        if (targetUrl.length === 0) {
            return "";
        }

        if (typeof fetch !== "function") {
            throw new OperationError("Fetch API is not available in this environment.");
        }

        const headers = new Headers();
        headersText.split(/\r?\n/).forEach(line => {
            line = line.trim();
            if (line.length === 0) return;

            const colonIndex = line.indexOf(":");
            if (colonIndex < 0) {
                throw new OperationError(`Could not parse header in line: ${line}`);
            }

            const name = line.slice(0, colonIndex).trim();
            const value = line.slice(colonIndex + 1).trim();
            if (name.length === 0) {
                throw new OperationError(`Could not parse header in line: ${line}`);
            }
            headers.set(name, value);
        });

        const config = {
            method,
            headers,
            cache: "no-cache",
        };

        const hasPayload = payload.length > 0;
        if (method !== "GET" && method !== "HEAD" && hasPayload) {
            config.body = payload;
        }

        try {
            const response = await fetch(targetUrl, config);

            if (response.status === 0 && response.type === "opaque") {
                throw new OperationError("Error: Null response. Try setting the connection mode to CORS.");
            }

            const wantsBytes = returnType === "Bytes";
            const selectedType = wantsBytes ? "byteArray" : "string";
            this.outputType = selectedType;
            this.presentType = selectedType;

            if (wantsBytes) {
                const buffer = await response.arrayBuffer();
                return Array.from(new Uint8Array(buffer));
            }

            return await response.text();
        } catch (err) {
            throw new OperationError(err.toString() +
                "\n\nThis error could be caused by one of the following:\n" +
                " - An invalid URL\n" +
                " - Making a request to an insecure resource (HTTP) from a secure source (HTTPS)\n" +
                " - Making a cross-origin request to a server which does not support CORS");
        }
    }
}

export default Fetch;
