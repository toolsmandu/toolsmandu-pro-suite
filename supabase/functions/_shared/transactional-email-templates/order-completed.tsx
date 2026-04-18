/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Img, Link, Preview, Section, Text, Hr, Button,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Toolsmandu.com'
const SUPPORT_WHATSAPP = '+9779864484274'
const WHATSAPP_LINK = 'https://wa.me/9779864484274'
const WHATSAPP_ICON = 'https://cdn-icons-png.flaticon.com/512/3670/3670051.png'
const GOOGLE_REVIEW_URL = 'https://g.page/r/toolsmandu/review'
const TRUSTPILOT_URL = 'https://www.trustpilot.com/review/toolsmandu.com'

interface OrderCompletedProps {
  customerEmail?: string
  customerPhone?: string
  productName?: string
  orderId?: string | number
  amount?: string | number
  adminMessage?: string
  logoUrl?: string
  texts?: {
    eyebrow?: string
    heading?: string
    sub_message?: string
    admin_message_header?: string
    reminder_text?: string
    support_title?: string
    support_text?: string
    review_title?: string
    review_text?: string
  }
}

const DEFAULT_TEXTS = {
  eyebrow: 'ORDER COMPLETED',
  heading: 'Your order is complete',
  sub_message: `Thank you for your recent order with ${SITE_NAME}! We're delighted to inform you that your product is now ready for access.`,
  admin_message_header: 'Admin has sent you the following message',
  reminder_text: 'For your reminder, here is your order details:',
  support_title: 'Need help with your order?',
  support_text: 'Our team is one tap away on WhatsApp.',
  review_title: 'Loved our service?',
  review_text: 'Please take a moment to leave us a review.',
}

const DetailRow = ({ label, value, last }: { label: string; value: React.ReactNode; last?: boolean }) => (
  <tr>
    <td style={{ ...detailLabel, borderBottom: last ? 'none' : '1px solid #eef0f3' }}>{label}</td>
    <td style={{ ...detailValue, borderBottom: last ? 'none' : '1px solid #eef0f3' }}>{value}</td>
  </tr>
)

const OrderCompletedEmail = ({
  customerEmail,
  customerPhone,
  productName,
  orderId,
  amount,
  adminMessage,
  logoUrl,
  texts,
}: OrderCompletedProps) => {
  const t = { ...DEFAULT_TEXTS, ...(texts || {}) }
  return (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Order #{orderId ?? ''} completed — thank you for choosing {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={shell}>
        {/* Brand header */}
        <Section style={brandBar}>
          {logoUrl ? (
            <Img src={logoUrl} alt={SITE_NAME} style={logoImg} />
          ) : (
            <Text style={brandText}>{SITE_NAME}</Text>
          )}
        </Section>

        {/* Hero */}
        <Section style={hero}>
          <Text style={eyebrow}>{t.eyebrow}</Text>
          <Heading style={h1}>{t.heading}</Heading>
          <Text style={heroSub}>{t.sub_message}</Text>
        </Section>

        {/* Order ID card */}
        <Section style={amountCard}>
          <Text style={amountLabel}>Order ID</Text>
          <Text style={amountValue}>#{orderId ?? '—'}</Text>
        </Section>

        {/* Admin message */}
        {adminMessage && (
          <Section style={messageWrap}>
            <Text style={sectionTitle}>{t.admin_message_header}</Text>
            <Section style={messageBox}>
              <div style={messageText} dangerouslySetInnerHTML={{ __html: adminMessage }} />
            </Section>
          </Section>
        )}

        {/* Reminder line */}
        <Section style={reminderWrap}>
          <Text style={reminderText}>{t.reminder_text}</Text>
        </Section>

        {/* Details */}
        <Section style={detailsWrap}>
          <Text style={sectionTitle}>Order Details</Text>
          <table style={detailsTable} cellPadding={0} cellSpacing={0}>
            <tbody>
              <DetailRow label="Email" value={
                customerEmail ? <Link href={`mailto:${customerEmail}`} style={link}>{customerEmail}</Link> : '—'
              } />
              <DetailRow label="Phone" value={customerPhone || '—'} />
              <DetailRow label="Product" value={productName || '—'} />
              <DetailRow label="Amount" value={`Rs ${amount ?? '—'}`} last />
            </tbody>
          </table>
        </Section>

        {/* Review CTA */}
        <Section style={reviewWrap}>
          <Text style={reviewTitle}>{t.review_title}</Text>
          <Text style={reviewText}>{t.review_text}</Text>
          <Section style={btnRow}>
            <Button href={GOOGLE_REVIEW_URL} style={btnGoogle}>Review on Google</Button>
            {' '}
            <Button href={TRUSTPILOT_URL} style={btnTrustpilot}>Review on Trustpilot</Button>
          </Section>
        </Section>

        <Hr style={divider} />

        {/* Support */}
        <Section style={supportSection}>
          <Text style={supportTitle}>{t.support_title}</Text>
          <Text style={supportText}>{t.support_text}</Text>
          <Link href={WHATSAPP_LINK} style={supportNumber}>
            <Img
              src={WHATSAPP_ICON}
              alt="WhatsApp"
              width="18"
              height="18"
              style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }}
            />
            <span style={{ verticalAlign: 'middle' }}>{SUPPORT_WHATSAPP}</span>
          </Link>
        </Section>

        {/* Footer */}
        <Section style={footer}>
          <Text style={footerBrand}>{SITE_NAME}</Text>
          <Text style={footerText}>© {new Date().getFullYear()} {SITE_NAME}. All rights reserved.</Text>
        </Section>
      </Container>
    </Body>
  </Html>
  )
}

