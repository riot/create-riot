import { deleteFile, deleteFolder, downloadFile, getTemplateZipPathByTemplateType, isValidUrl, transformFiles, unzip } from '../src/utils'
import copy from 'recursive-copy'
import { expect } from 'chai'
import { join } from 'path'
import mkdirp from 'mkdirp'
import { statSync } from 'fs'

const TMP_FOLDER = join(process.cwd(), '.tmp')
const FIXTURES = join(process.cwd(), 'test', 'fixtures')

describe('Riot.js Create tests', () => {
  before(async() => {
    await mkdirp(TMP_FOLDER)
  })

  after(async() => {
    await deleteFolder(TMP_FOLDER)
  })

  describe('Utils', () => {
    it('the template zip path function returns a valid string', () => {
      expect(getTemplateZipPathByTemplateType('test')).to.be.a('string')
    })

    it('the url check works properly', () => {
      expect(isValidUrl('http://google.com')).to.be.ok
      expect(isValidUrl('google.com')).to.be.not.ok
    })

    it('it can download, unzip and delete a file', async function() {
      this.timeout(60000) // the download could take much time

      const zipFile = await downloadFile('https://github.com/riot/riot/archive/master.zip', TMP_FOLDER)

      expect(statSync(zipFile)).to.be.ok

      await unzip(zipFile, { dir: TMP_FOLDER })
      await deleteFile(zipFile)

      expect(statSync(join(TMP_FOLDER, 'riot-master'))).to.be.ok
      expect(() => statSync(zipFile)).to.throw()
    })

    it('it can transform files properly', async() => {
      const pkg = { name: 'dear' }

      await copy(join(FIXTURES, 'template'), TMP_FOLDER, {
        transform: transformFiles(pkg)
      })

      expect(require(join(TMP_FOLDER)).message).to.be.equal('hello dear')
      expect(require(join(TMP_FOLDER, 'package.json')).name).to.be.equal('dear')
      expect(require(join(TMP_FOLDER, 'package.json')).dependencies).to.be.ok
    })
  })
})