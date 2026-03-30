import { fileURLToPath } from "url"
import { dirname, resolve } from "path"

const __dirname = dirname(fileURLToPath(import.meta.url))

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    resolve(__dirname, "../../packages/react/src/**/*.{js,ts,jsx,tsx}"),
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
