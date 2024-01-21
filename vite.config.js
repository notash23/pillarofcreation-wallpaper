import { defineConfig } from "vite";

export default defineConfig({
    build: {
        minify: 'terser',
        terserOptions: {
            mangle: {
                reserved: ["livelyAudioListener", "livelyPropertyListener"]
            },
            compress: {
                keep_fnames: /^.*/,
            },
        },
    },
})