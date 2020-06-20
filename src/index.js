import { CUSTOM_PROJECT_KEY, TMP_DIR } from './constants'
import { askCustomTemplatePath, askProjectTemplate } from './prompts'
import { downloadFile, getTemplatePathByTemplateType } from './utils'
import { merge, template } from 'lodash/fp'
import copy from 'recursive-copy'
import execa from 'execa'
import extractZip from 'extract-zip'
import fcf from 'fcf'
import { getPackageManager } from 'pkg-install'
import { join } from 'path'
import mkdirp from 'mkdirp'
import through from 'through2'
import { unlinkSync } from 'fs'

/**
 * Run `npm init` in the current directory
 * @param  {string} pkgManager - npm or yarn
 * @return {ChildProcess} - child process instance
 */
export const initPackage = pkgManager => {
  const args = process.argv
    .slice(2)
    .filter((arg) => arg.startsWith('-'))

  return execa(pkgManager, ['init', ...args], {
    stdio: 'inherit'
  })
}

/**
 * Get the template info depending on the user feedback
 * @return {Promise<Object>} an object containing the "templateZipURL" property
 */
export const getTemplateInfo = async() => fcf
  .if(({ templateType }) => templateType === CUSTOM_PROJECT_KEY)
  .then(async({ templateType }) => ({
    ...(await askCustomTemplatePath()),
    templateType
  }))
  .else(({ templateType }) => ({
    templateZipURL: getTemplatePathByTemplateType(templateType),
    templateType
  }))
  .run(await askProjectTemplate())
  .value

/**
 * Transform the files template files interpolating the package.json values to their content
 * @param  {Object} pkg - package.json content
 * @return {Function} - function returning a through stream
 */
export const transformFiles = pkg => src => {
  return through((chunk, enc, done) => {
    const originalFileContent = chunk.toString()

    fcf
      // if it's a package.json file we merge it with the one just created
      .if(path => path.includes('package.json'))
      .then(() => {
        const templatePackage = JSON.parse(originalFileContent)

        done(null, JSON.stringify(merge(pkg, templatePackage)))
      })
      // otherwise we interpolate the file content with the package values
      .else(() => {
        try {
          const fileContent = template(originalFileContent)(pkg)

          done(null, fileContent)

        } catch(error) {
          console.error(error)

          done(null, originalFileContent)
        }
      })
      .run(src)
  })
}

export default async function main() {
  const currentFolder = process.cwd()

  // create a temporary folder
  const tmpDir = join(currentFolder, TMP_DIR)
  await mkdirp(tmpDir)

  // trigger npm init
  await initPackage(await getPackageManager())

  // get the template to use and download it
  const { templateZipURL } = await getTemplateInfo()
  const zipPath = await downloadFile(templateZipURL, tmpDir)

  // extract the template contents
  await extractZip(zipPath, { dir: tmpDir })
  // delete the zip file
  unlinkSync(zipPath)

  // copy and transform the files
  await copy(tmpDir, currentFolder, {
    transform: transformFiles(require(join(currentFolder, 'package.json')))
  })

  unlinkSync(tmpDir)
}