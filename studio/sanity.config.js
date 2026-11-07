import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {orderableDocumentListDeskItem} from '@sanity/orderable-document-list'
import {schemaTypes} from './schemaTypes'

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || 'sdzmmkh2'
const dataset = process.env.SANITY_STUDIO_DATASET || 'production'
const SITE_URL = 'https://lilo123.github.io/protehome-lab/'

export default defineConfig({
  name: 'protehome-lab',
  title: 'Nguyen Atom Protehome Lab',
  projectId,
  dataset,
  plugins: [
    structureTool({
      structure: (S, context) =>
        S.list()
          .title('Website content')
          .items([
            S.listItem()
              .title('Lab page text')
              .id('labInfo')
              .child(S.document().schemaType('labInfo').documentId('labInfo').title('Lab page text')),
            S.divider(),
            orderableDocumentListDeskItem({type: 'person', title: 'People (drag to reorder)', S, context}),
            S.documentTypeListItem('essay').title('Writing'),
            S.documentTypeListItem('news').title('News'),
          ]),
    }),
    // Advanced query tool, only shown to the setup account.
    ...(process.env.SANITY_STUDIO_SHOW_VISION === 'true' ? [visionTool()] : []),
  ],
  schema: {
    types: schemaTypes,
    // "Lab page text" is a single page: hide it from the "create new" menu.
    templates: (prev) => prev.filter((t) => t.schemaType !== 'labInfo'),
  },
  document: {
    actions: (prev, {schemaType}) =>
      schemaType === 'labInfo' ? prev.filter(({action}) => !['unpublish', 'delete', 'duplicate'].includes(action)) : prev,
    productionUrl: async () => SITE_URL,
  },
})
