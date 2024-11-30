import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import glsl from 'vite-plugin-glsl';
import path from 'path';

export default defineConfig({
    // Chemin de base pour le déploiement sur GitHub Pages
    base: "/Brainwashed_XR/",

    // Suppression des messages inutiles dans la console
    clearScreen: false,

    // Configuration de l'optimisation des dépendances
    optimizeDeps: {
        esbuildOptions: {
            supported: {
                'top-level-await': true // Support de "top-level await"
            }
        }
    },

    // Configuration ESBuild pour le support avancé
    esbuild: {
        supported: {
            'top-level-await': true
        }
    },

    // Configuration de construction
    build: {
        sourcemap: true, // Générer des sourcemaps pour faciliter le débogage
    },

    // Configuration du serveur local
    server: {
        open: true // Ouvrir automatiquement dans le navigateur
    },

    // Alias pour simplifier les importations
    resolve: {
        alias: {
            'three': path.resolve('./node_modules/three'), // Alias pour le module "three"
        }
    },

    // Plugins
    plugins: [
        viteStaticCopy({
            // Copier des fichiers nécessaires dans le dossier de build
            targets: [
                { src: 'node_modules/three/examples/jsm/libs/ammo.wasm.js', dest: 'jsm/libs/' },
                { src: 'node_modules/three/examples/jsm/libs/ammo.wasm.wasm', dest: 'jsm/libs/' },
                { src: 'node_modules/three/examples/jsm/libs/draco/gltf/draco_decoder.js', dest: 'jsm/libs/draco/gltf' },
                { src: 'node_modules/three/examples/jsm/libs/draco/gltf/draco_decoder.wasm', dest: 'jsm/libs/draco/gltf/' },
                { src: 'node_modules/three/examples/jsm/libs/draco/gltf/draco_encoder.js', dest: 'jsm/libs/draco/gltf/' },
                { src: 'node_modules/three/examples/jsm/libs/draco/gltf/draco_wasm_wrapper.js', dest: 'jsm/libs/draco/gltf/' }
            ]
        }),
        glsl() // Support pour les shaders GLSL
    ]
});
