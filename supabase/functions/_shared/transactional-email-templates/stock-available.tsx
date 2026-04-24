/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Img, Link, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Toolsmandu.com'
const SITE_URL = 'https://toolsmandu.com'

interface StockAvailableProps {
  productName?: string
  productUrl?: string
  productImage?: string
  logoUrl?: string
  texts?: {
    subject?: string
    eyebrow?: string
    heading?: string
    sub_message?: string
    cta_label?: string
    footer_note?: string
  }
}

const DEFAULT_TEXTS = {
  eyebrow: 'BACK IN STOCK',
  heading: 'It is available now!',
  sub_message: 'The product you have been waiting for is back. Grab it before it sells out again.',
  cta_label: 'Buy Now',
  footer_note: 'You are receiving this because you joined our waiting list.',
}

const StockAvailableEmail = ({
  productName,
  productUrl,
  productImage,
  logoUrl,
  texts,
}: StockAvailableProps) => {
  const overrides = Object.fromEntries(
    Object.entries(texts || {}).filter(([, v]) => typeof v === 'string' && v.trim() !== '')
  )
  const t = { ...DEFAULT_TEXTS, ...overrides }
  const link = SITE_URL

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Body style={main}>
        <Container style={shell}>
          <div style={brandBar}>
            {logoUrl ? (
              <Img src={logoUrl} alt={SITE_NAME} style={logoImg} />
            ) : (
              <Text style={brandText}>{SITE_NAME}</Text>
            )}
          </div>

          <div style={hero}>
            <table style={bellTable} cellPadding={0} cellSpacing={0} role="presentation">
              <tbody><tr><td style={bellCell}>🔔</td></tr></tbody>
            </table>
            <Text style={eyebrow}>{t.eyebrow}</Text>
            <Heading style={h1}>{t.heading}</Heading>
            {t.sub_message && <Text style={subText}>{t.sub_message}</Text>}
          </div>

          {productImage && (
            <div style={imageWrap}>
              <Img src={productImage} alt={productName || 'Product'} style={productImg} />
            </div>
          )}

          {productName && (
            <div style={productCard}>
              <Text style={productLabel}>Product</Text>
              <Text style={productNameStyle}>{productName}</Text>
            </div>
          )}

          <div style={ctaWrap}>
            <Button href={link} style={ctaButton}>
              {t.cta_label}
            </Button>
          </div>

          <div style={footer}>
            <Text style={footerNote}>{t.footer_note}</Text>
            <Text style={footerBrand}>{SITE_NAME}</Text>
            <Text style={footerCopy}>© {new Date().getFullYear()} {SITE_NAME}. All rights reserved.</Text>
          </div>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: StockAvailableEmail,
  subject: (data: Record<string, any>) => {
    const subj = data?.texts?.subject || 'Good news! Your awaited product is back in stock'
    if (data?.productName) {
      return subj.replace('{{product}}', data.productName)
    }
    return subj.replace('{{product}}', 'your awaited item')
  },
  displayName: 'Stock Available Notification',
  previewData: {
    productName: 'En-vato Elements - 1 Month Shared',
    productUrl: 'https://toolsmandu.com/item/envato-elements',
    productImage: 'https://toolsmandu.com/placeholder.svg',
  },
} satisfies TemplateEntry

/* styles */
const main = {
  backgroundColor: '#f4f5f7',
  fontFamily: 'Inter, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif',
  margin: 0,
  padding: '32px 0',
}
const shell = {
  maxWidth: '600px',
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  overflow: 'hidden' as const,
}
const brandBar = { padding: '28px 32px 8px', textAlign: 'center' as const }
const logoImg = { maxHeight: '44px', width: 'auto', display: 'inline-block', margin: '0 auto' }
const brandText = { color: '#0b1220', fontSize: '20px', fontWeight: 700 as const, margin: 0 }

const hero = { padding: '24px 32px 8px', textAlign: 'center' as const }
const bellTable = {
  width: '72px', height: '72px', borderRadius: '36px',
  background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
  margin: '0 auto 16px', borderCollapse: 'separate' as const,
}
const bellCell = {
  width: '72px', height: '72px',
  textAlign: 'center' as const, verticalAlign: 'middle' as const,
  fontSize: '36px', lineHeight: '1', padding: 0,
}
const eyebrow = {
  fontSize: '11px', fontWeight: 700 as const, letterSpacing: '0.18em',
  color: '#d97706', margin: '0 0 12px', textTransform: 'uppercase' as const,
}
const h1 = {
  fontSize: '24px', fontWeight: 700 as const, color: '#0b1220',
  margin: '0 0 12px', lineHeight: '1.3',
}
const subText = { fontSize: '15px', color: '#5b6473', lineHeight: '1.6', margin: 0 }

const imageWrap = { padding: '20px 32px', textAlign: 'center' as const }
const productImg = {
  maxWidth: '240px', width: '100%', height: 'auto',
  borderRadius: '12px', border: '1px solid #eef0f3',
}

const productCard = {
  margin: '8px 32px 24px',
  padding: '18px 22px',
  background: '#fbfbfc',
  border: '1px solid #eef0f3',
  borderRadius: '12px',
  textAlign: 'center' as const,
}
const productLabel = {
  fontSize: '11px', color: '#6b7280', margin: '0 0 4px',
  fontWeight: 600 as const, letterSpacing: '0.16em', textTransform: 'uppercase' as const,
}
const productNameStyle = { fontSize: '16px', color: '#0b1220', fontWeight: 600 as const, margin: 0 }

const ctaWrap = { padding: '8px 32px 32px', textAlign: 'center' as const }
const ctaButton = {
  backgroundColor: '#0b1220',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 600 as const,
  padding: '14px 36px',
  borderRadius: '10px',
  textDecoration: 'none',
  display: 'inline-block',
}

const footer = {
  padding: '20px 32px 28px', textAlign: 'center' as const,
  backgroundColor: '#fafbfc', borderTop: '1px solid #eef0f3',
}
const footerNote = { fontSize: '12px', color: '#6b7280', margin: '0 0 12px', fontStyle: 'italic' as const }
const footerBrand = { fontSize: '13px', fontWeight: 700 as const, color: '#0b1220', margin: '0 0 4px' }
const footerCopy = { fontSize: '12px', color: '#9ca3af', margin: 0 }
