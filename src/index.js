import { CUSTOM_PROJECT_KEY, TMP_DIR } from './constants'
import { askCustomTemplatePath, askProjectTemplate } from './prompts'
import { deleteFile, deleteFolder, downloadFile, getTemplateZipPathByTemplateType, unzip } from './utils'
import copy from 'recursive-copy'
import execa from 'execa'
import { getPackageManager } from 'pkg-install'
import { join } from 'path'
import { merge } from 'lodash-es'
import mkdirp from 'mkdirp'
import ora from 'ora'
import { readdirSync } from 'fs'
import { render } from 'ejs'
import through from 'through2'

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
export const getTemplateInfo = async() => {
  const { templateType } = await askProjectTemplate()

  if (templateType === CUSTOM_PROJECT_KEY) {
    return ({
      ...(await askCustomTemplatePath()),
      templateType
    })
  }

  return {
    templateZipURL: getTemplateZipPathByTemplateType(templateType),
    templateType
  }
}

/**
 * Transform the files template files interpolating the package.json values to their content
 * @param  {Object} pkg - package.json content
 * @return {Function} - function returning a through stream
 */
export const transformFiles = pkg => src => {
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
      } catch(error) {
        console.error('It was not possible to interpolate the values in', src)

        done(null, originalFileContent)
      }
    }
  })
}

export default async function main() {
  const currentFolder = process.cwd()

  // create a temporary folder
  const tmpDir = join(currentFolder, TMP_DIR)
  await mkdirp(tmpDir)

  // trigger npm init
  await initPackage(await getPackageManager({
    prefer: 'npm'
  }))

  // get the template to use and download it
  const { templateZipURL } = await getTemplateInfo()
  const spinner = ora('Downloading the template').start()
  const zipPath = await downloadFile(templateZipURL, tmpDir)

  // extract the template contents
  spinner.text = `Unzipping the "${zipPath}" file`
  await unzip(zipPath, { dir: tmpDir })

  // delete the zip file
  spinner.text = `Deleting the "${zipPath}" file`
  await deleteFile(zipPath)

  // copy and transform the files
  const [projectTemplateRootFolder] = readdirSync(tmpDir)
  const sourceFilesFolder = join(tmpDir, projectTemplateRootFolder)
  spinner.text = `Copying the template files from "${sourceFilesFolder}" into your project`
  await copy(sourceFilesFolder, currentFolder, {
    overwrite: true,
    dot: true,
    junk: false,
    transform: transformFiles(require(join(currentFolder, 'package.json')))
  })

  spinner.text = `Deleting the temporary "${tmpDir}" folder`
  await deleteFolder(tmpDir)
  spinner.stop()
}