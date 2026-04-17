/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Img, Link, Preview, Section, Text, Button,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Toolsmandu.com'
const SITE_URL = 'https://toolsmandu.com'
const WHATSAPP_LINK = 'https://wa.me/9779864484274'
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
}

const Row = ({ label, value, alt }: { label: string; value: React.ReactNode; alt?: boolean }) => (
  <tr>
    <td style={{ ...cellLabel, backgroundColor: alt ? '#f7f7f7' : '#ffffff' }}>{label}</td>
    <td style={{ ...cellValue, backgroundColor: alt ? '#f7f7f7' : '#ffffff' }}>{value}</td>
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
}: OrderCompletedProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your order is complete - {SITE_NAME}</Preview>
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
          <Heading style={h1}>
            <span style={{ color: '#5b73c8' }}>Order </span>
            <span style={completedHighlight}>Completed</span>
          </Heading>

          <Text style={textCenter}>
            Thank you for your recent order with {SITE_NAME}! We're delighted to inform you that your product is now ready for access.
          </Text>

          {adminMessage && (
            <>
              <Text style={subHeading}>Admin has sent you the following message:</Text>
              <Section style={messageBox}>
                <div style={messageText} dangerouslySetInnerHTML={{ __html: adminMessage }} />
              </Section>
            </>
          )}

          <Text style={subHeading}>For your reminder, here is your order details:</Text>

          <table style={table} cellPadding={0} cellSpacing={0}>
            <tbody>
              <Row label="Customer Email" value={
                customerEmail ? <Link href={`mailto:${customerEmail}`} style={link}>{customerEmail}</Link> : '—'
              } />
              <Row label="Customer Phone" value={customerPhone || '—'} alt />
              <Row label="Product Name" value={productName || '—'} />
              <Row label="Order ID" value={orderId ?? '—'} alt />
              <Row label="Amount" value={`Rs ${amount ?? '—'}`} />
            </tbody>
          </table>

          <Text style={textCenter}>
            If you loved our service, please don't forget to review us.
          </Text>

          <Section style={btnRow}>
            <Button href={GOOGLE_REVIEW_URL} style={btnRed}>Review us on Google</Button>
            {' '}
            <Button href={TRUSTPILOT_URL} style={btnGreenDark}>Review us on Trustpilot</Button>
          </Section>

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
  component: OrderCompletedEmail,
  subject: 'Order Completed',
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

const main = { backgroundColor: '#f4f5f7', fontFamily: 'Inter, Arial, sans-serif', margin: 0, padding: '20px 0' }
const outer = { maxWidth: '640px', backgroundColor: '#ffffff', borderRadius: '4px', overflow: 'hidden' as const, padding: 0 }
const header = { backgroundColor: '#5b73c8', padding: '24px', textAlign: 'center' as const }
const logoImg = { maxHeight: '48px', width: 'auto', display: 'inline-block', margin: '0 auto' }
const brandText = { color: '#ffffff', fontSize: '24px', fontWeight: 'bold' as const, margin: 0 }
const inner = { padding: '32px 28px', backgroundColor: '#ffffff' }
const h1 = { fontSize: '26px', fontWeight: 'bold' as const, margin: '0 0 20px', textAlign: 'center' as const }
const completedHighlight = { backgroundColor: '#fde68a', color: '#1f2937', padding: '2px 10px', borderRadius: '3px' }
const textCenter = { fontSize: '14px', color: '#374151', lineHeight: '1.6', margin: '0 0 16px', textAlign: 'center' as const }
const subHeading = { fontSize: '15px', fontWeight: 'bold' as const, color: '#1f2937', margin: '20px 0 12px', textAlign: 'center' as const }
const messageBox = { backgroundColor: '#eeeeee', padding: '20px 24px', borderRadius: '4px', margin: '0 0 8px' }
const messageText = { fontSize: '14px', color: '#374151', lineHeight: '1.7', textAlign: 'center' as const }
const link = { color: '#1e40af', textDecoration: 'underline' }
const table = { width: '100%', borderCollapse: 'collapse' as const, margin: '12px 0 24px', border: '1px solid #e5e7eb' }
const cellLabel = { padding: '12px 14px', fontSize: '14px', fontWeight: 'bold' as const, color: '#1f2937', border: '1px solid #e5e7eb', width: '35%' }
const cellValue = { padding: '12px 14px', fontSize: '14px', color: '#374151', border: '1px solid #e5e7eb' }
const btnRow = { textAlign: 'center' as const, margin: '20px 0 12px' }
const btnWrap = { textAlign: 'center' as const, margin: '8px 0 12px' }
const btnRed = { backgroundColor: '#d9534f', color: '#ffffff', padding: '12px 22px', borderRadius: '4px', fontSize: '14px', fontWeight: 'bold' as const, textDecoration: 'none', display: 'inline-block', marginRight: '8px' }
const btnGreenDark = { backgroundColor: '#5cb85c', color: '#ffffff', padding: '12px 22px', borderRadius: '4px', fontSize: '14px', fontWeight: 'bold' as const, textDecoration: 'none', display: 'inline-block' }
const btnGreen = { backgroundColor: '#5cb85c', color: '#ffffff', padding: '12px 24px', borderRadius: '4px', fontSize: '14px', fontWeight: 'bold' as const, textDecoration: 'none', display: 'inline-block' }
const footer = { backgroundColor: '#5b73c8', padding: '20px', textAlign: 'center' as const }
const footerText = { color: '#ffffff', fontSize: '13px', margin: 0 }
