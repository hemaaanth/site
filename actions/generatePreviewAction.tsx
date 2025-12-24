import { DocumentActionComponent } from 'sanity'
import { useState, useCallback } from 'react'
import { Stack, Card, Button, Box, Flex, Text, TextInput, Radio, Label } from '@sanity/ui'
import { AddIcon, CopyIcon } from '@sanity/icons'

interface Recipient {
  name: string
  email: string
}

// Dialog content component (uses hooks)
function GeneratePreviewDialog({ 
  doc, 
  id, 
  type, 
  onClose 
}: { 
  doc: any
  id: string
  type: string
  onClose: () => void 
}) {
  const [mode, setMode] = useState<'private' | 'shared'>('private')
  const [recipients, setRecipients] = useState<Recipient[]>([{ name: '', email: '' }])
  const [ownerName, setOwnerName] = useState(process.env.NEXT_PUBLIC_OWNER_NAME || '')
  const [ownerEmail, setOwnerEmail] = useState(process.env.NEXT_PUBLIC_OWNER_EMAIL || '')
  const [isGenerating, setIsGenerating] = useState(false)
  const [previewUrls, setPreviewUrls] = useState<Array<{ recipient: string; recipientName: string; previewUrl: string }> | null>(null)
  const [error, setError] = useState<string | null>(null)

  const addRecipient = () => {
    // In private mode, don't allow adding more than one recipient
    if (mode === 'private' && recipients.length >= 1) {
      setError('Private mode allows only one recipient')
      return
    }
    setRecipients([...recipients, { name: '', email: '' }])
  }

  const updateRecipient = (index: number, field: 'name' | 'email', value: string) => {
    const updated = [...recipients]
    updated[index][field] = value
    setRecipients(updated)
  }

  const removeRecipient = (index: number) => {
    if (recipients.length > 1) {
      setRecipients(recipients.filter((_, i) => i !== index))
    }
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    setError(null)

    try {
      // Validate inputs
      if (!ownerName || !ownerEmail) {
        throw new Error('Your name and email are required')
      }

      const validRecipients = recipients.filter((r) => r.name && r.email)
      if (validRecipients.length === 0) {
        throw new Error('At least one recipient with name and email is required')
      }

      // @ts-ignore - slug might have different structures
      const slug = doc.slug?.current || doc.slug

      if (!slug) {
        throw new Error('Document must have a slug')
      }

      const response = await fetch('/api/preview/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: id,
          documentType: type,
          slug,
          mode,
          recipients: validRecipients,
          ownerInfo: {
            name: ownerName,
            email: ownerEmail,
          },
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to generate preview')
      }

      const data = await response.json()
      
      // Handle response based on mode
      if (data.sessions) {
        setPreviewUrls(data.sessions)
      } else if (data.previewUrl) {
        // Legacy single URL response
        setPreviewUrls([{ recipient: '', recipientName: '', previewUrl: data.previewUrl }])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
  }
  
  const handleCopyAllUrls = () => {
    if (previewUrls) {
      const allUrls = previewUrls.map(u => `${u.recipientName} (${u.recipient}):\n${u.previewUrl}`).join('\n\n')
      navigator.clipboard.writeText(allUrls)
    }
  }

  return (
    <Box padding={4}>
      <Stack space={4}>
        {!previewUrls ? (
              <>
                {error && (
                  <Card padding={3} radius={2} tone="critical">
                    <Text size={1}>{error}</Text>
                  </Card>
                )}

                <Stack space={3}>
                  <Label>Mode</Label>
                  <Stack space={2}>
                    <Flex align="center" gap={2}>
                      <Radio
                        id="mode-private"
                        name="mode"
                        checked={mode === 'private'}
                        onChange={() => setMode('private')}
                      />
                      <Label htmlFor="mode-private">
                        <Text size={2}>Private (1-on-1) - Each recipient gets isolated comments</Text>
                      </Label>
                    </Flex>
                    <Flex align="center" gap={2}>
                      <Radio
                        id="mode-shared"
                        name="mode"
                        checked={mode === 'shared'}
                        onChange={() => setMode('shared')}
                      />
                      <Label htmlFor="mode-shared">
                        <Text size={2}>Shared (team) - All recipients see each other's comments</Text>
                      </Label>
                    </Flex>
                  </Stack>
                </Stack>

                <Stack space={3}>
                  <Label>Your Information</Label>
                  <TextInput
                    placeholder="Your name"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.currentTarget.value)}
                    disabled={!!process.env.NEXT_PUBLIC_OWNER_NAME}
                  />
                  <TextInput
                    placeholder="Your email"
                    type="email"
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.currentTarget.value)}
                    disabled={!!process.env.NEXT_PUBLIC_OWNER_EMAIL}
                  />
                  {process.env.NEXT_PUBLIC_OWNER_NAME && (
                    <Text size={1} muted>
                      Owner information is pre-configured
                    </Text>
                  )}
                </Stack>

                <Stack space={3}>
                  <Flex align="center" justify="space-between">
                    <Label>Recipients</Label>
                    <Button
                      icon={AddIcon}
                      mode="ghost"
                      text="Add recipient"
                      onClick={addRecipient}
                      fontSize={1}
                    />
                  </Flex>
                  {recipients.map((recipient, index) => (
                    <Card key={index} padding={3} radius={2} border>
                      <Stack space={2}>
                        <TextInput
                          placeholder="Recipient name"
                          value={recipient.name}
                          onChange={(e) =>
                            updateRecipient(index, 'name', e.currentTarget.value)
                          }
                        />
                        <TextInput
                          placeholder="Recipient email"
                          type="email"
                          value={recipient.email}
                          onChange={(e) =>
                            updateRecipient(index, 'email', e.currentTarget.value)
                          }
                        />
                        {recipients.length > 1 && (
                          <Button
                            mode="ghost"
                            tone="critical"
                            text="Remove"
                            onClick={() => removeRecipient(index)}
                            fontSize={1}
                          />
                        )}
                      </Stack>
                    </Card>
                  ))}
                </Stack>

                <Button
                  text="Generate Preview Link"
                  tone="primary"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  loading={isGenerating}
                />
              </>
            ) : (
              <>
                <Card padding={3} radius={2} tone="positive">
                  <Text size={1} weight="semibold">
                    Preview {previewUrls.length > 1 ? 'links' : 'link'} generated successfully!
                  </Text>
                </Card>

                {mode === 'private' ? (
                  <Text size={1} muted>
                    <strong>Private mode:</strong> Each recipient has an isolated preview with their own comments.
                  </Text>
                ) : (
                  <Text size={1} muted>
                    <strong>Shared mode:</strong> All recipients can see each other's comments. Each recipient has a unique link for proper identification.
                  </Text>
                )}

                <Stack space={3}>
                  {previewUrls.map((urlData, index) => (
                    <Stack key={index} space={2}>
                      <Label>
                        {urlData.recipientName ? `${urlData.recipientName} (${urlData.recipient})` : 'Preview URL'}
                      </Label>
                      <Card padding={3} radius={2} border>
                        <Text size={1} style={{ wordBreak: 'break-all' }}>
                          {urlData.previewUrl}
                        </Text>
                      </Card>
                      <Button
                        icon={CopyIcon}
                        text="Copy Link"
                        onClick={() => handleCopyUrl(urlData.previewUrl)}
                        mode="ghost"
                        fontSize={1}
                      />
                    </Stack>
                  ))}
                </Stack>

                {previewUrls.length > 1 && (
                  <Button
                    icon={CopyIcon}
                    text="Copy All Links"
                    onClick={handleCopyAllUrls}
                    mode="ghost"
                  />
                )}

                <Text size={1} muted>
                  {previewUrls.length > 1 ? 'These links' : 'This link'} will expire in 14 days. Share with your recipients to get their feedback.
                </Text>

                <Button text="Done" onClick={onClose} />
              </>
            )}
          </Stack>
        </Box>
  )
}

// Document action definition
export const generatePreviewAction: DocumentActionComponent = (props) => {
  const { id, type, draft, published } = props
  
  // Hooks must be called before any conditional returns
  const [dialogOpen, setDialogOpen] = useState(false)

  // Only show for post and place document types
  if (type !== 'post' && type !== 'place') {
    return null
  }

  // Get the document to preview (prefer draft, fallback to published)
  const doc = draft || published

  if (!doc) {
    return null
  }

  // Use the published ID if it exists, otherwise strip 'drafts.' prefix from draft ID
  // This ensures we always reference the base document ID in our review system
  const documentId = published?._id || id.replace(/^drafts\./, '')

  return {
    label: 'Generate Preview Link',
    icon: AddIcon,
    onHandle: () => {
      setDialogOpen(true)
    },
    dialog: dialogOpen
      ? {
          type: 'dialog',
          onClose: () => setDialogOpen(false),
          header: 'Generate Preview Link',
          content: (
            <GeneratePreviewDialog
              doc={doc}
              id={documentId}
              type={type}
              onClose={() => setDialogOpen(false)}
            />
          ),
        }
      : undefined,
  }
}