export const template = {
  component: OrderCompletedEmail,
  subject: (data: Record<string, any>) => data?.texts?.subject || 'Your Toolsmandu order is now completed!',
  displayName: 'Order Completed',
  previewData: {
    customerEmail: 'uddheshyastudio@gmail.com',
    customerPhone: '+9779803356474',
    productName: 'En-vato Elements - 1 Month Shared',
    orderId: '19525',
    amount: '1200',
    adminMessage: '<p><em>Congratulations! Your order is complete now.</em></p><p><strong>How to find login details of purchased services?</strong></p><p>✅ Login into <a href="https://toolsmandu.com">toolsmandu.com</a></p><p>✅ Then, Go to <strong>Profile &gt; Orders</strong> to find login details of purchased services.</p>',
  },
} satisfies TemplateEntry

/* ---------- styles ---------- */
const main = {
  backgroundColor: '#f4f5f7',
  fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
  margin: 0,
  padding: '32px 0',
  WebkitFontSmoothing: 'antialiased' as const,
}
const shell = {
  maxWidth: '600px',
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  overflow: 'hidden' as const,
  boxShadow: '0 1px 2px rgba(16,24,40,0.04), 0 8px 24px rgba(16,24,40,0.06)',
}
const brandBar = { padding: '28px 32px 8px', textAlign: 'center' as const, backgroundColor: '#ffffff' }
const logoImg = { maxHeight: '44px', width: 'auto', display: 'inline-block', margin: '0 auto' }
const brandText = { color: '#0b1220', fontSize: '20px', fontWeight: 700 as const, margin: 0, letterSpacing: '-0.02em' }

const hero = { padding: '8px 40px 28px', textAlign: 'center' as const, backgroundColor: '#ffffff' }
const eyebrow = {
  fontSize: '11px', fontWeight: 700 as const, letterSpacing: '0.18em',
  color: '#6b7280', margin: '0 0 12px', textTransform: 'uppercase' as const,
}
const h1 = {
  fontSize: '28px', fontWeight: 700 as const, color: '#0b1220',
  margin: '0 0 12px', letterSpacing: '-0.02em', lineHeight: '1.2',
}
const heroSub = { fontSize: '15px', color: '#5b6473', lineHeight: '1.6', margin: '0 0 20px' }

