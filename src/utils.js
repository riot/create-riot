import { basename, join } from 'path'
import { unlink, writeFileSync } from 'fs'
import { URL } from 'url'
import extractZip from 'extract-zip'
import { promisify } from 'util'
import request from 'request-promise-native'
import rimraf from 'rimraf'

const removeFile = promisify(unlink)

/**
 * Terminate the process with a critical error
 * @param  {string} message - error message
 * @param  {Error} error - error object
 * @return {undefined}
 */
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
export const getTemplateZipPathByTemplateType = type => `https://github.com/riot/${type}-template/archive/master.zip`

/**
 * Check if the url passed is valid
 * @param  {string} url - url to check
 * @return {boolean} true if it's a valid url
 */
export const isValidUrl = url => {
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
  const fileName = basename(remoteFileUrl) || 'template.zip'
  const destinationFile = join(destinationFolder, fileName)

  try {
    const { body } = await request({
      method: 'get',
      uri: remoteFileUrl,
      encoding: null,
      resolveWithFullResponse: true
    })

    writeFileSync(destinationFile, body)
  } catch(error) {
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
    panic(`It was not possible to delete the "${path}" file`, error)
  }
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
  } catch(error) {
    panic(`It was not possible to unzip the "${path}" file`, error)
  }
}