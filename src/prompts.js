import {
  COMPONENT_PROJECT_KEY,
  CUSTOM_PROJECT_KEY,
  PARCEL_PROJECT_KEY,
  ROLLUP_PROJECT_KEY,
  SPA_WEBPACK_PROJECT_KEY,
  WEBPACK_PROJECT_KEY,
} from './constants.js'
import { validateEmptyString, validateWrongUrl } from './utils.js'
import enquirer from 'enquirer'
const { prompt } = enquirer

// exit in case of prompt cancel event
prompt.on('cancel', () => process.exit(1))

/**
 * Ask for the project template we want to use
 * @returns {Promise<object>} object containing the "templateType" we have selected
 */
export const askProjectTemplate = () =>
  prompt({
    type: 'select',
    name: 'templateType',
    message: 'Please select a template',
    choices: [
      { message: 'Webpack Project Template', name: WEBPACK_PROJECT_KEY },
      { message: 'Parcel Project Template', name: PARCEL_PROJECT_KEY },
      { message: 'Rollup Project Template', name: ROLLUP_PROJECT_KEY },
      { message: 'Simple Component', name: COMPONENT_PROJECT_KEY },
      {
        message: 'SPA (Webpack) Project Template',
        name: SPA_WEBPACK_PROJECT_KEY,
      },
      {
        message:
          'Custom Template (You will need to provide a template path to your template zip file)',
        name: CUSTOM_PROJECT_KEY,
      },
    ],
    validate: validateEmptyString('Your project template can not be empty'),
  })

/**
 * Selecting a custom template we will need to provide the url where we will download the zip file
 * @returns {Promise<object>} object containing the "templateZipURL" key
 */
export const askCustomTemplatePath = () =>
  prompt({
    type: 'text',
    name: 'templateZipURL',
    message: "What's the path to your custom template zip file?",
    validate: validateWrongUrl(
      'Please provide a valid url to your template zip file',
    ),
  })
