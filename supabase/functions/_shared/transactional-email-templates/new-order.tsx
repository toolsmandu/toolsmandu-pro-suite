/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Img, Link, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Toolsmandu.com'
const SUPPORT_WHATSAPP = '+9779864484274'
const WHATSAPP_LINK = 'https://wa.me/9779864484274'
const WHATSAPP_ICON = 'https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg'

interface NewOrderProps {
  customerEmail?: string
  customerPhone?: string
  productName?: string
  paymentMethod?: string
  orderId?: string | number
  amount?: string | number
  logoUrl?: string
}

const Row = ({ label, value, alt }: { label: string; value: React.ReactNode; alt?: boolean }) => (
  <tr>
    <td style={{ ...cellLabel, backgroundColor: alt ? '#fafafa' : '#ffffff' }}>{label}</td>
    <td style={{ ...cellValue, backgroundColor: alt ? '#fafafa' : '#ffffff' }}>{value}</td>
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
    <Preview>Order Received - {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={outer}>
        <Section style={header}>
          {logoUrl ? (
            <Img src={logoUrl} alt={SITE_NAME} style={logoImg} />
          ) : (
            <Text style={brandText}>{SITE_NAME}</Text>
          )}
        </Section>

        <Container style={inner}>
          <Heading style={h1}>Order Received</Heading>
          <div style={accentBar} />

          <Text style={text}>
            Thank you for choosing <strong>{SITE_NAME}</strong>! We're excited to confirm your recent order with us.
          </Text>
          <Text style={text}>Here are the details:</Text>

          <table style={table} cellPadding={0} cellSpacing={0}>
            <tbody>
              <Row label="Order ID" value={orderId ?? '—'} />
              <Row label="Product Name" value={productName || '—'} alt />
              <Row label="Customer Email" value={
                customerEmail ? <Link href={`mailto:${customerEmail}`} style={link}>{customerEmail}</Link> : '—'
              } />
              <Row label="Customer Phone" value={customerPhone || '—'} alt />
              <Row label="Payment Method" value={paymentMethod || '—'} />
              <Row label="Amount" value={`Rs ${amount ?? '—'}`} alt />
            </tbody>
          </table>

          <Text style={text}>
            The order will be delivered shortly, and you'll receive a separate email with the product information.
          </Text>

          <Text style={text}>
            If you have any questions, contact our support team on WhatsApp:{' '}
            <Link href={WHATSAPP_LINK} style={link}>{SUPPORT_WHATSAPP}</Link>.
          </Text>

          <Section style={waWrap}>
            <Link href={WHATSAPP_LINK} style={waLink}>
              <Img src={WHATSAPP_ICON} alt="WhatsApp" width="56" height="56" style={waIcon} />
            </Link>
            <Text style={waCaption}>Chat with us on WhatsApp</Text>
          </Section>
        </Container>

        <Section style={footer}>
          <Text style={footerText}>© {SITE_NAME}. All Rights Reserved</Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: NewOrderEmail,
  subject: 'Order Received',
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

const main = { backgroundColor: '#f6f6f4', fontFamily: 'Inter, Arial, sans-serif', margin: 0, padding: '24px 0' }
const outer = { maxWidth: '640px', backgroundColor: '#ffffff', borderRadius: '10px', overflow: 'hidden' as const, padding: 0, border: '1px solid #ececec' }
const header = { backgroundColor: '#ffffff', padding: '28px 24px 12px', textAlign: 'center' as const, borderBottom: '1px solid #f0f0f0' }
const logoImg = { maxHeight: '52px', width: 'auto', display: 'inline-block', margin: '0 auto' }
const brandText = { color: '#1f2937', fontSize: '22px', fontWeight: 'bold' as const, margin: 0, letterSpacing: '-0.01em' }
const inner = { padding: '32px 32px 24px', backgroundColor: '#ffffff' }
const h1 = { fontSize: '26px', fontWeight: 'bold' as const, color: '#111827', margin: '0 0 12px', textAlign: 'center' as const, letterSpacing: '-0.01em' }
const accentBar = { width: '56px', height: '3px', backgroundColor: '#111827', margin: '0 auto 24px', borderRadius: '2px' }
const text = { fontSize: '15px', color: '#374151', lineHeight: '1.65', margin: '0 0 16px' }
const link = { color: '#111827', textDecoration: 'underline', fontWeight: 500 as const }
const table = { width: '100%', borderCollapse: 'collapse' as const, margin: '20px 0 24px', border: '1px solid #ececec', borderRadius: '8px', overflow: 'hidden' as const }
const cellLabel = { padding: '13px 16px', fontSize: '14px', fontWeight: 600 as const, color: '#111827', borderBottom: '1px solid #f0f0f0', width: '38%' }
const cellValue = { padding: '13px 16px', fontSize: '14px', color: '#374151', borderBottom: '1px solid #f0f0f0' }
const waWrap = { textAlign: 'center' as const, margin: '28px 0 8px' }
const waLink = { display: 'inline-block', textDecoration: 'none' }
const waIcon = { display: 'inline-block', margin: '0 auto' }
const waCaption = { fontSize: '13px', color: '#6b7280', margin: '10px 0 0', textAlign: 'center' as const }
const footer = { backgroundColor: '#fafafa', padding: '18px', textAlign: 'center' as const, borderTop: '1px solid #f0f0f0' }
const footerText = { color: '#6b7280', fontSize: '12px', margin: 0 }
