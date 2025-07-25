import {
  deleteFile,
  deleteFolder,
  downloadFile,
  getTemplateInfo,
  initPackage,
  transformFiles,
  unzip,
} from './utils.js'
import { TMP_DIR } from './constants.js'
import copy from 'recursive-copy'
import { first } from 'lodash-es'
import { getPackageManager } from 'pkg-install'
import { join } from 'path'
import { mkdirp } from 'mkdirp'
import ora from 'ora'
import { readdirSync } from 'node:fs'
import Module from 'node:module'

const require = Module.createRequire(import.meta.url)

/**
 * Download the template project
 * @param  {string} tmpDir - path where the zip file will be downloaded
 * @returns {Promise<string>} path to the zip file
 */
async function download(tmpDir) {
  const { templateZipURL } = await getTemplateInfo()
  const spinner = ora('Downloading the template files').start()
  const zipPath = await downloadFile(templateZipURL, tmpDir)

  spinner.succeed()

  return zipPath
}

/**
 * Extract the zip file contents
 * @param  {string} zipPath - path to the zip file
 * @param  {string} tmpDir - temporary folder path
 * @returns {Promise<undefined>} IO() operation
 */
async function extract(zipPath, tmpDir) {
  const spinner = ora('Unzipping the file downloaded').start()

  await unzip(zipPath, { dir: tmpDir })

  spinner.succeed()
}

/**
 * Copy and transform the files of the template downloaded
 * @param  {string} currentFolder - path where the files will be copied
 * @param  {string} tmpDir - temporary folder path
 * @returns {Promise<undefined>} IO() operation
 */
async function transform(currentFolder, tmpDir) {
  const templateFolders = readdirSync(tmpDir)
  // github unzipped files create only a single folder so we flatten it
  const projectTemplateRootFolder =
    templateFolders.length > 1 ? tmpDir : first(templateFolders)
  const sourceFilesFolder = join(tmpDir, projectTemplateRootFolder)
  const spinner = ora('Copying the template files into your project').start()

  await copy(sourceFilesFolder, currentFolder, {
    overwrite: true,
    dot: true,
    junk: false,
    transform: transformFiles(require(join(currentFolder, 'package.json'))),
  })

  spinner.succeed()
}

/**
 * Delete the zip file
 * @param  {string} zipPath - path to the zip file
 * @returns {Promise<undefined>} IO() operation
 */
async function deleteZip(zipPath) {
  const spinner = ora('Deleting the zip file').start()

  await deleteFile(zipPath)
  spinner.succeed()
}

/**
 * Delete the temporary folder created to parse the template files
 * @param  {string} tmpDir - temporary folder path
 * @returns {Promise<undefined>} IO() operation
 */
async function deleteTmpDir(tmpDir) {
  const spinner = ora('Deleting the temporary folder').start()

  await deleteFolder(tmpDir)

  spinner.succeed()
}

export default async function main() {
  const currentFolder = process.cwd()

  // create a temporary folder
  const tmpDir = join(currentFolder, TMP_DIR)
  await mkdirp(tmpDir)

  // trigger npm init
  await initPackage(
    await getPackageManager({
      prefer: 'npm',
    }),
  )

  // get the template to use and download it
  const zipPath = await download(tmpDir)

  // extract the template contents
  await extract(zipPath, tmpDir)

  // delete the zip file
  await deleteZip(zipPath)

  // copy and transform the files
  await transform(currentFolder, tmpDir)

  // remove the tmp dir
  await deleteTmpDir(tmpDir)

  ora('Template successfully created!').succeed()
}
