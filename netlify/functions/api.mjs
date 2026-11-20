// The API, built from api/src/netlify.ts by the build command in netlify.toml.
export { default } from "../../api/dist/netlify.js"

export const config = { path: "/v1/*" }
