import { basename, join } from 'path'
import { URL } from 'url'
import request from 'request-promise-native'
import { writeFileSync } from 'fs'

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
  const { body } = await request({
    method: 'get',
    uri: remoteFileUrl,
    encoding: null,
    resolveWithFullResponse: true
  })

  writeFileSync(destinationFile, body)

  return destinationFile
}