const amountCard = {
  margin: '0 0 24px', padding: '22px 24px',
  background: 'linear-gradient(135deg, #0b1220 0%, #1a2540 100%)',
  textAlign: 'center' as const,
}
const amountLabel = {
  fontSize: '11px', color: 'rgba(255,255,255,0.65)', margin: '0 0 6px',
  fontWeight: 600 as const, letterSpacing: '0.16em', textTransform: 'uppercase' as const,
}
const amountValue = {
  fontSize: '32px', color: '#ffffff', fontWeight: 700 as const, margin: 0,
  letterSpacing: '-0.02em',
}

const messageWrap = { padding: '0 32px 8px' }
const messageBox = {
  backgroundColor: '#fbfbfc', border: '1px solid #eef0f3',
  borderRadius: '12px', padding: '18px 20px',
}
const messageText = { fontSize: '14px', color: '#0b1220', lineHeight: '1.7' }
const reminderWrap = { padding: '12px 32px 0', textAlign: 'center' as const }
const reminderText = { fontSize: '14px', color: '#5b6473', margin: 0, lineHeight: '1.6' }

const detailsWrap = { padding: '16px 32px 8px' }
const sectionTitle = {
  fontSize: '12px', fontWeight: 700 as const, color: '#6b7280',
  letterSpacing: '0.14em', textTransform: 'uppercase' as const, margin: '0 0 12px',
}
const detailsTable = {
  width: '100%', borderCollapse: 'collapse' as const,
  border: '1px solid #eef0f3', borderRadius: '12px', overflow: 'hidden' as const,
  backgroundColor: '#fbfbfc',
}
const detailLabel = {
  padding: '14px 16px', fontSize: '13px', fontWeight: 500 as const,
  color: '#6b7280', width: '40%', verticalAlign: 'top' as const,
}
const detailValue = {
  padding: '14px 16px', fontSize: '14px', color: '#0b1220',
  verticalAlign: 'top' as const,
}
const link = { color: '#0b1220', textDecoration: 'underline', fontWeight: 500 as const }

const reviewWrap = { padding: '20px 32px 8px', textAlign: 'center' as const }
const reviewTitle = { fontSize: '16px', fontWeight: 600 as const, color: '#0b1220', margin: '0 0 4px' }
const reviewText = { fontSize: '14px', color: '#6b7280', margin: '0 0 14px' }
const btnRow = { textAlign: 'center' as const, margin: 0 }
const btnGoogle = {
  backgroundColor: '#4285F4', color: '#ffffff', padding: '10px 18px',
  borderRadius: '999px', fontSize: '14px', fontWeight: 600 as const,
  textDecoration: 'none', display: 'inline-block', marginRight: '8px',
}
const btnTrustpilot = {
  backgroundColor: '#00b67a', color: '#ffffff', padding: '10px 18px',
  borderRadius: '999px', fontSize: '14px', fontWeight: 600 as const,
  textDecoration: 'none', display: 'inline-block',
}

const divider = { borderColor: '#eef0f3', margin: '24px 32px' }

const supportSection = { padding: '4px 32px 28px', textAlign: 'center' as const }
const supportTitle = {
  fontSize: '16px', fontWeight: 600 as const, color: '#0b1220',
  margin: '16px 0 4px',
}
const supportText = { fontSize: '14px', color: '#6b7280', margin: '0 0 8px', lineHeight: '1.5' }
const supportNumber = {
  display: 'inline-block', fontSize: '15px', fontWeight: 600 as const,
  color: '#ffffff', textDecoration: 'none', padding: '10px 18px',
  backgroundColor: '#25D366', borderRadius: '999px', marginTop: '4px',
  boxShadow: '0 6px 16px rgba(37,211,102,0.35)',
}

const footer = {
  padding: '20px 32px 28px', textAlign: 'center' as const,
  backgroundColor: '#fafbfc', borderTop: '1px solid #eef0f3',
}
const footerBrand = { fontSize: '13px', fontWeight: 700 as const, color: '#0b1220', margin: '0 0 4px', letterSpacing: '-0.01em' }
const footerText = { fontSize: '12px', color: '#9ca3af', margin: 0 }
