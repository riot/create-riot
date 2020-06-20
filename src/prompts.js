import { COMPONENT_PROJECT_KEY, CUSTOM_PROJECT_KEY, PARCEL_PROJECT_KEY, ROLLUP_PROJECT_KEY, WEBPACK_PROJECT_KEY } from './constants'
import { isValidUrl } from './utils'
import prompts from 'prompts'

/**
 * Ask for the project template we want to use
 * @return {Promise<Object>} object containing the "templateType" we have selected
 */
export const askProjectTemplate = () => prompts({
  type: 'select',
  name: 'templateType',
  message: 'Please select a template',
  choices: [
    { title: 'Simple Component', value: COMPONENT_PROJECT_KEY },
    { title: 'Webpack Template', value: WEBPACK_PROJECT_KEY },
    { title: 'Rollup Template', value: ROLLUP_PROJECT_KEY },
    { title: 'Parcel Template', value: PARCEL_PROJECT_KEY },
    { title: 'Custom Template (You will need to provide a template path to your template zip file)', value: CUSTOM_PROJECT_KEY }
  ],
  validate: value => value.length ? true : 'Your project template can not be empty'
})

/**
 * Selecting a custom template we will need to provide the url where we will download the zip file
 * @return {Promise<Object>} object containing the "templateZipURL" key
 */
export const askCustomTemplatePath = () => prompts({
  type: 'text',
  name: 'templateZipURL',
  message: 'What\'s the path to your custom template zip file?',
  validate: value => isValidUrl(value) ? value : 'Please provide a valid url to your template zip file'
})


