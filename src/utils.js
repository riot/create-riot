import { askCustomTemplatePath, askProjectTemplate } from './prompts.js'
import { unlink, createWriteStream } from 'node:fs'
import { CUSTOM_PROJECT_KEY } from './constants.js'
import { URL } from 'url'
import extractZip from 'extract-zip'
import { join } from 'node:path'
import { merge } from 'lodash-es'
import { promisify } from 'util'
import { render } from 'ejs'
import rimraf from 'rimraf'
import through from 'through2'
import spawn from '@npmcli/promise-spawn'
import fetch from 'node-fetch'

const removeFile = promisify(unlink)

// validators for the prompts
export const validateEmptyString = (message) => (value) =>
  value.length ? true : message
export const validateWrongUrl = (message) => (value) =>
  isValidUrl(value) ? true : message

/**
 * Terminate the process with a critical error
 * @param  {string} message - error message
 * @param  {Error} error - error object
 * @return {undefined}
 */
/* istanbul ignore next */
export function panic(message, error) {
  console.log('\n')
  console.error(message)

  // exit with 1 after the error dispatching
  setImmediate(() => {
    process.exit(1)
  })

  console.log('Error details:\n')
  throw new Error(error)
}

/**
 * Get the template zip file path by a template type
 * @param  {string} type - template type id
 * @return {string} path to the template zip file to download
 */
export const getTemplateZipPathByTemplateType = (type) =>
  `https://github.com/riot/${type}-template/archive/main.zip`

/**
 * Check if the url passed is valid
 * @param  {string} url - url to check
 * @return {boolean} true if it's a valid url
 */
export const isValidUrl = (url) => {
  try {
    new URL(url)
    return true
  } catch (err) {
    return false
  }
}

/**
 * Download a remote file and copy it in a local system folder
 * @param {string} remoteFileUrl - remote file uri
 * @param {string} destinationFolder - local system file location where the file will be copied
 * @return {Promise<string>} path to the local file
 */
export async function downloadFile(remoteFileUrl, destinationFolder) {
  const fileName = 'template.zip'
  const destinationFile = join(destinationFolder, fileName)

  try {
    const response = await fetch(remoteFileUrl)
    if (!response.ok) {
      throw new Error('Failed to download template zip file')
    }

    const dest = createWriteStream(destinationFile)
    await new Promise((resolve, reject) => {
      response.body.pipe(dest)
      response.body.on('error', reject)
      dest.on('finish', resolve)
    })
  } catch (error) {
    /* istanbul ignore next */
    panic('It was not possible to download the template zip file', error)
  }

  return destinationFile
}

/**
 * Delete a folder recursively from the file system
 * @param  {string} path - path to the folder to delete
 * @return {Promise<undefined>} IO operation
 */
export function deleteFolder(path) {
  return new Promise((resolve) => {
    try {
      rimraf(path, {}, resolve)
    } catch (error) {
      /* istanbul ignore next */
      panic(`It was not possible to delete the "${path}" folder`, error)
    }
  })
}

/**
 * Delete a file from the file system
 * @param  {string} path - path to the file to delete
 * @return {Promise<undefined>} IO operation
 */
export function deleteFile(path) {
  try {
    return removeFile(path)
  } catch (error) {
    /* istanbul ignore next */
    panic(`It was not possible to delete the "${path}" file`, error)
  }
}

/**
 * Transform the files template files interpolating the package.json values to their content
 * @param  {Object} pkg - package.json content
 * @return {Function} - function returning a through stream
 */
export const transformFiles = (pkg) => (src) => {
  return through((chunk, enc, done) => {
    const originalFileContent = chunk.toString()

    // if it's a package.json file we merge it with the one just created
    if (src.includes('package.json')) {
      done(null, JSON.stringify(merge(pkg, JSON.parse(originalFileContent))))
    } else {
      // otherwise we interpolate the file content with the package values
      try {
        const fileContent = render(originalFileContent, pkg)

        done(null, fileContent)
      } catch (error) {
        console.error('It was not possible to interpolate the values in', src)
        done(null, originalFileContent)
      }
    }
  })
}

/**
 * Unzip a file
 * @param  {string} path - zip file path
 * @param  {Object} options - extractZip options
 * @return {Promise<undefined>} IO operation
 */
export function unzip(path, options) {
  try {
    return extractZip(path, options)
  } catch (error) {
    /* istanbul ignore next */
    panic(`It was not possible to unzip the "${path}" file`, error)
  }
}

/**
 * Run `npm init` in the current directory
 * @param  {string} pkgManager - npm or yarn
 * @return {ChildProcess} - child process instance
 */
/* istanbul ignore next */
export const initPackage = (pkgManager) => {
  const args = process.argv.slice(2).filter((arg) => arg.startsWith('-'))

  return spawn(pkgManager, ['init', ...args], {
    stdio: 'inherit',
  })
}

/**
 * Get the template info depending on the user feedback
 * @return {Promise<Object>} an object containing the "templateZipURL" property
 */
/* istanbul ignore next */
export const getTemplateInfo = async () => {
  const { templateType } = await askProjectTemplate()

  if (templateType === CUSTOM_PROJECT_KEY) {
    return {
      ...(await askCustomTemplatePath()),
      templateType,
    }
  }

  return {
    templateZipURL: getTemplateZipPathByTemplateType(templateType),
    templateType,
  }
}
