import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import glsl from 'vite-plugin-glsl';
import path from 'path';

export default defineConfig({
    base: "/Brainwashed_XR/",
    clearScreen: false,
    optimizeDeps: {
        esbuildOptions: {
            supported: {
                'top-level-await': true
            }
        }
    },
    esbuild: {
        supported: {
            'top-level-await': true
        }
    },
    build: {
        sourcemap: true,
    },
    server: {
        open: true
    },
    resolve: {
        alias: {
            'three': path.resolve('./node_modules/three'),
        }
    },
    plugins: [
        viteStaticCopy({
            targets: [
                { src: 'node_modules/three/examples/jsm/libs/ammo.wasm.js', dest: 'jsm/libs/' },
                { src: 'node_modules/three/examples/jsm/libs/ammo.wasm.wasm', dest: 'jsm/libs/' },
                { src: 'node_modules/three/examples/jsm/libs/draco/gltf/draco_decoder.js', dest: 'jsm/libs/draco/gltf' },
                { src: 'node_modules/three/examples/jsm/libs/draco/gltf/draco_decoder.wasm', dest: 'jsm/libs/draco/gltf/' },
                { src: 'node_modules/three/examples/jsm/libs/draco/gltf/draco_encoder.js', dest: 'jsm/libs/draco/gltf/' },
                { src: 'node_modules/three/examples/jsm/libs/draco/gltf/draco_wasm_wrapper.js', dest: 'jsm/libs/draco/gltf/' }
            ]
        }),
        glsl()
    ]
});
