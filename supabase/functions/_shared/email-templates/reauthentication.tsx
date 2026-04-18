/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
  logoUrl?: string
  texts?: {
    heading?: string
    body?: string
    footer_note?: string
  }
}

const DEFAULTS = {
  heading: 'Confirm reauthentication',
  body: "Use the code below to confirm your identity:",
  footer_note: "This code will expire shortly. If you didn't request this, you can safely ignore this email.",
}

export const ReauthenticationEmail = ({ token, logoUrl, texts }: ReauthenticationEmailProps) => {
  const t = { ...DEFAULTS, ...(texts || {}) }
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Your verification code</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandBar}>
            {logoUrl ? (
              <Img src={logoUrl} alt="Toolsmandu" style={logo} />
            ) : (
              <Text style={brandText}>
                <span style={brandAccent}>Tools</span>mandu
              </Text>
            )}
          </Section>
          <Heading style={h1}>{t.heading}</Heading>
          <div style={text} dangerouslySetInnerHTML={{ __html: t.body }} />
          <Text style={codeStyle}>{token}</Text>
          <div style={footer} dangerouslySetInnerHTML={{ __html: t.footer_note }} />
        </Container>
      </Body>
    </Html>
  )
}

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }
const container = { padding: '20px 25px', maxWidth: '560px' }
const brandBar = { padding: '0 0 24px', borderBottom: '1px solid #e2e8f0', marginBottom: '24px', textAlign: 'center' as const }
const brandText = { fontSize: '20px', fontWeight: 'bold' as const, color: '#0f172a', margin: 0, textAlign: 'center' as const }
const brandAccent = { color: '#1e40af' }
const logo = { maxHeight: '56px', width: 'auto', display: 'inline-block', margin: '0 auto' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#0f172a', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#475569', lineHeight: '1.5', margin: '0 0 20px' }
const codeStyle = {
  fontFamily: 'Courier, monospace',
  fontSize: '26px',
  fontWeight: 'bold' as const,
  color: '#1e40af',
  letterSpacing: '4px',
  margin: '0 0 30px',
}
const footer = { fontSize: '12px', color: '#94a3b8', margin: '30px 0 0' }
