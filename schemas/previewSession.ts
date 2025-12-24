import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'review',
  title: 'Review',
  type: 'document',
  fields: [
    defineField({
      name: 'token',
      title: 'Token',
      type: 'string',
      description: 'Secure random token used in preview URL',
      readOnly: true,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'liveblocksRoomId',
      title: 'Liveblocks Room ID',
      type: 'string',
      description: 'Unique room ID for Liveblocks comments',
      readOnly: true,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'documentReference',
      title: 'Document',
      type: 'reference',
      to: [{ type: 'post' }, { type: 'place' }],
      description: 'The draft document being previewed',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'mode',
      title: 'Mode',
      type: 'string',
      description: 'Private (1-on-1) or Shared (multiple reviewers see each other)',
      options: {
        list: [
          { title: 'Private (1-on-1)', value: 'private' },
          { title: 'Shared (team)', value: 'shared' },
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'createdBy',
      title: 'Created By',
      type: 'object',
      description: 'Owner of the preview session',
      fields: [
        { name: 'id', type: 'string', title: 'User ID' },
        { name: 'name', type: 'string', title: 'Name', validation: (Rule) => Rule.required() },
        { name: 'email', type: 'string', title: 'Email', validation: (Rule) => Rule.required().email() },
      ],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'recipients',
      title: 'Recipients',
      type: 'array',
      description: 'People who can access this preview',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'name', type: 'string', title: 'Name', validation: (Rule) => Rule.required() },
            { name: 'email', type: 'string', title: 'Email', validation: (Rule) => Rule.required().email() },
            { name: 'token', type: 'string', title: 'Token', description: 'Unique token for this recipient (used in private mode)', readOnly: true },
            { name: 'recipientId', type: 'string', title: 'Recipient ID', description: 'Unique ID for this recipient (used in shared mode for user identification)', readOnly: true },
            { name: 'addedAt', type: 'datetime', title: 'Added At', initialValue: () => new Date().toISOString() },
          ],
          preview: {
            select: {
              title: 'name',
              subtitle: 'email',
            },
          },
        },
      ],
      validation: (Rule) => Rule.required().min(1).custom((recipients, context) => {
        const mode = (context.document as any)?.mode
        if (mode === 'private' && recipients && recipients.length > 1) {
          return 'Private mode allows only one recipient'
        }
        return true
      }),
    }),
    defineField({
      name: 'expiresAt',
      title: 'Expires At',
      type: 'datetime',
      description: 'When this preview link expires',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'revoked',
      title: 'Revoked',
      type: 'boolean',
      description: 'Set to true to disable this preview link',
      initialValue: false,
    }),
    defineField({
      name: 'createdAt',
      title: 'Created At',
      type: 'datetime',
      readOnly: true,
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: 'commentCount',
      title: 'Comment Count',
      type: 'number',
      description: 'Number of comments (synced from Liveblocks)',
      readOnly: true,
      initialValue: 0,
    }),
  ],
  preview: {
    select: {
      documentTitle: 'documentReference.title',
      mode: 'mode',
      recipients: 'recipients',
      revoked: 'revoked',
      expiresAt: 'expiresAt',
    },
    prepare(selection) {
      const { documentTitle, mode, recipients, revoked, expiresAt } = selection
      const expired = expiresAt && new Date(expiresAt) < new Date()
      const status = revoked ? '🚫' : expired ? '⏰' : '✅'
      const recipientCount = recipients ? recipients.length : 0
      
      return {
        title: `${status} ${documentTitle || 'Unknown Document'}`,
        subtitle: `${mode} mode • ${recipientCount} recipient(s)`,
      }
    },
  },
  orderings: [
    {
      title: 'Created Date, New',
      name: 'createdAtDesc',
      by: [{ field: 'createdAt', direction: 'desc' }],
    },
    {
      title: 'Expires Date',
      name: 'expiresAtAsc',
      by: [{ field: 'expiresAt', direction: 'asc' }],
    },
  ],
})

