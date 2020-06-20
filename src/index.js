import {
  deleteFile,
  deleteFolder,
  downloadFile,
  getTemplateInfo,
  initPackage,
  transformFiles,
  unzip
} from './utils'
import { TMP_DIR } from './constants'
import copy from 'recursive-copy'
import { getPackageManager } from 'pkg-install'
import { join } from 'path'
import mkdirp from 'mkdirp'
import ora from 'ora'
import { readdirSync } from 'fs'

export default async function main() {
  const currentFolder = process.cwd()
  const info = {}

  // create a temporary folder
  const tmpDir = join(currentFolder, TMP_DIR)
  await mkdirp(tmpDir)

  // trigger npm init
  await initPackage(await getPackageManager({
    prefer: 'npm'
  }))

  // get the template to use and download it
  const { templateZipURL } = await getTemplateInfo()
  info.spinner = ora('Downloading the template').start()
  const zipPath = await downloadFile(templateZipURL, tmpDir)
  info.spinner.succeed()

  // extract the template contents
  info.spinner = ora(`Unzipping the "${zipPath}" file`).start()
  await unzip(zipPath, { dir: tmpDir })
  info.spinner.succeed()

  // delete the zip file
  info.spinner = ora(`Deleting the "${zipPath}" file`).start()
  await deleteFile(zipPath)
  info.spinner.succeed()

  // copy and transform the files
  const [projectTemplateRootFolder] = readdirSync(tmpDir)
  const sourceFilesFolder = join(tmpDir, projectTemplateRootFolder)
  info.spinner = ora(`Copying the template files from "${sourceFilesFolder}" into your project`).start()
  await copy(sourceFilesFolder, currentFolder, {
    overwrite: true,
    dot: true,
    junk: false,
    transform: transformFiles(require(join(currentFolder, 'package.json')))
  })
  info.spinner.succeed()

  info.spinner = ora(`Deleting the temporary "${tmpDir}" folder`).start()
  await deleteFolder(tmpDir)
  info.spinner.succeed()

  ora('Template successfully created!').succeed()
}