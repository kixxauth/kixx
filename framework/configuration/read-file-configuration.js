// @ts-check

import fs from 'node:fs';
import path from 'node:path';
import { ProgrammerError } from 'kixx-server-errors';
import { isDirectory, readConfigFile } from '../lib/file-utils.js';
import ApplicationServerConfig from './application-server-config.js';

const ALLOWED_CONFIG_FILE_EXTENSIONS = [ '.toml' ];

/**
 * @param  {String} configDirectory
 * @return {Promise<Array<ApplicationServerConfig>>}
 */
export default function readFileConfiguration(configDirectory) {
    const promises = fs.readdirSync(configDirectory)
        .map(joinFilePath(configDirectory))
        .filter(isDirectory)
        .map(readConfigData);

    return Promise.all(promises);
}

function joinFilePath(basepath) {
    return function (filename) {
        return path.join(basepath, filename);
    };
}

function hasAllowedExtension(filepath) {
    return ALLOWED_CONFIG_FILE_EXTENSIONS.includes(path.extname(filepath));
}

async function readConfigData(namespacedDirectory) {

    // Choose the last file with an allowed file extension in the root
    // config directory as the server config file.
    const serverConfigFilepath = fs.readdirSync(namespacedDirectory)
        .map(joinFilePath(namespacedDirectory))
        .filter(hasAllowedExtension)
        .pop();

    const appConfigDirectory = path.join(namespacedDirectory, 'applications');

    if (!isDirectory(appConfigDirectory)) {
        throw new ProgrammerError(
            `Config path expected to be a directory: ${ appConfigDirectory }`
        );
    }

    const appConfigFilepaths = fs.readdirSync(appConfigDirectory)
        .map(joinFilePath(appConfigDirectory))
        .filter(hasAllowedExtension);

    let config;

    if (serverConfigFilepath) {
        config = await readConfigFile(serverConfigFilepath);
    }

    const applicationConfigs = await Promise.all(
        appConfigFilepaths.map(readConfigFile)
    );

    return ApplicationServerConfig.fromConfigFile(config, applicationConfigs);
}
