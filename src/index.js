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