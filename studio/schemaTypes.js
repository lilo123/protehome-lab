// Content structure for the Nguyen Atom Protehome Lab Studio.
// Plain-English labels + short hints so non-technical editors know what each box is for.

const labInfo = {
  name: 'labInfo',
  title: 'Lab page text',
  type: 'document',
  groups: [
    {name: 'top', title: 'Top of page', default: true},
    {name: 'research', title: 'Research'},
    {name: 'contact', title: 'Contact'},
  ],
  fields: [
    {name: 'labName', title: 'Lab name', type: 'string', group: 'top', validation: (r) => r.required()},
    {name: 'tagline', title: 'Tagline', type: 'string', group: 'top', description: 'Short line under the lab name, e.g. "Protein Homeostasis & Therapeutic Discovery".'},
    {name: 'vision', title: 'Vision statement', type: 'text', rows: 3, group: 'top', description: 'One or two sentences. Shown at the top of the page and in the Research section.'},
    {name: 'about', title: 'About the lab', type: 'text', rows: 4, group: 'top', description: 'A short paragraph (2–3 sentences) about the lab.'},
    {name: 'piProfileUrl', title: 'PI profile link', type: 'url', group: 'top', description: 'Link to the PI page on the VinUniversity website.'},
    {name: 'scholarUrl', title: 'Google Scholar link', type: 'url', group: 'research', description: 'Used by the Publications section.'},
    {
      name: 'pillars',
      title: 'Research pillars',
      type: 'array',
      group: 'research',
      description: 'Drag to reorder. Numbers (01, 02, …) are added automatically.',
      of: [
        {
          type: 'object',
          name: 'pillar',
          title: 'Pillar',
          fields: [
            {name: 'title', title: 'Title', type: 'string', validation: (r) => r.required()},
            {name: 'description', title: 'Description', type: 'text', rows: 2},
            {name: 'tags', title: 'Keywords (optional)', type: 'array', of: [{type: 'string'}], options: {layout: 'tags'}, description: 'Type a keyword and press Enter.'},
          ],
          preview: {select: {title: 'title', subtitle: 'description'}},
        },
      ],
    },
    {name: 'contactEmail', title: 'Contact email', type: 'string', group: 'contact'},
    {name: 'contactPhone', title: 'Contact phone', type: 'string', group: 'contact'},
    {name: 'address', title: 'Address', type: 'string', group: 'contact'},
  ],
  preview: {prepare: () => ({title: 'Lab page text'})},
}

const person = {
  name: 'person',
  title: 'Person',
  type: 'document',
  fields: [
    {name: 'name', title: 'Full name', type: 'string', validation: (r) => r.required()},
    {
      name: 'role',
      title: 'Role',
      type: 'string',
      description: 'e.g. Principal Investigator, Postdoctoral Researcher, Undergraduate Researcher, Collaborator.',
    },
    {
      name: 'status',
      title: 'Current member or alumni?',
      type: 'string',
      options: {list: [{title: 'Current member', value: 'current'}, {title: 'Alumni', value: 'alumni'}], layout: 'radio', direction: 'horizontal'},
      initialValue: 'current',
      validation: (r) => r.required(),
    },
    {name: 'email', title: 'Email (optional)', type: 'string', description: 'Shown as an email button on the card.'},
    {
      name: 'photo',
      title: 'Photo (optional)',
      type: 'image',
      options: {hotspot: true},
      description: 'A square headshot works best. After uploading, click the crop icon to choose where the face is. If empty, initials are shown.',
    },
    {name: 'alumniYear', title: 'Year left the lab', type: 'string', hidden: ({document}) => document?.status !== 'alumni'},
    {name: 'alumniNow', title: 'Where they are now', type: 'string', description: 'e.g. Undergraduate Student, University of Minnesota', hidden: ({document}) => document?.status !== 'alumni'},
    {name: 'orderRank', type: 'string', hidden: true},
  ],
  preview: {
    select: {title: 'name', role: 'role', status: 'status', media: 'photo'},
    prepare: ({title, role, status, media}) => ({title, subtitle: `${status === 'alumni' ? 'Alumni · ' : ''}${role || ''}`, media}),
  },
}

const essay = {
  name: 'essay',
  title: 'Essay',
  type: 'document',
  fields: [
    {name: 'title', title: 'Title', type: 'string', validation: (r) => r.required()},
    {
      name: 'slug',
      title: 'Web address',
      type: 'slug',
      description: 'Click "Generate" to create it from the title.',
      options: {source: 'title', maxLength: 80},
      validation: (r) => r.required(),
    },
    {name: 'date', title: 'Date', type: 'date', options: {dateFormat: 'MMMM YYYY'}, validation: (r) => r.required()},
    {
      name: 'language',
      title: 'Language',
      type: 'string',
      options: {list: [{title: 'Tiếng Việt', value: 'vi'}, {title: 'English', value: 'en'}], layout: 'radio', direction: 'horizontal'},
      initialValue: 'vi',
    },
    {name: 'cover', title: 'Cover image (optional)', type: 'image', options: {hotspot: true}},
    {name: 'excerpt', title: 'Short summary', type: 'text', rows: 3, description: '1–2 sentences shown on the essay card.'},
    {
      name: 'body',
      title: 'Text',
      type: 'array',
      description: 'You can paste straight from Word or Google Docs. Headings, bold, italics and bullet lists are kept.',
      of: [
        {
          type: 'block',
          styles: [
            {title: 'Normal', value: 'normal'},
            {title: 'Heading', value: 'h2'},
            {title: 'Quote', value: 'blockquote'},
          ],
          lists: [{title: 'Bullet list', value: 'bullet'}],
          marks: {
            decorators: [
              {title: 'Bold', value: 'strong'},
              {title: 'Italic', value: 'em'},
            ],
            annotations: [{name: 'link', type: 'object', title: 'Link', fields: [{name: 'href', type: 'url', title: 'URL'}]}],
          },
        },
        {type: 'image', options: {hotspot: true}, fields: [{name: 'caption', type: 'string', title: 'Caption'}]},
        {
          type: 'object',
          name: 'callout',
          title: 'Highlight box',
          fields: [
            {name: 'heading', title: 'Small heading', type: 'string'},
            {name: 'text', title: 'Text', type: 'text', rows: 6},
          ],
          preview: {select: {title: 'heading', subtitle: 'text'}},
        },
      ],
    },
  ],
  orderings: [{title: 'Newest first', name: 'dateDesc', by: [{field: 'date', direction: 'desc'}]}],
  preview: {select: {title: 'title', subtitle: 'date', media: 'cover'}},
}

const news = {
  name: 'news',
  title: 'News item',
  type: 'document',
  fields: [
    {name: 'date', title: 'Date', type: 'date', options: {dateFormat: 'MMMM YYYY'}, validation: (r) => r.required()},
    {
      name: 'type',
      title: 'Type',
      type: 'string',
      options: {list: ['Seminar', 'Paper', 'Award', 'Grant', 'Event', 'Announcement']},
      initialValue: 'Seminar',
    },
    {name: 'kicker', title: 'Small label above the title (optional)', type: 'string', description: 'e.g. Work-in-Progress Seminar'},
    {name: 'title', title: 'Title', type: 'string', validation: (r) => r.required()},
    {name: 'text', title: 'Description', type: 'text', rows: 6},
    {name: 'link', title: 'Link (optional)', type: 'url'},
  ],
  orderings: [{title: 'Newest first', name: 'dateDesc', by: [{field: 'date', direction: 'desc'}]}],
  preview: {select: {title: 'title', subtitle: 'date'}},
}

export const schemaTypes = [labInfo, person, essay, news]
