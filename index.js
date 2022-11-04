#!/usr/bin/env node
import fs from "fs";
import { exec, execSync, spawn } from "node:child_process";
import path from "path";
import ora from 'ora';
import { Command } from "commander";
import { promisify } from "util";
import * as url from 'url';
const asyncExec = promisify(exec)
const program = new Command();

program
    .name('faster-cli')
    .description('CLI to one-moonman`s NodeJS project template')
    .version('1.0.0');

function copyFolderSync(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest);
    }

    fs.readdirSync(src).forEach((entry) => {
        const srcPath = path.join(src, entry);
        const destPath = path.join(dest, entry);
        const stat = fs.lstatSync(srcPath);

        if (stat.isFile()) {
            fs.copyFileSync(srcPath, destPath);
        } else if (stat.isDirectory()) {
            copyFolderSync(srcPath, destPath);
        } else if (stat.isSymbolicLink()) {
            fs.symlinkSync(fs.readlinkSync(srcPath), destPath);
        }
    });
}

program
    .command('generate')
    .description('Generate project with template in given directory')
    .argument('<string>', 'directory to generate')
    .action(async str => {
        const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
        const dest = path.join(process.cwd(), str)
        const src = path.join(__dirname, 'template/app')
        const spinner = ora('Loading files').start();
        copyFolderSync(src, dest)
        spinner.color = 'yellow';
        spinner.text = 'Installing dependancies';
        await asyncExec('pnpm i --prefix ./' + str);
        spinner.stop()
        console.log('Ready');
    })

program.parse();


