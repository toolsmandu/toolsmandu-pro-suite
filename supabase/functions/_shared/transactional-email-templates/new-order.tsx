/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Img, Link, Preview, Section, Text, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Toolsmandu.com'
const SUPPORT_WHATSAPP = '+9779864484274'
const WHATSAPP_LINK = 'https://wa.me/9779864484274'
const WHATSAPP_ICON = 'https://cdn-icons-png.flaticon.com/512/3670/3670051.png'

interface NewOrderProps {
  customerEmail?: string
  customerPhone?: string
  productName?: string
  paymentMethod?: string
  orderId?: string | number
  amount?: string | number
  logoUrl?: string
}

const DetailRow = ({ label, value, last }: { label: string; value: React.ReactNode; last?: boolean }) => (
  <tr>
    <td style={{ ...detailLabel, borderBottom: last ? 'none' : '1px solid #eef0f3' }}>{label}</td>
    <td style={{ ...detailValue, borderBottom: last ? 'none' : '1px solid #eef0f3' }}>{value}</td>
  </tr>
)

const NewOrderEmail = ({
  customerEmail,
  customerPhone,
  productName,
  paymentMethod,
  orderId,
  amount,
  logoUrl,
}: NewOrderProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Order #{orderId ?? ''} confirmed — thank you for choosing {SITE_NAME}</Preview>
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
          <Text style={eyebrow}>ORDER CONFIRMATION</Text>
          <Heading style={h1}>Thank you for your order</Heading>
          <Text style={heroSub}>
            We've received your order and it's being prepared. A separate email with your product details will follow shortly.
          </Text>
        </Section>

        {/* Order ID card */}
        <Section style={amountCard}>
          <Text style={amountLabel}>Order ID</Text>
          <Text style={amountValue}>#{orderId ?? '—'}</Text>
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
              <DetailRow label="Product" value={<strong style={{ color: '#0b1220' }}>{productName || '—'}</strong>} />
              <DetailRow label="Amount" value={<strong style={{ color: '#0b1220' }}>Rs {amount ?? '—'}</strong>} />
              <DetailRow label="Payment Method" value={paymentMethod || '—'} last />
            </tbody>
          </table>
        </Section>

        <Hr style={divider} />

        {/* Support */}
        <Section style={supportSection}>
          <Text style={supportTitle}>Need help with your order?</Text>
          <Text style={supportText}>
            Our team is one tap away on WhatsApp.
          </Text>
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

export const template = {
  component: NewOrderEmail,
  subject: (data: Record<string, any>) =>
    data?.orderId ? `Order #${data.orderId} confirmed` : 'Order Confirmed',
  displayName: 'New Order',
  previewData: {
    customerEmail: 'prashannapradhan@gmail.com',
    customerPhone: '+9779768970959',
    productName: 'IPTV - 1 Month 1 Screen',
    paymentMethod: 'Khalti',
    orderId: '20760',
    amount: '600',
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
const pillWrap = { textAlign: 'center' as const, margin: 0 }
const pill = {
  display: 'inline-block', padding: '7px 14px', backgroundColor: '#f0f2f5',
  color: '#0b1220', fontSize: '13px', fontWeight: 600 as const, borderRadius: '999px',
  letterSpacing: '0.02em', margin: 0,
}

const amountCard = {
  margin: '0 32px 24px', padding: '22px 24px',
  background: 'linear-gradient(135deg, #0b1220 0%, #1a2540 100%)',
  borderRadius: '14px', textAlign: 'center' as const,
}
const amountLabel = {
  fontSize: '11px', color: 'rgba(255,255,255,0.65)', margin: '0 0 6px',
  fontWeight: 600 as const, letterSpacing: '0.16em', textTransform: 'uppercase' as const,
}
const amountValue = {
  fontSize: '32px', color: '#ffffff', fontWeight: 700 as const, margin: 0,
  letterSpacing: '-0.02em',
}

const detailsWrap = { padding: '0 32px 8px' }
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
  fontWeight: 500 as const, verticalAlign: 'top' as const,
}
const link = { color: '#0b1220', textDecoration: 'underline', fontWeight: 500 as const }

const divider = { borderColor: '#eef0f3', margin: '24px 32px' }

const supportSection = { padding: '4px 32px 28px', textAlign: 'center' as const }
const waCircle = {
  display: 'inline-block', width: '64px', height: '64px',
  backgroundColor: '#25D366', borderRadius: '50%', padding: '12px',
  textDecoration: 'none', boxShadow: '0 6px 16px rgba(37,211,102,0.35)',
  margin: '0 auto',
}
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
