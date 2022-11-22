import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import terser from '@rollup/plugin-terser';
import { nodeResolve as resolve } from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';

const isProduction = process.env.NODE_ENV === 'production';

export default {
  input: './src/index.ts',
  output: [
    {
      file: 'dist/index.min.js',
      format: 'cjs',
      plugins: [isProduction && terser()]
    },
    {
      file: 'dist/index.js',
      format: 'cjs',
      sourcemap: true
    },
    {
      file: 'dist/index.es.js',
      format: 'esm',
      sourcemap: true
    }
  ],

  plugins: [
    peerDepsExternal(),
    json(),
    resolve(),
    typescript(),
    commonjs({
      extensions: ['.js'],
      ignoreGlobal: false,
      sourceMap: false
    })
  ]
};
