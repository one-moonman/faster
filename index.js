#!/usr/bin/env node
import fs from "fs";
import { exec as notAsyncExec } from "child_process";
import { promisify } from 'util';
const exec = promisify(notAsyncExec);
const readFile = promisify(fs.readFile);
const appendFile = promisify(fs.appendFile);
const writeFile = promisify(fs.watchFile);

const args = process.argv.slice(2);

switch (args[0]) {
    case 'create':
        await setupEnvironment()
        break;
    case 'module':
        await createModule()
        break;
    default:
        console.log("You have to provide function-name to execute")
        process.exit(1)
}

async function setupEnvironment() {
    const [prodDeps, devDeps] = await Promise.all([
        exec('npm i fastify @fastify/swagger dotenv'),
        exec('npm i --save-dev typescript ts-node @types/node nodemon esbuild esbuild-node-tsc json-schema-to-ts'),
    ])
    if (prodDeps.stderr || devDeps.stderr) {
        console.log(prodDeps.stderr || devDeps.stderr)
        process.exit(1)
    }
    // tsconfig.json
    const tsconfig = () => appendFile('tsconfig.json', JSON.stringify({
        "compilerOptions": {
            "target": "esnext",
            "module": "esnext",
            "allowJs": true,
            "removeComments": true,
            "resolveJsonModule": true,
            "typeRoots": [
                "./node_modules/@types"
            ],
            "sourceMap": true,
            "outDir": "dist",
            "strict": true,
            "lib": [
                "esnext"
            ],
            "baseUrl": ".",
            "forceConsistentCasingInFileNames": true,
            "esModuleInterop": true,
            "experimentalDecorators": true,
            "emitDecoratorMetadata": true,
            "moduleResolution": "Node",
            "skipLibCheck": true,
        },
        "include": [
            "src/**/*"
        ],
        "exclude": [
            "node_modules"
        ],
    }))

    // nodemon.json
    const nodemon = () => appendFile('nodemon.json', JSON.stringify({
        "watch": [
            "src"
        ],
        "ignore": [
            "src/**/*.test.ts"
        ],
        "ext": "ts,mjs,js,json,graphql",
        "exec": "etsc && node ./dist/index.js",
        "legacyWatch": true
    }))

    await Promise.all([tsconfig, nodemon])

    // package.json scripts
    let packageJsonBuffer = JSON.parse(fs.readFileSync('package.json').toString());
    packageJsonBuffer.scripts = {
        "tsn": "ts-node ./src/module/schema",
        "build": "etsc ./src/index.ts",
        "dev": "nodemon ./src/index.ts",
        "start": "node ./dist/index.js"
    }
    fs.readFileSync('package.json', JSON.stringify(packageJsonBuffer))

    // create index file
    if (!fs.existsSync('src')) {
        fs.mkdirSync('src');
        fs.writeFileSync('src/index.ts', `import fastify from 'fastify';

async function bootstrap() {
    try {
        const server = fastify();
        server.get('/ping', async (request, reply) => ('pong'))
        const address = await server.listen({ port: 8080 });
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

bootstrap()`)
    }

}

async function createModule() {
    try {
        if (!fs.existsSync('src')) {
            fs.mkdir('src');
        }
    } catch (err) {
        console.error(err);
    }
}
