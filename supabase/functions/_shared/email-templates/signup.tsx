/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
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

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  token: string
  logoUrl?: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  token,
  logoUrl,
}: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your {siteName} verification code is {token}</Preview>
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
        <Heading style={h1}>Verify your email</Heading>
        <Text style={text}>
          Welcome to{' '}
          <Link href={siteUrl} style={link}>
            <strong>{siteName}</strong>
          </Link>
          ! Use the verification code below to activate your account
          ({recipient}).
        </Text>
        <Section style={otpWrap}>
          <Text style={otpCode}>{token}</Text>
          <Text style={otpLabel}>This code expires in 15 minutes</Text>
        </Section>
        <Text style={text}>
          Enter this 6-digit code on the verification screen to complete signup.
        </Text>
        <Text style={footer}>
          If you didn't create an account, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }
const container = { padding: '20px 25px', maxWidth: '560px' }
const brandBar = { padding: '0 0 24px', borderBottom: '1px solid #e2e8f0', marginBottom: '24px' }
const brandText = { fontSize: '20px', fontWeight: 'bold' as const, color: '#0f172a', margin: 0 }
const brandAccent = { color: '#1e40af' }
const logo = { maxHeight: '48px', width: 'auto', display: 'block' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#0f172a', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#475569', lineHeight: '1.5', margin: '0 0 20px' }
const link = { color: '#1e40af', textDecoration: 'underline' }
const otpWrap = {
  margin: '28px 0',
  padding: '24px',
  backgroundColor: '#f1f5f9',
  borderRadius: '8px',
  textAlign: 'center' as const,
}
const otpCode = {
  fontSize: '36px',
  fontWeight: 'bold' as const,
  color: '#1e40af',
  letterSpacing: '8px',
  margin: '0 0 8px',
  fontFamily: 'monospace',
}
const otpLabel = { fontSize: '12px', color: '#64748b', margin: 0 }
const footer = { fontSize: '12px', color: '#94a3b8', margin: '30px 0 0' }
