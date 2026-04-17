/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Img, Link, Preview, Section, Text, Button,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Toolsmandu.com'
const SITE_URL = 'https://toolsmandu.com'
const SUPPORT_EMAIL = 'support@toolsmandu.com'
const SUPPORT_WHATSAPP = '+9779864484274'
const WHATSAPP_LINK = 'https://wa.me/9779864484274'

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
    <td style={{ ...cellLabel, backgroundColor: alt ? '#f7f7f7' : '#ffffff' }}>{label}</td>
    <td style={{ ...cellValue, backgroundColor: alt ? '#f7f7f7' : '#ffffff' }}>{value}</td>
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
            <Text style={brandText}>ToolsMandu</Text>
          )}
        </Section>

        <Container style={inner}>
          <Heading style={h1}>Order Received</Heading>
          <Text style={text}>
            Thank you for choosing {SITE_NAME}! We're excited to confirm your recent order with us.
          </Text>
          <Text style={text}>Here are the details:</Text>

          <table style={table} cellPadding={0} cellSpacing={0}>
            <tbody>
              <Row label="Customer Email" value={
                customerEmail ? <Link href={`mailto:${customerEmail}`} style={link}>{customerEmail}</Link> : '—'
              } />
              <Row label="Customer Phone" value={customerPhone || '—'} alt />
              <Row label="Product Name" value={productName || '—'} />
              <Row label="Payment Method" value={paymentMethod || '—'} alt />
              <Row label="Order ID" value={orderId ?? '—'} />
              <Row label="Amount" value={`Rs ${amount ?? '—'}`} alt />
            </tbody>
          </table>

          <Text style={text}>
            The order will be delivered shortly, and you'll receive a separate email with the product information.
          </Text>

          <Text style={text}>
            If you have any questions or concerns regarding your order, please don't hesitate to contact our customer support
            via email at <Link href={`mailto:${SUPPORT_EMAIL}`} style={link}>{SUPPORT_EMAIL}</Link> or Whatsapp: {SUPPORT_WHATSAPP}.
          </Text>

          <Section style={btnWrap}>
            <Button href={WHATSAPP_LINK} style={btnGreen}>Contact us on WhatsApp</Button>
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

const main = { backgroundColor: '#f4f5f7', fontFamily: 'Inter, Arial, sans-serif', margin: 0, padding: '20px 0' }
const outer = { maxWidth: '640px', backgroundColor: '#ffffff', borderRadius: '4px', overflow: 'hidden' as const, padding: 0 }
const header = { backgroundColor: '#5b73c8', padding: '24px', textAlign: 'center' as const }
const logoImg = { maxHeight: '48px', width: 'auto', display: 'inline-block', margin: '0 auto' }
const brandText = { color: '#ffffff', fontSize: '24px', fontWeight: 'bold' as const, margin: 0 }
const inner = { padding: '32px 28px', backgroundColor: '#ffffff' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#1f2937', margin: '0 0 24px', textAlign: 'center' as const }
const text = { fontSize: '14px', color: '#374151', lineHeight: '1.6', margin: '0 0 16px' }
const link = { color: '#1e40af', textDecoration: 'underline' }
const table = { width: '100%', borderCollapse: 'collapse' as const, margin: '20px 0', border: '1px solid #e5e7eb' }
const cellLabel = { padding: '12px 14px', fontSize: '14px', fontWeight: 'bold' as const, color: '#1f2937', border: '1px solid #e5e7eb', width: '35%' }
const cellValue = { padding: '12px 14px', fontSize: '14px', color: '#374151', border: '1px solid #e5e7eb' }
const btnWrap = { textAlign: 'center' as const, margin: '24px 0 8px' }
const btnGreen = { backgroundColor: '#5cb85c', color: '#ffffff', padding: '12px 24px', borderRadius: '4px', fontSize: '14px', fontWeight: 'bold' as const, textDecoration: 'none', display: 'inline-block' }
const footer = { backgroundColor: '#5b73c8', padding: '20px', textAlign: 'center' as const }
const footerText = { color: '#ffffff', fontSize: '13px', margin: 0 }
