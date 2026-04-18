/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface EmailChangeEmailProps {
  siteName: string
  email: string
  newEmail: string
  confirmationUrl: string
  logoUrl?: string
  texts?: {
    heading?: string
    body?: string
    cta_label?: string
    footer_note?: string
  }
}

const DEFAULTS = {
  heading: 'Confirm your email change',
  body: 'Click the button below to confirm your new email address.',
  cta_label: 'Confirm Email Change',
  footer_note: "If you didn't request this change, please secure your account immediately.",
}

export const EmailChangeEmail = ({
  siteName,
  email,
  newEmail,
  confirmationUrl,
  logoUrl,
  texts,
}: EmailChangeEmailProps) => {
  const t = { ...DEFAULTS, ...(texts || {}) }
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Confirm your email change for {siteName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandBar}>
            {logoUrl ? (
              <Img src={logoUrl} alt={siteName} style={logo} />
            ) : (
              <Text style={brandText}>
                <span style={brandAccent}>Tools</span>mandu
              </Text>
            )}
          </Section>
          <Heading style={h1}>{t.heading}</Heading>
          <Text style={text}>
            Changing email from{' '}
            <Link href={`mailto:${email}`} style={link}>{email}</Link>{' '}
            to{' '}
            <Link href={`mailto:${newEmail}`} style={link}>{newEmail}</Link>.
          </Text>
          <div style={text} dangerouslySetInnerHTML={{ __html: t.body }} />
          <Section style={buttonWrap}>
            <Button style={button} href={confirmationUrl}>
              {t.cta_label}
            </Button>
          </Section>
          <div style={footer} dangerouslySetInnerHTML={{ __html: t.footer_note }} />
        </Container>
      </Body>
    </Html>
  )
}

export default EmailChangeEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }
const container = { padding: '20px 25px', maxWidth: '560px' }
const brandBar = { padding: '0 0 24px', borderBottom: '1px solid #e2e8f0', marginBottom: '24px', textAlign: 'center' as const }
const brandText = { fontSize: '20px', fontWeight: 'bold' as const, color: '#0f172a', margin: 0, textAlign: 'center' as const }
const brandAccent = { color: '#1e40af' }
const logo = { maxHeight: '56px', width: 'auto', display: 'inline-block', margin: '0 auto' }
const h1 = { fontSize: '16px', fontWeight: 'bold' as const, color: '#0f172a', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#475569', lineHeight: '1.5', margin: '0 0 20px' }
const link = { color: '#1e40af', textDecoration: 'underline' }
const buttonWrap = { margin: '28px 0' }
const button = {
  backgroundColor: '#1e40af',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 'bold' as const,
  borderRadius: '8px',
  padding: '12px 24px',
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#94a3b8', margin: '30px 0 0' }
