import { expect } from 'chai'
import main from '../src'

describe('Riot.js Create tests', () => {
  it('the module exports a main function', () => {
    expect(main).to.be.a('function')
  })
})