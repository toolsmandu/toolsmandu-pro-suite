/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Preview, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Toolsmandu.com'

interface Props {
  title?: string
  editorName?: string
  completedAt?: string
}

const TaskCompletedAdminEmail = ({ title, editorName, completedAt }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Task completed: {title || 'a task'}</Preview>
    <Body style={main}>
      <Container style={shell}>
        <div style={brandBar}><Text style={brandText}>{SITE_NAME}</Text></div>
        <div style={hero}>
          <Text style={eyebrow}>TASK COMPLETED</Text>
          <Heading style={h1}>A task has been marked as completed</Heading>
        </div>
        <div style={detailsWrap}>
          <table style={detailsTable} cellPadding={0} cellSpacing={0}>
            <tbody>
              <tr><td style={label}>Task</td><td style={value}>{title || '—'}</td></tr>
              <tr><td style={label}>Completed by</td><td style={value}>{editorName || '—'}</td></tr>
              <tr><td style={{ ...label, borderBottom: 'none' }}>Completed at</td>
                  <td style={{ ...value, borderBottom: 'none' }}>{completedAt ? new Date(completedAt).toLocaleString() : new Date().toLocaleString()}</td></tr>
            </tbody>
          </table>
        </div>
        <div style={footer}>
          <Text style={footerBrand}>{SITE_NAME}</Text>
          <Text style={footerText}>© {new Date().getFullYear()} {SITE_NAME}. All rights reserved.</Text>
        </div>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: TaskCompletedAdminEmail,
  subject: (data: Record<string, any>) => `Task completed: ${data?.title || 'Untitled task'}`,
  displayName: 'Task Completed (Admin)',
  previewData: { title: 'Daily report check', editorName: 'Editor Name', completedAt: new Date().toISOString() },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif', margin: 0, padding: '32px 0' }
const shell = { maxWidth: '600px', backgroundColor: '#ffffff', borderRadius: '16px', overflow: 'hidden' as const, border: '1px solid #eef0f3' }
const brandBar = { padding: '24px 32px 8px', textAlign: 'center' as const }
const brandText = { color: '#0b1220', fontSize: '20px', fontWeight: 700 as const, margin: 0 }
const hero = { padding: '8px 40px 16px', textAlign: 'center' as const }
const eyebrow = { fontSize: '11px', fontWeight: 700 as const, letterSpacing: '0.18em', color: '#10b981', margin: '0 0 12px', textTransform: 'uppercase' as const }
const h1 = { fontSize: '20px', fontWeight: 700 as const, color: '#0b1220', margin: 0, lineHeight: '1.3' }
const detailsWrap = { padding: '16px 32px 8px' }
const detailsTable = { width: '100%', borderCollapse: 'collapse' as const, border: '1px solid #eef0f3', borderRadius: '12px', overflow: 'hidden' as const, backgroundColor: '#fbfbfc' }
const label = { padding: '14px 16px', fontSize: '13px', fontWeight: 500 as const, color: '#6b7280', width: '40%', borderBottom: '1px solid #eef0f3' }
const value = { padding: '14px 16px', fontSize: '14px', color: '#0b1220', borderBottom: '1px solid #eef0f3' }
const footer = { padding: '20px 32px 28px', textAlign: 'center' as const, backgroundColor: '#fafbfc', borderTop: '1px solid #eef0f3', marginTop: '24px' }
const footerBrand = { fontSize: '13px', fontWeight: 700 as const, color: '#0b1220', margin: '0 0 4px' }
const footerText = { fontSize: '12px', color: '#9ca3af', margin: 0 }
